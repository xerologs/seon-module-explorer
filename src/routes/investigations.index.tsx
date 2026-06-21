import { useState, type ReactNode } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  Plus, FolderSearch, Loader2, Trash2, ArrowUpRight, Lock,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listCases, createCase, deleteCase } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { tierRank } from "@/lib/plans";
import { UpgradeModal } from "@/components/skid/UpgradeModal";
import { AppShell } from "@/components/skid/AppShell";

export const Route = createFileRoute("/investigations/")({
  head: () => ({
    meta: [
      { title: " C — SkidSint" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: InvestigationsPage,
});

function InvestigationsPage() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const [name, setName] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const qc = useQueryClient();

  const listFn = useServerFn(listCases);
  const createFn = useServerFn(createCase);
  const deleteFn = useServerFn(deleteCase);

  if (!ready) return <LoadingScreen />;
  if (!session) {
    navigate({ to: "/", hash: "hero", replace: true });
    return null;
  }

  const elevated = session.role !== "user";
  const allowed = elevated || tierRank(session.tier) >= tierRank("Investigator");

  const cases = useQuery({
    queryKey: ["cases", session.handle],
    queryFn: () => listFn({ data: { handle: session.handle, secret_id: session.secret_id } }),
    enabled: allowed,
  });

  const create = useMutation({
    mutationFn: (n: string) =>
      createFn({ data: { handle: session.handle, secret_id: session.secret_id, name: n } }),
    onSuccess: (row) => {
      setName("");
      qc.invalidateQueries({ queryKey: ["cases"] });
      navigate({ to: "/investigations/$caseId", params: { caseId: row.id } });
    },
  });

  const del = useMutation({
    mutationFn: (id: string) =>
      deleteFn({ data: { handle: session.handle, secret_id: session.secret_id, case_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["cases"] }),
  });

  return (
    <PageShell>
      <header className="flex items-start gap-4">
        <div className="h-14 w-14 shrink-0 rounded-xl border border-crimson/30 bg-card/60 grid place-items-center text-crimson-glow">
          <FolderSearch className="h-6 w-6" />
        </div>
        <div className="min-w-0 flex-1">
          <h1 className="font-display text-3xl font-bold tracking-tight"> C</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Open a case, keep notes, attach module findings, and chat with the OSINT assistant.
          </p>
        </div>
      </header>

      {!allowed ? (
        <LockedCard onUpgrade={() => setShowUpgrade(true)} />
      ) : (
        <>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder='New case name — e.g. "John Doe — fraud lead"'
              maxLength={120}
              className="flex-1 rounded-md border border-crimson/25 bg-background/60 px-4 py-2.5 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-crimson/60"
              onKeyDown={(e) => {
                if (e.key === "Enter" && name.trim()) create.mutate(name.trim());
              }}
            />
            <Button
              variant="hero"
              size="lg"
              disabled={!name.trim() || create.isPending}
              onClick={() => create.mutate(name.trim())}
            >
              {create.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Plus className="h-4 w-4" />}
              Create case
            </Button>
          </div>
          {create.isError && (
            <p className="mt-2 text-xs text-amber-300 font-mono">
              {(create.error as Error).message}
            </p>
          )}

          <div className="mt-10">
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground mb-3">
              Your cases
            </div>
            <div className="rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl p-2 min-h-[260px]">
              {cases.isLoading ? (
                <div className="grid place-items-center min-h-[220px] text-muted-foreground font-mono text-xs">
                  loading cases…
                </div>
              ) : !cases.data?.length ? (
                <div className="grid place-items-center min-h-[220px] text-center px-6">
                  <div>
                    <div className="mx-auto h-12 w-12 rounded-lg border border-crimson/25 bg-background/40 grid place-items-center text-muted-foreground">
                      <FolderSearch className="h-5 w-5" />
                    </div>
                    <h3 className="mt-4 font-display text-lg font-semibold">No cases yet</h3>
                    <p className="mt-1 text-xs text-muted-foreground">
                      Create your first investigation above to get started.
                    </p>
                  </div>
                </div>
              ) : (
                <ul className="space-y-2 p-2">
                  {cases.data.map((c) => (
                    <li key={c.id}>
                      <div className="group relative rounded-lg border border-crimson/15 bg-background/40 hover:border-crimson/40 hover:bg-background/60 transition-colors">
                        <Link
                          to="/investigations/$caseId"
                          params={{ caseId: c.id }}
                          className="block px-4 py-3 pr-12"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`h-2 w-2 rounded-full ${
                                c.status === "open"
                                  ? "bg-emerald-400 animate-pulse"
                                  : c.status === "closed"
                                    ? "bg-muted-foreground"
                                    : "bg-amber-400"
                              }`}
                            />
                            <span className="font-display font-semibold text-foreground">{c.name}</span>
                            <ArrowUpRight className="h-3.5 w-3.5 text-muted-foreground group-hover:text-crimson-glow" />
                          </div>
                          <div className="mt-1 font-mono text-[11px] text-muted-foreground">
                            {c.status} · updated {fmt(c.updated_at)}
                          </div>
                        </Link>
                        <button
                          aria-label="Delete case"
                          onClick={(e) => {
                            e.preventDefault();
                            if (confirm(`Delete case "${c.name}"? This cannot be undone.`)) {
                              del.mutate(c.id);
                            }
                          }}
                          className="absolute top-3 right-3 p-1.5 rounded-md text-muted-foreground hover:text-crimson-glow hover:bg-crimson/10 opacity-60 hover:opacity-100 transition-opacity"
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        </>
      )}

      <UpgradeModal open={showUpgrade} planName="Investigator" onClose={() => setShowUpgrade(false)} />
    </PageShell>
  );
}

export function PageShell({ children }: { children: ReactNode }) {
  return (
    <AppShell>
      <main className="flex-1 mx-auto w-full max-w-5xl px-6 pt-10 pb-20">
        <div style={{ animation: "fade-up 0.5s both" }}>{children}</div>
      </main>
    </AppShell>
  );
}

function LoadingScreen() {
  return (
    <div className="min-h-screen grid place-items-center">
      <div className="font-mono text-xs text-muted-foreground animate-pulse">// authenticating session…</div>
    </div>
  );
}

function LockedCard({ onUpgrade }: { onUpgrade: () => void }) {
  return (
    <div className="mt-10 rounded-xl border border-amber-400/30 bg-amber-400/5 p-8 text-center">
      <Lock className="h-8 w-8 mx-auto text-amber-300" />
      <h2 className="mt-4 font-display text-xl font-semibold">Investigator tier required</h2>
      <p className="mt-2 text-sm text-muted-foreground">
        Investigation cases — including notes, attached findings, and the OSINT chat assistant — are
        unlocked on the Investigator plan and above.
      </p>
      <Button variant="hero" size="lg" className="mt-5" onClick={onUpgrade}>
        Upgrade to Investigator
      </Button>
    </div>
  );
}

function fmt(iso: string) {
  const d = new Date(iso);
  const diff = Date.now() - d.getTime();
  const min = Math.round(diff / 60000);
  if (min < 1) return "just now";
  if (min < 60) return `${min}m ago`;
  const h = Math.round(min / 60);
  if (h < 24) return `${h}h ago`;
  return d.toLocaleDateString();
}
