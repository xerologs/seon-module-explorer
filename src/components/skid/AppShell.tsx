import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import {
  Activity, ArrowUpRight, Gauge, KeyRound, LayoutGrid, LogOut, Menu, Network,
  Send, ShieldHalf, Sparkles, Terminal, Wallet, X,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { UpgradeModal } from "@/components/skid/UpgradeModal";

type Role = string;
type Tier = string;

const dashboardTabs = [
  { tab: "overview", label: "Overview", icon: Gauge },
  { tab: "modules",  label: "Modules",  icon: LayoutGrid },
  { tab: "plans",    label: "Plans",    icon: Wallet },
] as const;

const workspaceItems = [
  { to: "/investigations", label: " Investigations", icon: ShieldHalf },
  { to: "/skidgraph",      label: "SkidGraph",       icon: Network },
  { to: "/chat",           label: "OSINT Agent (AI)",    icon: Sparkles },
  { to: "/account",        label: "Account",        icon: KeyRound },
  { to: "/settings",       label: "Settings",       icon: Activity },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const { session, logout } = useAuth();
  const [drawer, setDrawer] = useState(false);

  if (!session) return <>{children}</>;

  return (
    <div className="min-h-screen flex bg-grid-fade select-none">
      <aside className="hidden lg:flex w-64 shrink-0 flex-col border-r border-crimson/15 bg-background/60 backdrop-blur-xl sticky top-0 h-screen">
        <SidebarInner session={session} onLogout={logout} onClose={() => {}} />
      </aside>

      {drawer && (
        <div className="lg:hidden fixed inset-0 z-50 flex animate-fade-in">
          <div className="absolute inset-0 bg-background/80 backdrop-blur-sm" onClick={() => setDrawer(false)} />
          <aside className="relative w-72 max-w-[80%] bg-popover/95 backdrop-blur-xl border-r border-crimson/30 flex flex-col">
            <button
              className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-crimson-glow"
              onClick={() => setDrawer(false)} aria-label="Close menu"
            ><X className="h-4 w-4" /></button>
            <SidebarInner session={session} onLogout={logout} onClose={() => setDrawer(false)} />
          </aside>
        </div>
      )}

      <main className="flex-1 min-w-0 flex flex-col">
        <header className="lg:hidden flex items-center justify-between h-14 px-4 border-b border-crimson/15 bg-background/60 backdrop-blur-md sticky top-0 z-30">
          <Link to="/" hash="hero" className="flex items-center gap-2 font-mono text-sm">
            <Terminal className="h-4 w-4 text-crimson" />
            <span>skidsint<span className="text-crimson"></span>.</span>
          </Link>
          <button
            className="p-2 text-foreground/80 hover:text-crimson-glow"
            onClick={() => setDrawer(true)} aria-label="Open menu"
          ><Menu className="h-5 w-5" /></button>
        </header>
        <div className="flex-1 min-w-0">{children}</div>
      </main>
    </div>
  );
}

function SidebarInner({
  session, onLogout, onClose,
}: {
  session: { handle: string; tier: Tier; role: Role };
  onLogout: () => void;
  onClose: () => void;
}) {
  const navigate = useNavigate();
  const router = useRouterState();
  const pathname = router.location.pathname;
  const search = (router.location.search ?? {}) as { tab?: string };
  const isAdmin = session.role === "admin" || session.role === "master_admin" || session.role === "support";
  const showUpgrade = session.tier === "Guest" || session.tier === "Basic";

  const onDashboard = pathname === "/dashboard";
  const activeTab = onDashboard ? (search.tab ?? "overview") : null;

  function goTab(tab: string) {
    onClose();
    navigate({ to: "/dashboard", search: { tab } });
  }

  return (
    <div className="flex-1 flex flex-col p-5 overflow-y-auto">
      <Link to="/" hash="hero" className="flex items-center gap-2 font-mono text-sm mb-6 group">
        <Terminal className="h-4 w-4 text-crimson group-hover:scale-110 transition-transform" />
        <span className="text-foreground/90">skidsint<span className="text-crimson animate-pulse"></span>.</span>
        <span className="ml-auto text-[10px] uppercase tracking-widest text-muted-foreground">v1.4</span>
      </Link>

      <div className="mb-5 rounded-lg border border-crimson/20 bg-card/60 backdrop-blur-md p-3 hover:border-crimson/40 transition-colors">
        <div className="text-[10px] uppercase tracking-widest text-muted-foreground mb-1">Operator</div>
        <div className="font-mono text-sm text-foreground truncate">
          <span className="text-crimson-glow">@</span>{session.handle}
        </div>
        <div className="mt-2 flex items-center justify-between gap-2 text-[10px]">
          <span className="flex items-center gap-1.5 text-emerald-400/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" />
            {session.tier}
          </span>
          <RoleBadge role={session.role} />
        </div>
      </div>

      <div className="mb-2 px-1 text-[10px] uppercase tracking-[0.25em] font-mono text-muted-foreground">
        Console
      </div>
      <nav className="flex flex-col gap-1">
        {dashboardTabs.map((item, i) => {
          const active = activeTab === item.tab;
          return (
            <button
              key={item.tab}
              onClick={() => goTab(item.tab)}
              className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm border transition-all
                ${active
                  ? "text-crimson-glow bg-crimson/15 border-crimson/40 border-glow"
                  : "text-foreground/70 hover:text-crimson-glow hover:bg-crimson/10 border-transparent hover:border-crimson/25 hover:translate-x-0.5"}`}
              style={{ animation: `fade-up 0.5s ${i * 50}ms both` }}
            >
              <item.icon className="h-4 w-4" />
              <span>{item.label}</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-70 transition-opacity" />
            </button>
          );
        })}
        {isAdmin && (
          <button
            onClick={() => goTab("admin")}
            className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm border transition-all
              ${activeTab === "admin"
                ? "text-crimson-glow bg-crimson/15 border-crimson/40 border-glow"
                : "text-foreground/70 hover:text-crimson-glow hover:bg-crimson/10 border-transparent hover:border-crimson/25 hover:translate-x-0.5"}`}
          >
            <ShieldHalf className="h-4 w-4" />
            <span>Admin</span>
            <span className="ml-auto text-[9px] font-mono text-amber-300/80 px-1.5 py-0.5 rounded bg-amber-300/10 border border-amber-300/30 uppercase tracking-widest">Staff</span>
          </button>
        )}
      </nav>

      <div className="mt-5 mb-2 px-1 text-[10px] uppercase tracking-[0.25em] font-mono text-muted-foreground">
        Workspace
      </div>
      <nav className="flex flex-col gap-1">
        {workspaceItems.map((it, i) => {
          const active = pathname === it.to || pathname.startsWith(it.to + "/");
          return (
            <Link
              key={it.label}
              to={it.to}
              onClick={onClose}
              className={`group flex items-center gap-3 rounded-md px-3 py-2 text-sm border transition-all
                ${active
                  ? "text-crimson-glow bg-crimson/15 border-crimson/40 border-glow"
                  : "border-transparent text-foreground/70 hover:text-crimson-glow hover:bg-crimson/10 hover:border-crimson/25 hover:translate-x-0.5"}`}
              style={{ animation: `fade-up 0.5s ${i * 50}ms both` }}
            >
              <it.icon className="h-4 w-4" />
              <span>{it.label}</span>
              <ArrowUpRight className="h-3 w-3 ml-auto opacity-0 group-hover:opacity-70 transition-opacity" />
            </Link>
          );
        })}
      </nav>

      {/* status footer */}
      <div className="mt-5 rounded-lg border border-crimson/15 bg-background/40 p-3 space-y-2">
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
          <span className="text-muted-foreground">Channel</span>
          <span className="flex items-center gap-1.5 text-emerald-400/90">
            <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-pulse" /> secure
          </span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
          <span className="text-muted-foreground">Latency</span>
          <span className="text-foreground/80 tabular-nums">42ms</span>
        </div>
        <div className="flex items-center justify-between text-[10px] font-mono uppercase tracking-widest">
          <span className="text-muted-foreground">TLS</span>
          <span className="text-crimson-glow">1.3</span>
        </div>
        <div className="h-px bg-gradient-to-r from-transparent via-crimson/40 to-transparent" />
        <div className="font-mono text-[9px] text-muted-foreground/70 leading-relaxed">
          // sandboxed env<br/>// audit-log: ON
        </div>
      </div>

      {showUpgrade && (
        <Button variant="hero" size="lg" onClick={() => goTab("plans")}
          className="mt-4 w-full animate-pulse-glow">
          <Sparkles className="h-4 w-4 mr-1.5" /> Upgrade Now
        </Button>
      )}

      <a
        href="https://t.me/skidsint"
        target="_blank"
        rel="noopener noreferrer"
        className="mt-3 flex items-center gap-2 rounded-md border border-crimson/30 bg-crimson/5 px-3 py-2 text-sm text-crimson-glow hover:bg-crimson/15 hover:border-crimson/60 transition-all"
      >
        <Send className="h-4 w-4" /> Telegram
        <ArrowUpRight className="h-3 w-3 ml-auto opacity-70" />
      </a>

      <button
        onClick={onLogout}
        className="mt-2 flex items-center gap-2 rounded-md px-3 py-2 text-sm text-muted-foreground hover:text-crimson-glow hover:bg-crimson/10 transition-colors"
      >
        <LogOut className="h-4 w-4" /> Sign out
      </button>
    </div>
  );
}

function RoleBadge({ role }: { role: string }) {
  const map: Record<string, { label: string; cls: string; emoji: string }> = {
    master_admin: { label: "owner",    cls: "text-amber-300 border-amber-300/40 bg-amber-300/10",    emoji: "👑" },
    admin:        { label: "admin",    cls: "text-crimson-glow border-crimson/50 bg-crimson/10",     emoji: "🛡️" },
    support:      { label: "support",  cls: "text-sky-300 border-sky-300/40 bg-sky-300/10",          emoji: "🎧" },
    user:         { label: "customer", cls: "text-muted-foreground border-border bg-muted/10",       emoji: "✨" },
  };
  const r = map[role] ?? map.user;
  return (
    <span className={`inline-flex items-center gap-1 rounded-full border px-2 py-0.5 font-mono uppercase tracking-widest text-[9px] ${r.cls}`}>
      <span>{r.emoji}</span>{r.label}
    </span>
  );
}