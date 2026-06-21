import { useEffect, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Network, Plus, Trash2, X, ShieldHalf, Sparkles } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { AppShell } from "@/components/skid/AppShell";
import { Button } from "@/components/ui/button";
import { listCases, getCase } from "@/lib/cases.functions";
import {
  listGraphs, removeGraph, createBlankGraph, seedGraphFromCase,
  type GraphIndexEntry,
} from "@/lib/skidgraph";

export const Route = createFileRoute("/skidgraph/")({
  head: () => ({
    meta: [
      { title: "SkidGraph — SkidSint" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SkidGraphIndex,
});

function SkidGraphIndex() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const [graphs, setGraphs] = useState<GraphIndexEntry[]>([]);
  const [creating, setCreating] = useState(false);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/", hash: "hero", replace: true });
  }, [ready, session, navigate]);

  useEffect(() => { if (session) setGraphs(listGraphs(session.id)); }, [session?.id]);

  function refresh() { if (session) setGraphs(listGraphs(session.id)); }

  if (!ready || !session) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground animate-pulse">// loading…</div>;
  }

  return (
    <AppShell>
      <div className="flex-1 flex flex-col">
        <header className="border-b border-crimson/15 bg-background/60 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto max-w-[1600px] px-6 h-14 flex items-center gap-3">
            <Network className="h-4 w-4 text-crimson-glow" />
            <h1 className="font-display text-base font-semibold flex-1">SkidGraph</h1>
            <Button variant="hero" size="sm" onClick={() => setCreating(true)}>
              <Plus className="h-4 w-4" /> New graph
            </Button>
          </div>
        </header>

        <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-6">
          {graphs.length === 0 ? (
            <div className="text-center py-24">
              <div className="mx-auto h-12 w-12 grid place-items-center rounded-md border border-crimson/30 bg-crimson/10 text-crimson-glow mb-4">
                <Network className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">No graphs yet</h2>
              <p className="text-sm text-muted-foreground mb-6 max-w-md mx-auto">
                Create a SkidGraph from scratch or auto-build one from an existing investigation.
              </p>
              <Button variant="hero" size="lg" onClick={() => setCreating(true)}>
                <Plus className="h-4 w-4" /> Create your first graph
              </Button>
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
              {graphs.map((g) => (
                <div key={g.id} className="group rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl p-4 hover:border-crimson/40 transition-colors">
                  <div className="flex items-start gap-2 mb-3">
                    <div className="h-8 w-8 grid place-items-center rounded-md border border-crimson/30 bg-crimson/10 text-crimson-glow shrink-0">
                      <Network className="h-4 w-4" />
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="font-display font-semibold truncate">{g.name}</div>
                      <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground mt-0.5">
                        {g.source === "case" ? "from case" : "scratch"} · {new Date(g.createdAt).toLocaleDateString()}
                      </div>
                    </div>
                    <button
                      onClick={() => {
                        if (window.confirm(`Delete graph "${g.name}"?`)) {
                          removeGraph(session.id, g.id); refresh();
                        }
                      }}
                      className="p-1.5 rounded text-muted-foreground hover:text-crimson-glow opacity-0 group-hover:opacity-100 transition-opacity"
                      aria-label="Delete"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                  <Link
                    to="/skidgraph/$graphId"
                    params={{ graphId: g.id }}
                    className="inline-flex items-center gap-1.5 text-xs font-mono text-crimson-glow hover:underline"
                  >
                    Open →
                  </Link>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>

      {creating && (
        <CreateGraphModal
          onClose={() => setCreating(false)}
          onCreated={(id) => navigate({ to: "/skidgraph/$graphId", params: { graphId: id } })}
        />
      )}
    </AppShell>
  );
}

function CreateGraphModal({
  onClose, onCreated,
}: { onClose: () => void; onCreated: (id: string) => void }) {
  const { session } = useAuth();
  const [step, setStep] = useState<"choose" | "scratch" | "case">("choose");
  const [name, setName] = useState("");
  const [pickedCase, setPickedCase] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const auth = session ? { handle: session.handle, secret_id: session.secret_id } : null;
  const listCasesFn = useServerFn(listCases);
  const getCaseFn = useServerFn(getCase);

  const casesQ = useQuery({
    queryKey: ["cases", session?.handle],
    queryFn: () => listCasesFn({ data: auth! }),
    enabled: !!auth && step === "case",
  });

  async function createFromCase() {
    if (!auth || !session || !pickedCase) return;
    setBusy(true); setErr(null);
    try {
      const data = await getCaseFn({ data: { ...auth, case_id: pickedCase } });
      const id = seedGraphFromCase(session.id, data.caseRow, data.findings);
      onCreated(id);
    } catch (e) {
      setErr((e as Error).message);
    } finally {
      setBusy(false);
    }
  }

  function createScratch() {
    const finalName = name.trim() || "Untitled graph";
    if (!session) return;
    const id = createBlankGraph(session.id, finalName);
    onCreated(id);
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-background/80 backdrop-blur-sm p-4 animate-fade-in">
      <div className="relative w-full max-w-md rounded-xl border border-crimson/30 bg-card/95 backdrop-blur-xl p-6">
        <button onClick={onClose} className="absolute top-3 right-3 p-1.5 text-muted-foreground hover:text-crimson-glow" aria-label="Close">
          <X className="h-4 w-4" />
        </button>

        {step === "choose" && (
          <>
            <h2 className="font-display text-xl font-semibold mb-1">New SkidGraph</h2>
            <p className="text-sm text-muted-foreground mb-5">Pick a starting point.</p>
            <div className="grid gap-3">
              <button
                onClick={() => setStep("case")}
                className="text-left rounded-lg border border-crimson/20 bg-background/40 p-4 hover:border-crimson/50 hover:bg-crimson/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <ShieldHalf className="h-4 w-4 text-crimson-glow" />
                  <span className="font-display font-semibold">From an investigation</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Auto-import every finding from a case and arrange it as an OSINT graph.
                </p>
              </button>
              <button
                onClick={() => setStep("scratch")}
                className="text-left rounded-lg border border-crimson/20 bg-background/40 p-4 hover:border-crimson/50 hover:bg-crimson/5 transition-colors"
              >
                <div className="flex items-center gap-2 mb-1">
                  <Sparkles className="h-4 w-4 text-crimson-glow" />
                  <span className="font-display font-semibold">From scratch</span>
                </div>
                <p className="text-xs text-muted-foreground">
                  Start with an empty canvas and drag nodes in manually.
                </p>
              </button>
            </div>
          </>
        )}

        {step === "scratch" && (
          <>
            <h2 className="font-display text-xl font-semibold mb-1">Name your graph</h2>
            <p className="text-sm text-muted-foreground mb-4">You can rename it later.</p>
            <input
              autoFocus
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Untitled graph"
              className="w-full rounded-md border border-crimson/25 bg-background/60 px-3 py-2 text-sm focus:outline-none focus:border-crimson/60 mb-4"
              onKeyDown={(e) => { if (e.key === "Enter") createScratch(); }}
            />
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("choose")}>Back</Button>
              <Button variant="hero" size="sm" onClick={createScratch}>Create</Button>
            </div>
          </>
        )}

        {step === "case" && (
          <>
            <h2 className="font-display text-xl font-semibold mb-1">Pick an investigation</h2>
            <p className="text-sm text-muted-foreground mb-4">
              Findings attached to this case will become connected nodes.
            </p>
            <div className="max-h-72 overflow-y-auto space-y-1.5 mb-4">
              {casesQ.isLoading && <div className="text-xs text-muted-foreground font-mono animate-pulse">// loading cases…</div>}
              {casesQ.data?.length === 0 && (
                <div className="text-xs text-muted-foreground font-mono">// no cases yet — create one from /investigations first</div>
              )}
              {(casesQ.data ?? []).map((c) => (
                <button
                  key={c.id}
                  onClick={() => setPickedCase(c.id)}
                  className={`w-full text-left rounded-md border px-3 py-2 transition-colors ${
                    pickedCase === c.id
                      ? "border-crimson/60 bg-crimson/10 text-crimson-glow"
                      : "border-crimson/15 bg-background/40 hover:border-crimson/40"
                  }`}
                >
                  <div className="text-sm font-display font-semibold truncate">{c.name}</div>
                  <div className="font-mono text-[10px] text-muted-foreground uppercase tracking-widest">
                    {c.status}
                  </div>
                </button>
              ))}
            </div>
            {err && <p className="text-xs text-amber-300 font-mono mb-2">{err}</p>}
            <div className="flex justify-end gap-2">
              <Button variant="outline" size="sm" onClick={() => setStep("choose")} disabled={busy}>Back</Button>
              <Button variant="hero" size="sm" onClick={createFromCase} disabled={!pickedCase || busy}>
                {busy ? "Building…" : "Create graph"}
              </Button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
