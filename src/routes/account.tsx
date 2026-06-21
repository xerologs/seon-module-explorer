import { useState } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Copy, Eye, EyeOff, ShieldCheck, Activity, Crown, Database,
  Calendar, KeyRound, LogOut, Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserStatus } from "@/lib/dashboard.functions";
import { Button } from "@/components/ui/button";
import { PLANS } from "@/lib/plans";
import { AppShell } from "@/components/skid/AppShell";

export const Route = createFileRoute("/account")({
  head: () => ({
    meta: [
      { title: "Account — SkidSint" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: AccountPage,
});

function AccountPage() {
  const { session, ready, logout } = useAuth();
  const navigate = useNavigate();
  const [reveal, setReveal] = useState(false);
  const [copied, setCopied] = useState(false);

  const statusFn = useServerFn(getUserStatus);
  const status = useQuery({
    queryKey: ["status", session?.handle],
    queryFn: () => statusFn({ data: { handle: session!.handle, secret_id: session!.secret_id } }),
    enabled: !!session,
  });

  if (!ready) return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground animate-pulse">// loading…</div>;
  if (!session) { navigate({ to: "/", hash: "hero", replace: true }); return null; }

  const secret = session.secret_id;
  const tierMeta = PLANS[session.tier];
  const masked = "•".repeat(Math.max(secret.length, 18));

  function copy() {
    navigator.clipboard.writeText(secret).catch(() => {});
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  }

  return (
    <AppShell>
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 pt-10 pb-20">
        <header>
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson-glow/80">
            Operator
          </div>
          <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">Account</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Your identity, key, and plan information.
          </p>
        </header>

        {/* Identity card */}
        <div
          className="mt-8 relative overflow-hidden rounded-2xl border border-crimson/30 p-7 backdrop-blur-xl"
          style={{
            background:
              "radial-gradient(140% 100% at 0% 0%, oklch(0.32 0.18 25 / 60%), oklch(0.13 0.02 20 / 70%))",
            animation: "fade-up 0.6s both",
          }}
        >
          <div className="font-mono text-[10px] uppercase tracking-[0.3em] text-crimson-glow/80">
            Your handle
          </div>
          <div className="mt-1 font-display text-2xl font-bold text-foreground">
            {session.handle}
          </div>

          <div className="mt-6 font-mono text-[10px] uppercase tracking-[0.3em] text-crimson-glow/80">
            Your ID
          </div>
          <div className="mt-2 rounded-xl border border-crimson/30 bg-background/40 p-5">
            <div className="font-mono text-lg sm:text-xl text-foreground tracking-[0.2em] select-all break-all">
              {reveal ? session.secret_id : masked}
            </div>
            <button
              onClick={() => setReveal((r) => !r)}
              className="mt-3 block w-full text-center text-sm text-muted-foreground hover:text-crimson-glow transition-colors"
            >
              {reveal ? "Click to hide" : "Click to reveal"}
            </button>
          </div>

          <div className="mt-4 flex flex-wrap gap-2">
            <Button size="sm" variant="outlineGlow" onClick={() => setReveal((r) => !r)}>
              {reveal ? <EyeOff className="h-3.5 w-3.5" /> : <Eye className="h-3.5 w-3.5" />}
              {reveal ? "Hide" : "Reveal"}
            </Button>
            <Button size="sm" variant="outlineGlow" onClick={copy}>
              {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
              {copied ? "Copied" : "Copy"}
            </Button>
          </div>

          <p className="mt-4 font-mono text-[11px] text-amber-300/90">
            ⚠ Treat your SKID key like a password. Anyone with it can sign in as you. We cannot recover it.
          </p>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 sm:grid-cols-4 gap-3">
          <StatCard label="Plan" value={tierMeta.name} icon={Crown} />
          <StatCard
            label="Daily usage"
            value={status.data ? `${status.data.dailyUsage}${status.data.dailyLimit === null ? " / ∞" : ` / ${status.data.dailyLimit}`}` : "—"}
            icon={Activity}
          />
          <StatCard
            label="Credits"
            value={status.data ? String(status.data.oneTimeCredits) : "—"}
            icon={Database}
          />
          <StatCard
            label="Total lookups"
            value={status.data ? String(status.data.totalLookups) : "—"}
            icon={KeyRound}
          />
        </div>

        {/* Role */}
        <div className="mt-6 rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl p-5 flex items-center gap-3">
          <ShieldCheck className="h-5 w-5 text-crimson-glow" />
          <div className="flex-1 min-w-0">
            <div className="font-mono text-[11px] uppercase tracking-widest text-muted-foreground">
              Role
            </div>
            <div className="font-display text-sm font-semibold">
              {session.role === "master_admin" ? "Owner" : session.role === "admin" ? "Administrator" : session.role === "support" ? "Support" : "Customer"}
            </div>
          </div>
        </div>

        {/* Sign out */}
        <div className="mt-8 flex justify-end">
          <Button variant="outline" onClick={() => { logout(); navigate({ to: "/", hash: "hero" }); }}>
            <LogOut className="h-4 w-4" /> Sign out
          </Button>
        </div>
      </main>
    </AppShell>
  );
}

function StatCard({ label, value, icon: Icon }: { label: string; value: string; icon: typeof Calendar }) {
  return (
    <div className="rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl p-4">
      <div className="flex items-center justify-between">
        <span className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{label}</span>
        <Icon className="h-3.5 w-3.5 text-crimson-glow/70" />
      </div>
      <div className="mt-2 font-display text-xl font-bold text-foreground">{value}</div>
    </div>
  );
}
