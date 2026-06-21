import { useEffect, useMemo, useState } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  MessageSquarePlus, Sparkles, Send, Loader2, Trash2, FolderPlus,
  Lock, AlertTriangle, X, Check,
} from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { listThreads, createThread, deleteThread, getThread, sendChatMessage } from "@/lib/ai.functions";
import { executeModule } from "@/lib/dashboard.functions";
import { listCases, addFinding } from "@/lib/cases.functions";
import { Button } from "@/components/ui/button";
import { tierRank } from "@/lib/plans";
import { moduleBySlug } from "@/lib/modules-catalog";
import { UpgradeModal } from "@/components/skid/UpgradeModal";
import { AppShell } from "@/components/skid/AppShell";

export const Route = createFileRoute("/chat")({
  head: () => ({
    meta: [
      { title: "OSINT Agent (AI) — SkidSint" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: ChatPage,
});

function ChatPage() {
  const { session, ready } = useAuth();
  const navigate = useNavigate();
  const qc = useQueryClient();

  const [activeId, setActiveId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [showUpgrade, setShowUpgrade] = useState(false);
  const [confirm, setConfirm] = useState<{ slug: string; query: string; reason: string } | null>(null);

  useEffect(() => {
    if (ready && !session) navigate({ to: "/", hash: "hero", replace: true });
  }, [ready, session, navigate]);

  if (!ready || !session) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground">// loading…</div>;
  }

  const auth = { handle: session.handle, secret_id: session.secret_id };
  const elevated = session.role !== "user";
  const allowed = elevated || tierRank(session.tier) >= tierRank("Investigator");

  const listFn = useServerFn(listThreads);
  const createFn = useServerFn(createThread);
  const delFn = useServerFn(deleteThread);
  const getFn = useServerFn(getThread);
  const sendFn = useServerFn(sendChatMessage);
  const execFn = useServerFn(executeModule);
  const listCasesFn = useServerFn(listCases);
  const addFindingFn = useServerFn(addFinding);

  const threads = useQuery({
    queryKey: ["threads", session.handle],
    queryFn: () => listFn({ data: auth }),
    enabled: allowed,
  });

  // Auto-select first or create
  useEffect(() => {
    if (!allowed) return;
    if (activeId) return;
    if (threads.data === undefined) return;
    if (threads.data.length) { setActiveId(threads.data[0].id); return; }
    createFn({ data: { ...auth, title: "New chat" } }).then((r) => {
      setActiveId(r.id);
      qc.invalidateQueries({ queryKey: ["threads"] });
    }).catch(() => {});
  }, [allowed, threads.data, activeId]);

  const thread = useQuery({
    queryKey: ["thread", activeId],
    queryFn: () => getFn({ data: { ...auth, thread_id: activeId! } }),
    enabled: !!activeId,
  });

  const send = useMutation({
    mutationFn: (text: string) =>
      sendFn({ data: { ...auth, thread_id: activeId!, content: text } }),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["thread", activeId] });
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  // Detect module proposal in last assistant msg
  useEffect(() => {
    const msgs = thread.data?.messages ?? [];
    const last = msgs[msgs.length - 1];
    if (!last || last.role !== "assistant") return;
    const m = last.content.match(/```run_module\s*([\s\S]*?)```/);
    if (!m) return;
    try {
      const p = JSON.parse(m[1].trim()) as { slug?: string; query?: string; reason?: string };
      if (p.slug && p.query) setConfirm({ slug: p.slug, query: p.query, reason: p.reason ?? "" });
    } catch { /* noop */ }
  }, [thread.data?.messages.length]);

  const runProposed = useMutation({
    mutationFn: async (p: { slug: string; query: string }) => {
      const r = await execFn({ data: { ...auth, slug: p.slug, query: p.query } });
      await sendFn({
        data: {
          ...auth, thread_id: activeId!,
          content: `MODULE RESULT — ${p.slug}("${p.query}"):\n\`\`\`json\n${r.dataJson.slice(0, 6000)}\n\`\`\`${r.error ? `\n(error: ${r.error})` : ""}`,
        },
      });
      return r;
    },
    onSuccess: () => { setConfirm(null); qc.invalidateQueries({ queryKey: ["thread", activeId] }); },
  });

  const newChat = useMutation({
    mutationFn: () => createFn({ data: { ...auth, title: "New chat" } }),
    onSuccess: (row) => {
      setActiveId(row.id);
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  const delThread = useMutation({
    mutationFn: (id: string) => delFn({ data: { ...auth, thread_id: id } }),
    onSuccess: () => {
      if (activeId) setActiveId(null);
      qc.invalidateQueries({ queryKey: ["threads"] });
    },
  });

  // Cases for "Add to case" button
  const cases = useQuery({
    queryKey: ["cases", session.handle],
    queryFn: () => listCasesFn({ data: auth }),
    enabled: allowed,
  });

  const projects = useMemo(() => threads.data ?? [], [threads.data]);

  if (!allowed) {
    return (
      <AppShell>
        <main className="flex-1 mx-auto max-w-2xl px-6 pt-20 pb-20 text-center">
          <div className="rounded-xl border border-amber-400/30 bg-amber-400/5 p-10">
            <Lock className="h-10 w-10 mx-auto text-amber-300" />
            <h1 className="mt-4 font-display text-2xl font-bold">OSINT Agent (AI) requires Investigator+</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              The jailbroken OSINT chat assistant — including module orchestration and case
              integration — is unlocked on the Investigator plan and above.
            </p>
            <Button variant="hero" size="lg" className="mt-5" onClick={() => setShowUpgrade(true)}>
              Upgrade to Investigator
            </Button>
          </div>
        </main>
        <UpgradeModal open={showUpgrade} planName="Investigator" onClose={() => setShowUpgrade(false)} />
      </AppShell>
    );
  }

  return (
    <AppShell>
    <div className="flex flex-1 min-w-0">
      {/* Threads sidebar */}
      <aside className="hidden md:flex w-64 shrink-0 flex-col border-r border-crimson/15 bg-background/40 backdrop-blur-xl">
        <div className="p-3">
          <Button
            variant="outlineGlow" size="lg" className="w-full justify-center"
            disabled={newChat.isPending}
            onClick={() => newChat.mutate()}
          >
            <MessageSquarePlus className="h-4 w-4 mr-1.5" /> New chat
          </Button>
        </div>
        <div className="px-4 mt-2 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Projects
        </div>
        <div className="px-3 mt-2">
          <Link
            to="/investigations"
            className="block rounded-md border border-crimson/10 bg-card/40 px-3 py-2 text-sm text-foreground/80 hover:text-crimson-glow hover:border-crimson/40 transition-colors"
          >
            All cases →
          </Link>
        </div>
        <div className="px-4 mt-5 font-mono text-[10px] uppercase tracking-[0.25em] text-muted-foreground">
          Chats
        </div>
        <nav className="flex-1 overflow-y-auto px-2 py-2 space-y-1">
          {projects.map((t) => {
            const active = t.id === activeId;
            return (
              <div key={t.id} className={`group relative rounded-md ${active ? "bg-crimson/15 border border-crimson/40" : "border border-transparent hover:bg-crimson/10"}`}>
                <button
                  onClick={() => setActiveId(t.id)}
                  className={`block w-full text-left px-3 py-2 pr-8 truncate text-sm ${active ? "text-crimson-glow" : "text-foreground/80"}`}
                >
                  {t.title}
                </button>
                <button
                  onClick={() => { if (confirm && false) {} if (typeof window !== "undefined" && window.confirm("Delete chat?")) delThread.mutate(t.id); }}
                  aria-label="Delete"
                  className="absolute top-1.5 right-1.5 p-1 rounded text-muted-foreground opacity-0 group-hover:opacity-100 hover:text-crimson-glow"
                >
                  <Trash2 className="h-3.5 w-3.5" />
                </button>
              </div>
            );
          })}
          {!projects.length && (
            <div className="text-center py-8 text-xs text-muted-foreground font-mono">// no chats yet</div>
          )}
        </nav>
      </aside>

      {/* Main */}
      <main className="flex-1 min-w-0 flex flex-col">
        <header className="border-b border-crimson/15 bg-background/60 backdrop-blur-md h-14 flex items-center px-4 gap-2">
          <Sparkles className="h-4 w-4 text-crimson-glow" />
          <h1 className="font-display font-semibold truncate">
            {thread.data?.thread.title ?? "New chat"}
          </h1>
        </header>

        <div className="flex-1 overflow-y-auto px-4 sm:px-8 py-6">
          {!thread.data || !thread.data.messages.length ? (
            <div className="h-full grid place-items-center text-center">
              <div>
                <div className="mx-auto h-14 w-14 rounded-full border border-crimson/30 bg-card/60 grid place-items-center text-crimson-glow">
                  <Sparkles className="h-6 w-6" />
                </div>
                <h2 className="mt-4 font-display text-xl font-bold">Ask the OSINT agent (AI) anything</h2>
                <p className="mt-2 text-sm text-muted-foreground max-w-md mx-auto">
                  Run lookups, correlate breaches, or plan an investigation. Try "look up the email
                  name@example.com".
                </p>
              </div>
            </div>
          ) : (
            <div className="max-w-3xl mx-auto space-y-4">
              {thread.data.messages.map((m) => (
                <MessageBubble
                  key={m.id} m={m}
                  cases={cases.data ?? []}
                  onAddToCase={(caseId, slug, query, json) =>
                    addFindingFn({ data: { ...auth, case_id: caseId, slug, query, result_json: json } })
                      .then(() => qc.invalidateQueries({ queryKey: ["case"] }))
                  }
                />
              ))}
              {send.isPending && (
                <div className="text-xs text-muted-foreground font-mono animate-pulse">// agent typing…</div>
              )}
              {send.isError && (
                <div className="text-xs text-amber-300 font-mono">{(send.error as Error).message}</div>
              )}
            </div>
          )}
        </div>

        {confirm && (
          <div className="border-t border-amber-400/30 bg-amber-400/5 px-6 py-4 text-sm max-w-3xl mx-auto w-full">
            <div className="flex items-center gap-2 text-amber-300 font-mono uppercase tracking-widest text-[10px]">
              <AlertTriangle className="h-3 w-3" /> Agent wants to run a module
            </div>
            <div className="mt-2 text-foreground">
              Allow the AI to search through modules?{" "}
              <span className="font-mono text-crimson-glow">
                {moduleBySlug(confirm.slug)?.name ?? confirm.slug}
              </span>{" "}
              on <span className="font-mono">{confirm.query}</span>
            </div>
            {confirm.reason && <p className="mt-1 text-xs text-muted-foreground">{confirm.reason}</p>}
            <div className="mt-1 text-xs text-muted-foreground">Price: <span className="text-foreground">1 credit</span> (one-time credit if available, otherwise daily quota)</div>
            {runProposed.error && <p className="mt-2 text-xs text-amber-300">{(runProposed.error as Error).message}</p>}
            <div className="mt-3 flex gap-2">
              <Button size="sm" variant="hero" disabled={runProposed.isPending} onClick={() => runProposed.mutate({ slug: confirm.slug, query: confirm.query })}>
                {runProposed.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Check className="h-3.5 w-3.5" />} Allow
              </Button>
              <Button size="sm" variant="outline" disabled={runProposed.isPending} onClick={() => setConfirm(null)}>
                <X className="h-3.5 w-3.5" /> Deny
              </Button>
            </div>
          </div>
        )}

        <div className="border-t border-crimson/10 p-4">
          <div className="max-w-3xl mx-auto flex gap-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Message the OSINT agent…"
              disabled={!activeId || send.isPending}
              className="flex-1 rounded-md border border-crimson/25 bg-background/60 px-4 py-2.5 text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-crimson/60 disabled:opacity-50"
              onKeyDown={(e) => {
                if (e.key === "Enter" && input.trim() && activeId) {
                  send.mutate(input.trim()); setInput("");
                }
              }}
            />
            <Button
              variant="hero" size="icon"
              disabled={!input.trim() || !activeId || send.isPending}
              onClick={() => { send.mutate(input.trim()); setInput(""); }}
              aria-label="Send"
            >
              {send.isPending ? <Loader2 className="h-4 w-4 animate-spin" /> : <Send className="h-4 w-4" />}
            </Button>
          </div>
        </div>
      </main>

      <UpgradeModal open={showUpgrade} planName="Investigator" onClose={() => setShowUpgrade(false)} />
    </div>
    </AppShell>
  );
}

function MessageBubble({
  m, cases, onAddToCase,
}: {
  m: { id: string; role: string; content: string; created_at: string };
  cases: { id: string; name: string }[];
  onAddToCase: (caseId: string, slug: string, query: string, json: string) => Promise<unknown>;
}) {
  const isUser = m.role === "user";
  const display = m.content.replace(/```run_module[\s\S]*?```/g, "").trim();
  // Detect "MODULE RESULT — slug("query"):" pattern in user-role messages — render as attached result
  const resultMatch = m.content.match(/^MODULE RESULT — (\S+?)\("([^"]+)"\):\s*```json\s*([\s\S]*?)```/);

  if (resultMatch) {
    const [, slug, query, json] = resultMatch;
    return (
      <ResultAttachable slug={slug} query={query} json={json} cases={cases} onAddToCase={onAddToCase} />
    );
  }

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"}`}>
      <div
        className={`max-w-[85%] rounded-lg px-4 py-2.5 text-sm whitespace-pre-wrap break-words ${
          isUser
            ? "bg-crimson/15 border border-crimson/30 text-foreground"
            : "bg-background/60 border border-crimson/10 text-foreground/90"
        }`}
      >
        {display}
      </div>
    </div>
  );
}

function ResultAttachable({
  slug, query, json, cases, onAddToCase,
}: {
  slug: string; query: string; json: string;
  cases: { id: string; name: string }[];
  onAddToCase: (caseId: string, slug: string, query: string, json: string) => Promise<unknown>;
}) {
  const [pick, setPick] = useState(false);
  const [saved, setSaved] = useState(false);
  const mod = moduleBySlug(slug);
  const pretty = (() => { try { return JSON.stringify(JSON.parse(json), null, 2); } catch { return json; } })();
  return (
    <div className="rounded-lg border border-emerald-400/25 bg-emerald-400/5 p-3">
      <div className="flex items-center justify-between gap-2">
        <div className="font-mono text-[11px] uppercase tracking-widest text-emerald-300">
          ◉ Module result — {mod?.name ?? slug} · q: <span className="text-foreground">{query}</span>
        </div>
        <div className="relative">
          <Button size="sm" variant="outlineGlow" disabled={saved} onClick={() => setPick((p) => !p)}>
            <FolderPlus className="h-3.5 w-3.5" /> {saved ? "Attached" : "Add to case"}
          </Button>
          {pick && !saved && (
            <div className="absolute top-full right-0 mt-1 z-20 w-60 rounded-md border border-crimson/30 bg-popover/95 backdrop-blur-xl shadow-lg p-2 space-y-1">
              {!cases.length ? (
                <div className="text-xs text-muted-foreground p-2">No cases yet</div>
              ) : cases.map((c) => (
                <button
                  key={c.id}
                  onClick={async () => {
                    await onAddToCase(c.id, slug, query, json);
                    setSaved(true); setPick(false);
                  }}
                  className="block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-crimson/15 hover:text-crimson-glow truncate"
                >
                  {c.name}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
      <pre className="mt-2 max-h-60 overflow-auto rounded bg-background/60 border border-crimson/10 px-3 py-2 font-mono text-[11px] text-foreground/85 whitespace-pre-wrap break-all">
        {pretty}
      </pre>
    </div>
  );
}
