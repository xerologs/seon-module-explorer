import { useEffect, useRef, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ArrowLeft, Trash2, Sparkles, Send, Loader2, Edit3, Eye, ChevronDown,
  Database, AlertTriangle, X, Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { getCase, updateCase, deleteCase, deleteFinding } from "@/lib/cases.functions";
import { sendChatMessage, createThread, getThread } from "@/lib/ai.functions";
import { executeModule } from "@/lib/dashboard.functions";
import { Button } from "@/components/ui/button";
import { moduleBySlug } from "@/lib/modules-catalog";
import { AppShell } from "@/components/skid/AppShell";
import { seedGraphFromCase } from "@/lib/skidgraph";

export const Route = createFileRoute("/investigations/$caseId")({
  head: () => ({
    meta: [
      { title: "Case — SkidSint" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: CasePage,
});

type ChatMsg = { id: string; role: string; content: string; created_at: string };

function CasePage() {
  const { caseId } = Route.useParams();
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const getCaseFn = useServerFn(getCase);
  const updateFn = useServerFn(updateCase);
  const deleteCaseFn = useServerFn(deleteCase);
  const delFindingFn = useServerFn(deleteFinding);
  const createThreadFn = useServerFn(createThread);
  const getThreadFn = useServerFn(getThread);
  const sendFn = useServerFn(sendChatMessage);
  const execFn = useServerFn(executeModule);

  const [notes, setNotes] = useState("");
  const [mode, setMode] = useState<"edit" | "preview">("edit");
  const [threadId, setThreadId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [confirm, setConfirm] = useState<{ slug: string; query: string; reason: string } | null>(null);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/", hash: "hero", replace: true });
  }, [ready, session, navigate]);

  const auth = session ? { handle: session.handle, secret_id: session.secret_id } : null;

  const caseQ = useQuery({
    queryKey: ["case", caseId, session?.handle],
    queryFn: () => getCaseFn({ data: { ...auth!, case_id: caseId } }),
    enabled: !!auth,
  });

  // Init notes when case loads
  useEffect(() => {
    if (caseQ.data?.caseRow) setNotes(caseQ.data.caseRow.notes);
  }, [caseQ.data?.caseRow.id]);

  // Auto-create thread for this case
  useEffect(() => {
    if (!auth || threadId) return;
    let cancelled = false;
    createThreadFn({ data: { ...auth, title: caseQ.data?.caseRow.name ?? "Case chat", case_id: caseId } })
      .then((r) => !cancelled && setThreadId(r.id))
      .catch(() => {});
    return () => { cancelled = true; };
  }, [auth?.handle, caseId, threadId, caseQ.data?.caseRow.name]);

  const threadQ = useQuery({
    queryKey: ["thread", threadId],
    queryFn: () => getThreadFn({ data: { ...auth!, thread_id: threadId! } }),
    enabled: !!threadId && !!auth,
    refetchInterval: false,
  });

  // Autosave notes (debounced)
  const saveTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  useEffect(() => {
    if (!auth || !caseQ.data) return;
    if (notes === caseQ.data.caseRow.notes) return;
    if (saveTimer.current) clearTimeout(saveTimer.current);
    saveTimer.current = setTimeout(() => {
      updateFn({ data: { ...auth, case_id: caseId, notes } }).catch(() => {});
    }, 800);
    return () => { if (saveTimer.current) clearTimeout(saveTimer.current); };
  }, [notes, auth?.handle, caseId]);

  const send = useMutation({
    mutationFn: (text: string) =>
      sendFn({ data: { ...auth!, thread_id: threadId!, content: text, context_notes: notes } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["thread", threadId] }),
  });

  // Look for run_module suggestions in latest assistant message
  useEffect(() => {
    const msgs = threadQ.data?.messages ?? [];
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== "assistant") return;
    const m = last.content.match(/```run_module\s*([\s\S]*?)```/);
    if (!m) return;
    try {
      const parsed = JSON.parse(m[1].trim()) as { slug?: string; query?: string; reason?: string };
      if (parsed.slug && parsed.query) {
        setConfirm({ slug: parsed.slug, query: parsed.query, reason: parsed.reason ?? "" });
      }
    } catch { /* noop */ }
  }, [threadQ.data?.messages.length]);

  const runProposed = useMutation({
    mutationFn: async (p: { slug: string; query: string }) => {
      const result = await execFn({ data: { ...auth!, slug: p.slug, query: p.query } });
      // Post result back to chat as next user message
      await sendFn({
        data: {
          ...auth!,
          thread_id: threadId!,
          content: `MODULE RESULT — ${p.slug}("${p.query}"):\n\`\`\`json\n${result.dataJson.slice(0, 6000)}\n\`\`\`${result.error ? `\n(error: ${result.error})` : ""}`,
          context_notes: notes,
        },
      });
      return result;
    },
    onSuccess: () => {
      setConfirm(null);
      qc.invalidateQueries({ queryKey: ["thread", threadId] });
    },
  });

  const delCase = useMutation({
    mutationFn: () => deleteCaseFn({ data: { ...auth!, case_id: caseId } }),
    onSuccess: () => navigate({ to: "/investigations" }),
  });

  const delFinding = useMutation({
    mutationFn: (id: string) => delFindingFn({ data: { ...auth!, finding_id: id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["case", caseId] }),
  });

  if (!ready || !session) return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground animate-pulse">// loading…</div>;
  if (caseQ.isLoading) return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground">// loading case…</div>;
  if (caseQ.isError) return (
    <div className="min-h-screen grid place-items-center text-center px-6">
      <div>
        <p className="text-sm text-amber-300 font-mono">{(caseQ.error as Error).message}</p>
        <Link to="/investigations" className="mt-4 inline-block text-crimson-glow text-sm">← Back to cases</Link>
      </div>
    </div>
  );

  const c = caseQ.data!.caseRow;
  const findings = caseQ.data!.findings;

  return (
    <AppShell>
    <div className="flex-1 flex flex-col">
      <header className="border-b border-crimson/15 bg-background/60 backdrop-blur-md sticky top-0 z-30">
        <div className="mx-auto max-w-[1600px] px-6 h-14 flex items-center gap-3">
          <Link
            to="/investigations"
            className="p-2 rounded-md text-muted-foreground hover:text-crimson-glow hover:bg-crimson/10 transition-colors"
            aria-label="Back"
          >
            <ArrowLeft className="h-4 w-4" />
          </Link>
          <h1 className="font-display text-base font-semibold truncate flex-1">{c.name}</h1>
          <span className={`inline-flex items-center gap-1.5 rounded-full border px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest
            ${c.status === "open"
              ? "border-emerald-400/40 bg-emerald-400/10 text-emerald-300"
              : c.status === "closed" ? "border-muted-foreground/30 bg-muted/10 text-muted-foreground"
              : "border-amber-400/40 bg-amber-400/10 text-amber-300"}`}>
            <span className="h-1.5 w-1.5 rounded-full bg-current animate-pulse" />
            {c.status}
          </span>
          <button
            onClick={() => sendToSkidGraph(session.id, { ...c, notes }, findings, navigate)}
            className="inline-flex items-center gap-1.5 rounded-md border border-crimson/30 bg-crimson/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-crimson-glow hover:bg-crimson/20 transition-colors"
          >
            + SkidGraph (Visual View)
          </button>
          <button
            onClick={() => {
              if (confirmDelete(c.name)) delCase.mutate();
            }}
            className="p-2 rounded-md text-muted-foreground hover:text-crimson-glow hover:bg-crimson/10 transition-colors"
            aria-label="Delete case"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        </div>
      </header>

      <main className="flex-1 mx-auto w-full max-w-[1600px] px-4 sm:px-6 py-6 grid grid-cols-1 xl:grid-cols-[1fr_420px] gap-6">
        {/* Notes + findings */}
        <section className="min-w-0 flex flex-col gap-6">
          <div className="rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-crimson/10 px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Case notes
              </div>
              <div className="flex items-center gap-1 rounded-md border border-crimson/15 bg-background/40 p-0.5 text-xs">
                <button
                  onClick={() => setMode("edit")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded ${mode === "edit" ? "bg-crimson/20 text-crimson-glow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Edit3 className="h-3 w-3" /> Edit
                </button>
                <button
                  onClick={() => setMode("preview")}
                  className={`inline-flex items-center gap-1 px-2.5 py-1 rounded ${mode === "preview" ? "bg-crimson/20 text-crimson-glow" : "text-muted-foreground hover:text-foreground"}`}
                >
                  <Eye className="h-3 w-3" /> Preview
                </button>
              </div>
            </div>
            {mode === "edit" ? (
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Write your findings, timeline, leads, and conclusions here… (autosaves · markdown supported)"
                className="w-full min-h-[420px] resize-y rounded-b-xl bg-transparent px-5 py-4 font-mono text-sm text-foreground placeholder:text-muted-foreground/50 focus:outline-none"
              />
            ) : (
              <pre className="w-full min-h-[420px] px-5 py-4 font-mono text-sm text-foreground/90 whitespace-pre-wrap break-words">
                {notes || "// empty"}
              </pre>
            )}
          </div>

          <div className="rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl">
            <div className="flex items-center justify-between border-b border-crimson/10 px-4 py-3">
              <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground">
                Attached findings · {findings.length}
              </div>
            </div>
            <div className="p-3 space-y-2">
              {!findings.length ? (
                <div className="text-center py-12 text-xs text-muted-foreground font-mono">
                  // run a module from the dashboard and use "Add to case" to attach results
                </div>
              ) : (
                findings.map((f) => <FindingCard key={f.id} f={f} onDelete={() => delFinding.mutate(f.id)} />)
              )}
            </div>
          </div>
        </section>

        {/* OSINT Assistant */}
        <aside className="flex flex-col rounded-xl border border-crimson/15 bg-card/30 backdrop-blur-xl min-h-[600px] xl:min-h-0 xl:sticky xl:top-[5rem] xl:max-h-[calc(100vh-6.5rem)]">
          <div className="border-b border-crimson/10 px-4 py-3 flex items-center gap-2">
            <Sparkles className="h-4 w-4 text-crimson-glow" />
            <span className="font-display font-semibold">OSINT Assistant</span>
          </div>
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            <div className="rounded-lg border border-crimson/15 bg-background/40 p-3 text-sm">
              Hey — I'm your OSINT assistant for this case. I can read your case notes, format them, run
              lookups, and write breaches/passwords straight back into the notepad. Try "format the notes"
              or "look up the email in the notes".
            </div>
            {(threadQ.data?.messages ?? []).map((m) => <Bubble key={m.id} m={m} />)}
            {send.isPending && (
              <div className="text-xs text-muted-foreground font-mono animate-pulse">// agent typing…</div>
            )}
            {send.isError && (
              <div className="text-xs text-amber-300 font-mono">{(send.error as Error).message}</div>
            )}
          </div>

          {confirm && (
            <ConfirmRunModule
              c={confirm}
              loading={runProposed.isPending}
              error={runProposed.error as Error | null}
              onCancel={() => setConfirm(null)}
              onAllow={() => runProposed.mutate({ slug: confirm.slug, query: confirm.query })}
            />
          )}

          <div className="border-t border-crimson/10 p-3 space-y-2">
            <div className="flex flex-wrap gap-1">
              {QUICK.map((q) => (
                <button
                  key={q}
                  onClick={() => setInput(q)}
                  className="rounded-md border border-crimson/15 bg-background/40 px-2 py-1 text-[11px] font-mono text-muted-foreground hover:text-crimson-glow hover:border-crimson/40 transition-colors"
                >
                  {q}
                </button>
              ))}
            </div>
            <div className="flex gap-2">
              <input
                value={input}
                onChange={(e) => setInput(e.target.value)}
                placeholder="Ask the assistant…"
                disabled={!threadId || send.isPending}
                className="flex-1 rounded-md border border-crimson/25 bg-background/60 px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-crimson/60 disabled:opacity-50"
                onKeyDown={(e) => {
                  if (e.key === "Enter" && input.trim() && threadId) {
                    send.mutate(input.trim());
                    setInput("");
                  }
                }}
              />
              <Button
                variant="hero" size="icon"
                disabled={!input.trim() || !threadId || send.isPending}
                onClick={() => { send.mutate(input.trim()); setInput(""); }}
                aria-label="Send"
              >
                {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </aside>
      </main>
    </div>
    </AppShell>
  );
}

const QUICK = ["Format the notes", "Look up the email in the notes", "Summarize this case", "Suggest next steps"];

function Bubble({ m }: { m: ChatMsg }) {
  const isUser = m.role === "user";
  // Strip the run_module fence visually
  const display = m.content.replace(/```run_module[\s\S]*?```/g, "").trim();
  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[90%] rounded-lg px-3 py-2 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? "bg-crimson/15 border border-crimson/30 text-foreground"
            : "bg-background/60 border border-crimson/10 text-foreground/90"
        }`}
      >
        {display || <span className="italic text-muted-foreground">// pending…</span>}
      </div>
    </div>
  );
}

function FindingCard({ f, onDelete }: { f: { id: string; module_name: string; module_category: string; query: string; result_json: string; created_at: string }; onDelete: () => void }) {
  const [open, setOpen] = useState(false);
  const pretty = (() => {
    try { return JSON.stringify(JSON.parse(f.result_json), null, 2); } catch { return f.result_json; }
  })();
  return (
    <div className="rounded-lg border border-crimson/15 bg-background/40">
      <div className="flex items-center gap-2 px-3 py-2">
        <Database className="h-3.5 w-3.5 text-crimson-glow" />
        <div className="flex-1 min-w-0">
          <div className="text-sm font-display font-semibold truncate">{f.module_name}</div>
          <div className="font-mono text-[11px] text-muted-foreground truncate">
            {f.module_category} · q: <span className="text-foreground/80">{f.query}</span>
          </div>
        </div>
        <button onClick={() => setOpen((o) => !o)} className="p-1.5 rounded text-muted-foreground hover:text-crimson-glow">
          <ChevronDown className={`h-4 w-4 transition-transform ${open ? "rotate-180" : ""}`} />
        </button>
        <button onClick={onDelete} className="p-1.5 rounded text-muted-foreground hover:text-crimson-glow" aria-label="Remove">
          <Trash2 className="h-4 w-4" />
        </button>
      </div>
      {open && (
        <pre className="border-t border-crimson/10 max-h-72 overflow-auto px-3 py-2 font-mono text-[11px] text-foreground/85 whitespace-pre-wrap break-all">
          {pretty}
        </pre>
      )}
    </div>
  );
}

function ConfirmRunModule({
  c, loading, error, onAllow, onCancel,
}: {
  c: { slug: string; query: string; reason: string };
  loading: boolean; error: Error | null;
  onAllow: () => void; onCancel: () => void;
}) {
  const mod = moduleBySlug(c.slug);
  return (
    <div className="border-t border-amber-400/30 bg-amber-400/5 px-4 py-3 text-xs">
      <div className="flex items-center gap-2 text-amber-300 font-mono uppercase tracking-widest text-[10px]">
        <AlertTriangle className="h-3 w-3" /> Agent wants to run a module
      </div>
      <div className="mt-2 text-foreground">
        <span className="font-mono text-crimson-glow">{mod?.name ?? c.slug}</span>{" "}
        on <span className="font-mono">{c.query}</span>
      </div>
      {c.reason && <p className="mt-1 text-muted-foreground">{c.reason}</p>}
      <div className="mt-2 text-muted-foreground">
        Cost: <span className="text-foreground">1 credit</span> (one-time credit if available, otherwise daily quota)
      </div>
      {error && <p className="mt-2 text-amber-300">{error.message}</p>}
      <div className="mt-3 flex gap-2">
        <Button size="sm" variant="hero" disabled={loading} onClick={onAllow}>
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />}
          Allow
        </Button>
        <Button size="sm" variant="outline" disabled={loading} onClick={onCancel}>
          <X className="h-3.5 w-3.5" /> Deny
        </Button>
      </div>
    </div>
  );
}

function confirmDelete(name: string) {
  return typeof window !== "undefined" && window.confirm(`Delete case "${name}"? This cannot be undone.`);
}

function sendToSkidGraph(
  ownerId: string,
  c: { id: string; name: string; notes?: string },
  findings: Array<{ id: string; module_slug?: string; module_name: string; module_category: string; query: string; result_json?: string }>,
  navigate: ReturnType<typeof useNavigate>,
) {
  const graphId = seedGraphFromCase(ownerId, c, findings);
  navigate({ to: "/skidgraph/$graphId", params: { graphId } });
}
