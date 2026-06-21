import { useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import {
  Settings as SettingsIcon, Bell, Palette, Shield, FileText,
  ExternalLink, ChevronRight,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { Button } from "@/components/ui/button";
import { AppShell } from "@/components/skid/AppShell";

export const Route = createFileRoute("/settings")({
  head: () => ({
    meta: [
      { title: "Settings — SkidSint" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SettingsPage,
});

function SettingsPage() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const [notif, setNotif] = useState(true);
  const [revealMaskByDefault, setRevealMaskByDefault] = useState(true);
  const [compact, setCompact] = useState(false);

  if (!ready) return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground animate-pulse">// loading…</div>;
  if (!session) { navigate({ to: "/", hash: "hero", replace: true }); return null; }

  return (
    <AppShell>
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 pt-10 pb-20">
        <header className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-xl border border-crimson/30 bg-card/60 grid place-items-center text-crimson-glow">
            <SettingsIcon className="h-5 w-5" />
          </div>
          <div>
            <h1 className="font-display text-3xl font-bold tracking-tight">Settings</h1>
            <p className="text-sm text-muted-foreground">Tune the SkidSint terminal to your workflow.</p>
          </div>
        </header>

        <Section title="Preferences" icon={Palette}>
          <Toggle
            label="Mask SKID key by default"
            description="When opening the Account page, keep your key hidden until you click reveal."
            value={revealMaskByDefault}
            onChange={setRevealMaskByDefault}
          />
          <Toggle
            label="Compact module results"
            description="Render module output with reduced padding and a smaller monospace size."
            value={compact}
            onChange={setCompact}
          />
        </Section>

        <Section title="Notifications" icon={Bell}>
          <Toggle
            label="Toast on module completion"
            description="Show a brief in-app notification when a module finishes executing."
            value={notif}
            onChange={setNotif}
          />
        </Section>

        <Section title="Security" icon={Shield}>
          <Row
            label="Sign out everywhere"
            description="Clears the local session on this device. Your SKID key continues to work."
            action={<Button variant="outline" size="sm" onClick={() => { try { localStorage.removeItem("skidsint.session.v2"); } catch {} window.location.reload(); }}>Sign out</Button>}
          />
          <Row
            label="Account & key"
            description="View your handle, role, plan, and reveal your SKID key."
            action={<Button asChild variant="outlineGlow" size="sm"><Link to="/account">Open <ChevronRight className="h-3.5 w-3.5" /></Link></Button>}
          />
        </Section>

        <Section title="Legal" icon={FileText}>
          {[
            { doc: "privacy", label: "Privacy Policy" },
            { doc: "terms", label: "Terms of Service" },
            { doc: "eula", label: "EULA" },
            { doc: "acceptable-use", label: "Acceptable Use" },
            { doc: "cookies", label: "Cookie Policy" },
          ].map((d) => (
            <Link
              key={d.doc}
              to="/legal/$doc"
              params={{ doc: d.doc as never }}
              className="flex items-center justify-between px-4 py-3 rounded-md hover:bg-crimson/10 transition-colors"
            >
              <span className="text-sm font-display">{d.label}</span>
              <ExternalLink className="h-3.5 w-3.5 text-muted-foreground" />
            </Link>
          ))}
        </Section>

        <p className="mt-10 text-center font-mono text-[11px] text-muted-foreground">
          // Preferences are remembered on this device only.
        </p>
      </main>
    </AppShell>
  );
}

function Section({
  title, icon: Icon, children,
}: { title: string; icon: typeof Bell; children: React.ReactNode }) {
  return (
    <section className="mt-8 rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl overflow-hidden">
      <header className="flex items-center gap-2 border-b border-crimson/10 px-5 py-3">
        <Icon className="h-4 w-4 text-crimson-glow" />
        <h2 className="font-display text-sm font-semibold tracking-tight">{title}</h2>
      </header>
      <div className="divide-y divide-crimson/10">{children}</div>
    </section>
  );
}

function Toggle({
  label, description, value, onChange,
}: { label: string; description: string; value: boolean; onChange: (v: boolean) => void }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="font-display text-sm font-medium">{label}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <button
        role="switch"
        aria-checked={value}
        onClick={() => onChange(!value)}
        className={`relative h-6 w-11 shrink-0 rounded-full border transition-colors ${
          value ? "bg-crimson/40 border-crimson/60" : "bg-background/60 border-crimson/20"
        }`}
      >
        <span
          className={`absolute top-0.5 h-4 w-4 rounded-full bg-foreground transition-all ${
            value ? "left-6" : "left-0.5"
          }`}
        />
      </button>
    </div>
  );
}

function Row({
  label, description, action,
}: { label: string; description: string; action: React.ReactNode }) {
  return (
    <div className="flex items-start justify-between gap-4 px-5 py-4">
      <div className="min-w-0">
        <div className="font-display text-sm font-medium">{label}</div>
        <p className="mt-0.5 text-xs text-muted-foreground">{description}</p>
      </div>
      <div className="shrink-0">{action}</div>
    </div>
  );
}
