import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { moduleBySlug } from "./modules-catalog";

const auth = z.object({ handle: z.string().min(1), secret_id: z.string().min(1) });

async function authn(handle: string, secret_id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("skid_accounts" as never)
    .select("id, handle, secret_id, tier, role")
    .eq("handle_lower", handle.toLowerCase())
    .maybeSingle();
  const acct = data as { id: string; handle: string; secret_id: string; tier: string; role: string } | null;
  if (!acct || acct.secret_id !== secret_id) throw new Error("Unauthorized");
  return acct;
}

export type CaseRow = {
  id: string; name: string; notes: string; status: string;
  created_at: string; updated_at: string;
};
export type FindingRow = {
  id: string; case_id: string; module_slug: string; module_name: string;
  module_category: string; query: string; result_json: string; created_at: string;
};

export const listCases = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.parse(d))
  .handler(async ({ data }) => {
    const acct = await authn(data.handle, data.secret_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: rows } = await supabaseAdmin
      .from("cases" as never)
      .select("id, name, notes, status, created_at, updated_at")
      .eq("user_id", acct.id)
      .order("updated_at", { ascending: false });
    return (rows ?? []) as CaseRow[];
  });

export const createCase = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({ name: z.string().min(1).max(120) }).parse(d))
  .handler(async ({ data }) => {
    const acct = await authn(data.handle, data.secret_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row, error } = await supabaseAdmin
      .from("cases" as never)
      .insert({ user_id: acct.id, name: data.name } as never)
      .select("id, name, notes, status, created_at, updated_at")
      .single();
    if (error) throw new Error(error.message);
    return row as CaseRow;
  });

export const deleteCase = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({ case_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const acct = await authn(data.handle, data.secret_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("cases" as never).delete().eq("id", data.case_id).eq("user_id", acct.id);
    return { ok: true };
  });

export const getCase = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({ case_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const acct = await authn(data.handle, data.secret_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: row } = await supabaseAdmin
      .from("cases" as never)
      .select("id, name, notes, status, created_at, updated_at")
      .eq("id", data.case_id).eq("user_id", acct.id).maybeSingle();
    if (!row) throw new Error("Case not found");
    const { data: findings } = await supabaseAdmin
      .from("case_findings" as never)
      .select("id, case_id, module_slug, module_name, module_category, query, result_json, created_at")
      .eq("case_id", data.case_id)
      .order("created_at", { ascending: false });
    return { caseRow: row as CaseRow, findings: (findings ?? []) as FindingRow[] };
  });

export const updateCase = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({
    case_id: z.string().uuid(),
    notes: z.string().max(50_000).optional(),
    name: z.string().min(1).max(120).optional(),
    status: z.enum(["open", "closed", "archived"]).optional(),
  }).parse(d))
  .handler(async ({ data }) => {
    const acct = await authn(data.handle, data.secret_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const patch: Record<string, unknown> = {};
    if (data.notes !== undefined) patch.notes = data.notes;
    if (data.name !== undefined) patch.name = data.name;
    if (data.status !== undefined) patch.status = data.status;
    if (!Object.keys(patch).length) return { ok: true };
    await supabaseAdmin.from("cases" as never).update(patch as never).eq("id", data.case_id).eq("user_id", acct.id);
    return { ok: true };
  });

export const addFinding = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({
    case_id: z.string().uuid(),
    slug: z.string().min(1),
    query: z.string().min(1).max(500),
    result_json: z.string().max(200_000),
  }).parse(d))
  .handler(async ({ data }) => {
    const acct = await authn(data.handle, data.secret_id);
    const mod = moduleBySlug(data.slug);
    if (!mod) throw new Error("Unknown module");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: own } = await supabaseAdmin
      .from("cases" as never).select("id").eq("id", data.case_id).eq("user_id", acct.id).maybeSingle();
    if (!own) throw new Error("Case not found");
    const { error } = await supabaseAdmin.from("case_findings" as never).insert({
      case_id: data.case_id, user_id: acct.id,
      module_slug: data.slug, module_name: mod.name, module_category: mod.category,
      query: data.query, result_json: data.result_json,
    } as never);
    if (error) throw new Error(error.message);
    await supabaseAdmin.from("cases" as never)
      .update({ updated_at: new Date().toISOString() } as never).eq("id", data.case_id);
    return { ok: true };
  });

export const deleteFinding = createServerFn({ method: "POST" })
  .inputValidator((d: unknown) => auth.extend({ finding_id: z.string().uuid() }).parse(d))
  .handler(async ({ data }) => {
    const acct = await authn(data.handle, data.secret_id);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    await supabaseAdmin.from("case_findings" as never).delete().eq("id", data.finding_id).eq("user_id", acct.id);
    return { ok: true };
  });
