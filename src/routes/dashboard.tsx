import { useEffect, useMemo, useState, type ReactNode } from "react";
import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Activity, ArrowUpRight, BadgeCheck, Database, Fingerprint, Gauge,
  KeyRound, Shield, Sparkles, Timer, Zap,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getUserStatus, listModules } from "@/lib/dashboard.functions";
import { useCountdown } from "@/hooks/use-countdown";
import { Button } from "@/components/ui/button";
import { PLANS, type Role, type Tier } from "@/lib/plans";
import { UpgradeModal } from "@/components/skid/UpgradeModal";
import { ModulesGrid } from "@/components/skid/ModulesGrid";
import { AdminPanel } from "@/components/skid/AdminPanel";
import { Pricing } from "@/components/skid/Pricing";
import { AppShell } from "@/components/skid/AppShell";

type Tab = "overview" | "modules" | "plans" | "admin";

export const Route = createFileRoute("/dashboard")({
  validateSearch: (s: Record<string, unknown>): { tab?: Tab } => {
    const t = s.tab;
    if (t === "overview" || t === "modules" || t === "plans" || t === "admin") return { tab: t };
    return {};
  },
  head: () => ({
    meta: [
      { title: "Dashboard — SkidSint" },
      { name: "description", content: "SkidSint operator console — modules, requests, and account telemetry." },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: DashboardPage,
});

function DashboardPage() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const search = Route.useSearch();
  const tab: Tab = search.tab ?? "overview";
  const [upgradeFor, setUpgradeFor] = useState<string | null>(null);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/", hash: "hero", replace: true });
  }, [ready, session, navigate]);

  if (!ready || !session) {
    return (
      <div className="min-h-screen grid place-items-center">
        <div className="font-mono text-xs text-muted-foreground animate-pulse">// authenticating session…</div>
      </div>
    );
  }

  return (
    <AppShell>
      <DashboardBody session={session} tab={tab} onUpgrade={(plan) => setUpgradeFor(plan)} />
      <UpgradeModal open={!!upgradeFor} planName={upgradeFor ?? undefined} onClose={() => setUpgradeFor(null)} />
    </AppShell>
  );
}

/* ───────────────── Body ───────────────── */

function DashboardBody({
  session, tab, onUpgrade,
}: {
  session: { handle: string; secret_id: string; tier: Tier; role: Role };
  tab: Tab;
  onUpgrade: (plan: string) => void;
}) {
  const statusFn = useServerFn(getUserStatus);
  const modulesFn = useServerFn(listModules);

  const status = useQuery({
    queryKey: ["user-status", session.handle],
    queryFn: () => statusFn({ data: { handle: session.handle, secret_id: session.secret_id } }),
    refetchInterval: 30_000,
  });
  const modules = useQuery({ queryKey: ["modules"], queryFn: () => modulesFn() });

  const greeting = useGreeting();

  return (
    <div className="flex-1 p-5 sm:p-8 lg:p-10 max-w-7xl w-full mx-auto">
      <div className="flex flex-wrap items-end justify-between gap-4 mb-8" style={{ animation: "fade-up 0.7s both" }}>
        <div className="min-w-0">
          <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson-glow/80 mb-2 flex items-center gap-2">
            <span className="h-1.5 w-1.5 rounded-full bg-crimson-glow animate-pulse" /> Operator console
          </div>
          <h1 className="font-display text-2xl sm:text-3xl lg:text-4xl font-semibold tracking-tight text-foreground">
            {greeting}, <span className="text-glow text-crimson-glow">@{session.handle}</span>
          </h1>
          <p className="mt-1 text-sm text-muted-foreground font-mono">
            Encrypted channel established. All actions are sandboxed.
          </p>
        </div>
        <div className="flex items-center gap-2 text-[11px] font-mono">
          <span className="rounded-full border border-emerald-500/30 bg-emerald-500/5 px-3 py-1 text-emerald-400/90">● ONLINE</span>
          <span className="rounded-full border border-crimson/30 bg-crimson/5 px-3 py-1 text-crimson-glow">TLS 1.3</span>
        </div>
      </div>

      {tab === "overview" && (
        <OverviewTab
          status={status.data} loading={status.isLoading}
          modulesCount={modules.data?.length ?? 0}
          onUpgrade={() => onUpgrade("Investigator")}
        />
      )}

      {tab === "modules" && modules.data && (
        <ModulesGrid
          modules={modules.data}
          tier={status.data?.tier ?? session.tier}
          session={{ handle: session.handle, secret_id: session.secret_id }}
          onUpgrade={onUpgrade}
          onUsed={() => status.refetch()}
        />
      )}

      {tab === "plans" && <Pricing />}

      {tab === "admin" && (
        <AdminPanel session={{ handle: session.handle, secret_id: session.secret_id, role: session.role }} />
      )}

      <footer className="mt-10 pt-6 border-t border-crimson/10 text-[11px] font-mono text-muted-foreground flex flex-wrap justify-between gap-2">
        <span>// session-id: {session.handle.slice(0, 4).toUpperCase()}-{Date.now().toString(36).slice(-6).toUpperCase()}</span>
        <span>// SkidSint Operator Console — authorized use only</span>
      </footer>
    </div>
  );
}

function useGreeting() {
  const h = new Date().getHours();
  if (h < 5) return "Burning the midnight oil";
  if (h < 12) return "Good morning";
  if (h < 18) return "Good afternoon";
  return "Good evening";
}

/* ───────────────── Overview tab ───────────────── */

type Status = {
  handle: string; tier: Tier; role: string;
  totalLookups: number; dailyUsage: number; dailyLimit: number | null;
  oneTimeCredits: number; refreshAt: number; unlimited: boolean;
};

function OverviewTab({
  status, loading, modulesCount, onUpgrade,
}: {
  status?: Status; loading: boolean; modulesCount: number; onUpgrade: () => void;
}) {
  const tierColor = useMemo(() => {
    if (!status) return "text-muted-foreground";
    if (status.tier === "Lifetime") return "text-amber-300";
    if (status.tier === "Investigator") return "text-crimson-glow";
    if (status.tier === "Basic") return "text-foreground";
    return "text-muted-foreground";
  }, [status]);

  const reqLabel = !status
    ? "—"
    : status.unlimited
      ? "∞"
      : `${status.dailyUsage}/${status.dailyLimit ?? 0}`;

  return (
    <>
      <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
        <MetricCard
          icon={<Activity className="h-4 w-4" />}
          label="Requests (24h)" value={loading ? "—" : reqLabel}
          accent={status?.unlimited ? "Unlimited" : "Live"} delay={0}
        />
        <MetricCard
          icon={<BadgeCheck className="h-4 w-4" />}
          label="Account Tier" value={loading ? "—" : status?.tier ?? "Guest"}
          valueClass={tierColor} accent={status?.tier === "Guest" ? "Free" : "Active"} delay={80}
        />
        <MetricCard
          icon={<Gauge className="h-4 w-4" />}
          label="Total Lookups" value={loading ? "—" : (status?.totalLookups ?? 0).toLocaleString()}
          accent="Cumulative" delay={160}
        />
        <RefreshCard target={status?.refreshAt} loading={loading} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-3 gap-5">
        <ToolkitCard modules={modulesCount} />
        <CreditsCard credits={status?.oneTimeCredits ?? 0} />
      </div>

      <div className="mt-6 grid grid-cols-1 lg:grid-cols-2 gap-5">
        <IdentityCard handle={status?.handle ?? "—"} />
        <PlanCard tier={status?.tier ?? "Guest"} onUpgrade={onUpgrade} />
      </div>
    </>
  );
}

function MetricCard({
  icon, label, value, valueClass = "text-foreground", accent, delay = 0,
}: { icon: ReactNode; label: string; value: string; valueClass?: string; accent?: string; delay?: number }) {
  return (
    <div
      className="group relative rounded-xl border border-crimson/20 bg-card/50 backdrop-blur-xl p-5 transition-all hover:border-crimson/60 hover:shadow-[0_0_40px_-10px_oklch(0.6_0.26_22/45%)]"
      style={{ animation: `fade-up 0.7s ${delay}ms both` }}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="flex items-center gap-1.5 text-crimson-glow/80">{icon}{label}</span>
        {accent && <span className="text-[9px] text-muted-foreground/70">{accent}</span>}
      </div>
      <div className={`mt-3 font-display text-3xl font-semibold tracking-tight ${valueClass}`}>{value}</div>
      <div className="absolute inset-x-0 bottom-0 h-px bg-gradient-to-r from-transparent via-crimson/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
    </div>
  );
}

function RefreshCard({ target, loading }: { target?: number; loading: boolean }) {
  const cd = useCountdown(target ?? Date.now());
  const remaining = target ? Math.max(0, target - Date.now()) : 0;
  const hours = Math.floor(remaining / 3_600_000);
  const mins = Math.floor((remaining % 3_600_000) / 60_000);
  const secs = Math.floor((remaining % 60_000) / 1000);
  const label = !target ? "--:--:--"
    : `${String(hours).padStart(2, "0")}:${String(mins).padStart(2, "0")}:${String(secs).padStart(2, "0")}`;
  // keep cd reactive (forces re-render every second)
  void cd.mm;
  return (
    <div
      className="group relative rounded-xl border border-crimson/20 bg-card/50 backdrop-blur-xl p-5 transition-all hover:border-crimson/60 hover:shadow-[0_0_40px_-10px_oklch(0.6_0.26_22/45%)]"
      style={{ animation: "fade-up 0.7s 240ms both" }}
    >
      <div className="flex items-center justify-between text-[10px] uppercase tracking-widest text-muted-foreground">
        <span className="flex items-center gap-1.5 text-crimson-glow/80"><Timer className="h-4 w-4" /> Resets in</span>
        <span className="text-[9px]">24h window</span>
      </div>
      <div className="mt-3 font-mono text-3xl font-semibold tracking-tight text-foreground tabular-nums">
        {loading ? "--:--:--" : label}
      </div>
    </div>
  );
}

function ToolkitCard({ modules }: { modules: number }) {
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-crimson/30 bg-gradient-to-br from-crimson/15 via-blood/10 to-transparent backdrop-blur-xl p-7 lg:col-span-2 group hover:border-crimson/60 transition-all"
      style={{ animation: "fade-up 0.8s 320ms both" }}
    >
      <div className="absolute -top-16 -right-16 h-56 w-56 rounded-full bg-crimson/20 blur-3xl pointer-events-none" />
      <div className="absolute inset-0 grid-bg opacity-40 pointer-events-none" />
      <div className="relative">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-crimson-glow">
          <Sparkles className="h-3.5 w-3.5" /> Featured
        </div>
        <h2 className="mt-3 font-display text-2xl sm:text-3xl font-semibold tracking-tight">
          Open Your <span className="text-glow text-crimson-glow">Toolkit</span>
        </h2>
        <p className="mt-2 max-w-md text-sm text-muted-foreground">
          {modules || 12} OSINT modules online — breach, Discord, social, IP &amp; identity intel.
        </p>
      </div>
    </div>
  );
}

function CreditsCard({ credits }: { credits: number }) {
  return (
    <div
      className="rounded-xl border border-crimson/20 bg-card/50 backdrop-blur-xl p-5 hover:border-crimson/50 transition-all"
      style={{ animation: "fade-up 0.8s 400ms both" }}
    >
      <div className="flex items-center justify-between mb-3 text-[10px] uppercase tracking-widest text-crimson-glow/80">
        <span className="flex items-center gap-1.5"><Zap className="h-3.5 w-3.5" /> One-time credits</span>
      </div>
      <div className="font-display text-4xl font-semibold tracking-tight">{credits.toLocaleString()}</div>
      <div className="mt-2 text-xs text-muted-foreground font-mono">
        Spent before your 24h quota. Granted by admins.
      </div>
    </div>
  );
}

function IdentityCard({ handle }: { handle: string }) {
  return (
    <div
      className="rounded-xl border border-crimson/20 bg-card/50 backdrop-blur-xl p-6 hover:border-crimson/50 transition-all"
      style={{ animation: "fade-up 0.8s 500ms both" }}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-crimson-glow/80 mb-4">
        <Fingerprint className="h-3.5 w-3.5" /> Identity
      </div>
      <div className="flex items-start gap-4">
        <div className="h-14 w-14 rounded-lg border border-crimson/40 bg-gradient-to-br from-crimson/30 to-blood/20 grid place-items-center font-display text-xl font-semibold text-crimson-glow text-glow">
          {handle.slice(0, 2).toUpperCase()}
        </div>
        <div className="min-w-0 flex-1">
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground">Handle</div>
          <div className="font-mono text-lg text-foreground truncate"><span className="text-crimson-glow">@</span>{handle}</div>
          <div className="mt-3 grid grid-cols-2 gap-3 text-[11px] font-mono">
            <div>
              <div className="text-muted-foreground">Auth method</div>
              <div className="text-foreground/90 flex items-center gap-1"><KeyRound className="h-3 w-3 text-crimson-glow" /> SKID key</div>
            </div>
            <div>
              <div className="text-muted-foreground">Posture</div>
              <div className="text-foreground/90 flex items-center gap-1"><Shield className="h-3 w-3 text-crimson-glow" /> Hardened</div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function PlanCard({ tier, onUpgrade }: { tier: Tier; onUpgrade: () => void }) {
  const isFree = tier === "Guest";
  const plan = PLANS[tier];
  return (
    <div
      className="relative overflow-hidden rounded-xl border border-crimson/20 bg-card/50 backdrop-blur-xl p-6 hover:border-crimson/50 transition-all"
      style={{ animation: "fade-up 0.8s 580ms both" }}
    >
      <div className="flex items-center gap-2 text-[10px] uppercase tracking-widest text-crimson-glow/80 mb-4">
        <Database className="h-3.5 w-3.5" /> Plan status
      </div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <div className="font-display text-xl font-semibold text-foreground">{plan.name}</div>
          <div className="mt-1 text-sm text-muted-foreground">
            {isFree
              ? "You're on the free tier. Unlock premium modules & higher rate limits."
              : `${plan.dailyLimit.toLocaleString()} requests / 24h.`}
          </div>
        </div>
        <Button
          variant={isFree ? "hero" : "outline"}
          size="lg"
          className={isFree ? "animate-pulse-glow" : ""}
          onClick={onUpgrade}
        >
          {isFree ? "Upgrade Now" : "Manage Plan"}
          <ArrowUpRight className="h-4 w-4 ml-1" />
        </Button>
      </div>
      {isFree && (
        <div className="absolute -bottom-10 -right-10 h-40 w-40 rounded-full bg-crimson/20 blur-3xl pointer-events-none" />
      )}
    </div>
  );
}

