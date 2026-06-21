import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Tier, Role } from "./plans";

const HANDLE_RE = /^[a-zA-Z0-9_]{3,20}$/;
const SECRET_RE = /^SKID-[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/;

// Master "Xero" hardcoded credentials. The DB seeds an account with these
// values; the server also accepts/repairs them on every login as a safety net.
const XERO_HANDLE = "xero";
const XERO_KEY = "XEROGOATLOLXD67";

export type AuthProfile = {
  id: string;
  handle: string;
  secret_id: string;
  tier: Tier;
  role: Role;
};

function generateSecretId() {
  const alphabet = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  const block = () =>
    Array.from({ length: 4 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join("");
  return `SKID-${block()}-${block()}-${block()}`;
}

const signupSchema = z.object({
  handle: z.string().regex(HANDLE_RE, "3–20 chars, letters/numbers/underscore only"),
  agreed: z.literal(true, { errorMap: () => ({ message: "You must agree to the terms" }) }),
  captcha: z.literal(true, { errorMap: () => ({ message: "Confirm you are not a robot" }) }),
});

export const signupAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => signupSchema.parse(data))
  .handler(async ({ data }): Promise<AuthProfile> => {
    const { supabaseAdmin } = await import("@/integrations/supabase/client.server");

    const handleLower = data.handle.toLowerCase();
    if (handleLower === XERO_HANDLE) throw new Error("Handle already taken");

    const { data: existing } = await supabaseAdmin
      .from("skid_accounts" as never)
      .select("id")
      .eq("handle_lower", handleLower)
      .maybeSingle();
    if (existing) throw new Error("Handle already taken");

    for (let attempt = 0; attempt < 5; attempt++) {
      const secret_id = generateSecretId();
      const { data: inserted, error } = await supabaseAdmin
        .from("skid_accounts" as never)
        .insert({ handle: data.handle, handle_lower: handleLower, secret_id } as never)
        .select("id, handle, secret_id, tier, role")
        .single();
      if (!error && inserted) return inserted as AuthProfile;
      if (error && !error.message.toLowerCase().includes("secret_id")) {
        if (error.message.toLowerCase().includes("handle")) throw new Error("Handle already taken");
        throw new Error("Could not create account");
      }
    }
    throw new Error("Could not generate unique key, try again");
  });

const loginSchema = z.object({
  handle: z.string().min(1, "Handle required"),
  secret_id: z.string().min(1, "Key required"),
});

async function loadProfile(handle: string, secret_id: string): Promise<AuthProfile | null> {
  const { supabaseAdmin } = await import("@/integrations/supabase/client.server");
  const { data: row } = await supabaseAdmin
    .from("skid_accounts" as never)
    .select("id, handle, secret_id, tier, role")
    .eq("handle_lower", handle.toLowerCase())
    .maybeSingle();
  const acct = row as AuthProfile | null;
  if (!acct || acct.secret_id !== secret_id) return null;
  return acct;
}

export const loginAccount = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => loginSchema.parse(data))
  .handler(async ({ data }) => {
    // Standard accounts use the SKID key format; Xero uses the legacy hardcoded key.
    const isXero =
      data.handle.toLowerCase() === XERO_HANDLE && data.secret_id === XERO_KEY;
    if (!isXero && !SECRET_RE.test(data.secret_id)) {
      throw new Error("Invalid SKID key format");
    }
    const profile = await loadProfile(data.handle, data.secret_id);
    if (!profile) throw new Error("Invalid handle or SKID key");
    return profile;
  });

const verifySchema = z.object({ handle: z.string().min(1), secret_id: z.string().min(1) });

export const verifySession = createServerFn({ method: "POST" })
  .inputValidator((data: unknown) => verifySchema.parse(data))
  .handler(async ({ data }) => {
    const profile = await loadProfile(data.handle, data.secret_id);
    return { valid: !!profile, profile };
  });
