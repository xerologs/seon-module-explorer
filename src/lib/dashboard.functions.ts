import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import { PLANS, RESET_WINDOW_MS, planLimit, tierRank, type Role, type Tier } from "./plans";
import { MODULES, moduleBySlug } from "./modules-catalog";

/* ────────────────────────── helpers ────────────────────────── */

type AccountRow = {
  id: string;
  handle: string;
  secret_id: string;
  tier: Tier;
  role: Role;
  total_lookups: number;
};

type UsageRow = {
  user_id: string;
  daily_usage: number;
  last_reset_at: string; // ISO
  one_time_credits: number;
};

async function authenticate(handle: string, secret_id: string) {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("skid_accounts" as never)
    .select("id, handle, secret_id, tier, role, total_lookups")
    .eq("handle_lower", handle.toLowerCase())
    .maybeSingle();
  const acct = data as AccountRow | null;
  if (!acct || acct.secret_id !== secret_id) throw new Error("Unauthorized");
  return acct;
}

/** Returns the up-to-date usage row, performing the 24h reset if required. */
async function getOrResetUsage(userId: string): Promise<UsageRow> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data } = await supabaseAdmin
    .from("usage_stats" as never)
    .select("user_id, daily_usage, last_reset_at, one_time_credits")
    .eq("user_id", userId)
    .maybeSingle();
  let usage = data as unknown as UsageRow | null;

  if (!usage) {
    const { data: ins } = await supabaseAdmin
      .from("usage_stats" as never)
      .insert({ user_id: userId } as never)
      .select("user_id, daily_usage, last_reset_at, one_time_credits")
      .single();
    usage = ins as unknown as UsageRow;
  }

  const lastReset = new Date(usage.last_reset_at).getTime();
  if (Date.now() - lastReset >= RESET_WINDOW_MS) {
    const { data: upd } = await supabaseAdmin
      .from("usage_stats" as never)
      .update({ daily_usage: 0, last_reset_at: new Date().toISOString() } as never)
      .eq("user_id", userId)
      .select("user_id, daily_usage, last_reset_at, one_time_credits")
      .single();
    usage = upd as unknown as UsageRow;
  }
  return usage;
}

function isUnlimited(acct: AccountRow): boolean {
  return acct.role === "master_admin" || acct.role === "admin" || acct.role === "support";
}

/* ────────────────────────── status ────────────────────────── */

const handleAuth = z.object({ handle: z.string().min(1), secret_id: z.string().min(1) });

export const getUserStatus = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => handleAuth.parse(data))
  .handler(async ({ data }) => {
    const acct = await authenticate(data.handle, data.secret_id);
    const usage = await getOrResetUsage(acct.id);
    const limit = isUnlimited(acct) ? Infinity : planLimit(acct.tier);
    const lastReset = new Date(usage.last_reset_at).getTime();
    const refreshAt = lastReset + RESET_WINDOW_MS;

    return {
      handle: acct.handle,
      tier: acct.tier,
      role: acct.role,
      totalLookups: acct.total_lookups,
      dailyUsage: usage.daily_usage,
      dailyLimit: limit === Infinity ? null : limit,
      oneTimeCredits: usage.one_time_credits,
      lastResetAt: lastReset,
      refreshAt,
      unlimited: isUnlimited(acct),
    };
  });

export const listModules = createServerFn({ method: "GET" }).handler(async () => {
  return MODULES.map((m) => ({
    slug: m.slug,
    name: m.name,
    category: m.category,
    description: m.description,
    inputLabel: m.inputLabel,
    inputPlaceholder: m.inputPlaceholder,
    minTier: m.minTier,
    comingSoon: !!m.comingSoon,
    image: m.image ?? null,
  }));
});

/* ────────────────────────── module execution ────────────────────────── */

const executeSchema = z.object({
  handle: z.string().min(1),
  secret_id: z.string().min(1),
  slug: z.string().min(1),
  query: z.string().min(1).max(500),
});

export const executeModule = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => executeSchema.parse(data))
  .handler(async ({ data }) => {
    const acct = await authenticate(data.handle, data.secret_id);
    const mod = moduleBySlug(data.slug);
    if (!mod) throw new Error("Unknown module");

    // Coming-soon modules are catalog-only and cannot be executed.
    if (mod.comingSoon) {
      throw new Error("Module not yet available — coming soon.");
    }

    // Tier vs module requirement. Free (Guest) tier has no lookup quota.
    if (!isUnlimited(acct) && tierRank(acct.tier) < tierRank(mod.minTier)) {
      throw new Error(`Module locked — requires ${mod.minTier} tier or higher.`);
    }

    // 3. Rate-limit: one_time_credits first, then daily quota
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    let usedOneTime = false;
    if (!isUnlimited(acct)) {
      const usage = await getOrResetUsage(acct.id);
      if (usage.one_time_credits > 0) {
        usedOneTime = true;
      } else if (usage.daily_usage >= planLimit(acct.tier)) {
        throw new Error("Rate Limit Exceeded — wait for the 24h reset or upgrade your plan.");
      }
    }

    // Dispatch to the module's provider
    const { runModule } = await import("./osint-providers.server");
    const upstream = await runModule(mod, data.query);
    const upstreamJson = upstream.dataJson;
    const upstreamError = upstream.error;

    // Only charge credits when the upstream call actually succeeded.
    if (!isUnlimited(acct) && upstream.ok && !upstreamError) {
      if (usedOneTime) {
        await supabaseAdmin.rpc as never; // noop — we use atomic update below
        await supabaseAdmin
          .from("usage_stats" as never)
          .update({ one_time_credits: (await getOrResetUsage(acct.id)).one_time_credits - 1 } as never)
          .eq("user_id", acct.id);
      } else {
        const fresh = await getOrResetUsage(acct.id);
        await supabaseAdmin
          .from("usage_stats" as never)
          .update({ daily_usage: fresh.daily_usage + 1 } as never)
          .eq("user_id", acct.id);
      }
      await supabaseAdmin
        .from("skid_accounts" as never)
        .update({ total_lookups: acct.total_lookups + 1 } as never)
        .eq("id", acct.id);
    }

    return {
      ok: !upstreamError,
      error: upstreamError,
      dataJson: upstreamJson,
      charged: upstream.ok && !upstreamError
        ? (usedOneTime ? ("credit" as const) : ("daily" as const))
        : ("none" as const),
    };
  });

/* ────────────────────────── admin ────────────────────────── */

async function requireRole(handle: string, secret_id: string, required: Role[]) {
  const acct = await authenticate(handle, secret_id);
  if (!required.includes(acct.role)) throw new Error("Forbidden");
  return acct;
}

export const adminListUsers = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => handleAuth.parse(data))
  .handler(async ({ data }) => {
    const actor = await requireRole(data.handle, data.secret_id, ["support", "admin", "master_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: accts } = await supabaseAdmin
      .from("skid_accounts" as never)
      .select("id, handle, secret_id, tier, role, total_lookups, created_at")
      .order("created_at", { ascending: false })
      .limit(200);
    const { data: usages } = await supabaseAdmin
      .from("usage_stats" as never)
      .select("user_id, daily_usage, last_reset_at, one_time_credits");
    const usageMap = new Map<string, UsageRow>();
    for (const u of (usages as UsageRow[] | null) ?? []) usageMap.set(u.user_id, u);
    return ((accts as (AccountRow & { secret_id: string })[] | null) ?? []).map((a) => {
      const u = usageMap.get(a.id);
      // Never expose the master_admin's SKID id to anyone but themselves.
      const isProtected = a.role === "master_admin" && a.id !== actor.id;
      return {
        id: a.id,
        handle: a.handle,
        secret_id: isProtected ? "••••••••••••••••" : a.secret_id,
        tier: a.tier,
        role: a.role,
        total_lookups: a.total_lookups,
        daily_usage: u?.daily_usage ?? 0,
        one_time_credits: u?.one_time_credits ?? 0,
        last_reset_at: u?.last_reset_at ?? null,
      };
    });
  });

const updateSchema = z.object({
  handle: z.string().min(1),
  secret_id: z.string().min(1),
  target_id: z.string().uuid(),
  tier: z.enum(["Guest", "Basic", "Investigator", "Lifetime"]).optional(),
  add_credits: z.number().int().min(0).max(100_000).optional(),
  role: z.enum(["user", "support", "admin", "master_admin"]).optional(),
});

export const adminUpdateUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => updateSchema.parse(data))
  .handler(async ({ data }) => {
    const actor = await requireRole(data.handle, data.secret_id, ["admin", "master_admin"]);
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    // Load target
    const { data: tgtRow } = await supabaseAdmin
      .from("skid_accounts" as never)
      .select("id, handle, role, tier")
      .eq("id", data.target_id)
      .maybeSingle();
    const tgt = tgtRow as { id: string; handle: string; role: Role; tier: Tier } | null;
    if (!tgt) throw new Error("Target not found");

    // Privilege guard: admins cannot touch other admins or master_admin
    if (actor.role === "admin" && (tgt.role === "admin" || tgt.role === "master_admin")) {
      throw new Error("Admins cannot modify other admins");
    }

    // Only master_admin can change roles, and never demote/promote other master_admins
    if (data.role !== undefined) {
      if (actor.role !== "master_admin") throw new Error("Only master_admin can change roles");
      if (tgt.role === "master_admin") throw new Error("Cannot modify master_admin role");
      if (data.role === "master_admin") throw new Error("Cannot grant master_admin role");
      await supabaseAdmin
        .from("skid_accounts" as never)
        .update({ role: data.role } as never)
        .eq("id", data.target_id);
    }

    if (data.tier) {
      await supabaseAdmin
        .from("skid_accounts" as never)
        .update({ tier: data.tier } as never)
        .eq("id", data.target_id);
    }
    if (data.add_credits && data.add_credits > 0) {
      // Ensure usage row exists (trigger should have created it)
      const cur = await getOrResetUsage(data.target_id);
      await supabaseAdmin
        .from("usage_stats" as never)
        .update({ one_time_credits: cur.one_time_credits + data.add_credits } as never)
        .eq("user_id", data.target_id);
    }
    return { ok: true };
  });

const deleteSchema = z.object({
  handle: z.string().min(1),
  secret_id: z.string().min(1),
  target_id: z.string().uuid(),
});

export const adminDeleteUser = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => deleteSchema.parse(data))
  .handler(async ({ data }) => {
    const actor = await requireRole(data.handle, data.secret_id, ["admin", "master_admin"]);
    if (actor.id === data.target_id) throw new Error("You cannot delete your own account");
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
    const { data: tgtRow } = await supabaseAdmin
      .from("skid_accounts" as never)
      .select("id, handle, role")
      .eq("id", data.target_id)
      .maybeSingle();
    const tgt = tgtRow as { id: string; handle: string; role: Role } | null;
    if (!tgt) throw new Error("Target not found");
    if (tgt.role === "master_admin") throw new Error("Cannot delete master_admin account");
    // wipe related rows first (no FK cascade guaranteed)
    await supabaseAdmin.from("usage_stats" as never).delete().eq("user_id", tgt.id);
    await supabaseAdmin.from("case_findings" as never).delete().eq("user_id", tgt.id);
    await supabaseAdmin.from("chat_messages" as never).delete().in(
      "thread_id",
      ((await supabaseAdmin.from("chat_threads" as never).select("id").eq("user_id", tgt.id)).data as { id: string }[] | null ?? []).map((r) => r.id),
    );
    await supabaseAdmin.from("chat_threads" as never).delete().eq("user_id", tgt.id);
    await supabaseAdmin.from("cases" as never).delete().eq("user_id", tgt.id);
    await supabaseAdmin.from("skid_accounts" as never).delete().eq("id", tgt.id);
    return { ok: true };
  });
