import { useMemo, useState } from "react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import {
  ShieldAlert, MessageSquare, Users, Globe2, Fingerprint, Lock, Play, Loader2,
  AlertTriangle, ChevronLeft, ChevronRight, FolderPlus, Check, Gamepad2,
  MapPin, ScanFace, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { tierRank, type Tier } from "@/lib/plans";
import { executeModule } from "@/lib/dashboard.functions";
import { listCases, addFinding } from "@/lib/cases.functions";
import type { ModuleCategory } from "@/lib/modules-catalog";
import { ResultViewer } from "./ResultViewer";

type ModuleSummary = {
  slug: string; name: string; category: ModuleCategory;
  description: string; inputLabel: string; inputPlaceholder: string; minTier: Tier;
  comingSoon?: boolean; image?: string | null;
};

const CAT_META: Record<ModuleCategory, { icon: typeof ShieldAlert; tint: string; blurb: string }> = {
  Breach:   { icon: ShieldAlert,   tint: "from-crimson/25",        blurb: "Credential & infostealer dumps." },
  Discord:  { icon: MessageSquare, tint: "from-indigo-500/25",     blurb: "Discord IDs, history & pivots." },
  Gaming:   { icon: Gamepad2,      tint: "from-emerald-500/20",    blurb: "Gaming profile recon (Steam, Xbox, Roblox, MC)." },
  Social:   { icon: Users,         tint: "from-sky-500/20",        blurb: "Social profile recon. Coming soon." },
  IP:       { icon: Globe2,        tint: "from-amber-500/20",      blurb: "Geo, ASN, and IP reputation." },
  Identity: { icon: Fingerprint,   tint: "from-fuchsia-500/25",    blurb: "Email & identity OSINT." },
  Location: { icon: MapPin,        tint: "from-rose-500/25",       blurb: "Geo-OSINT, image geolocation & street pivots. Coming soon." },
  Face:     { icon: ScanFace,      tint: "from-violet-500/25",     blurb: "Reverse face search across the public web. Coming soon." },
};

const CATEGORY_ORDER: ModuleCategory[] = ["Breach", "Discord", "Gaming", "Social", "IP", "Identity", "Location", "Face"];

interface Props {
  modules: ModuleSummary[];
  tier: Tier;
  session: { handle: string; secret_id: string };
  onUpgrade: (planName: string) => void;
  onUsed: () => void;
}

export function ModulesGrid({ modules, tier, session, onUpgrade, onUsed }: Props) {
  const [category, setCategory] = useState<ModuleCategory | null>(null);
  const [active, setActive] = useState<string | null>(null);

  const grouped = useMemo(() => {
    const map = new Map<ModuleCategory, ModuleSummary[]>();
    for (const m of modules) {
      const arr = map.get(m.category) ?? [];
      arr.push(m);
      map.set(m.category, arr);
    }
    return map;
  }, [modules]);

  if (!category) {
    return (
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {CATEGORY_ORDER.map((cat, i) => {
          const list = grouped.get(cat) ?? [];
          const Icon = CAT_META[cat].icon;
          const tint = CAT_META[cat].tint;
          const effRank = tierRank(tier);
          const lockedCount = list.filter((m) => m.comingSoon || effRank < tierRank(m.minTier)).length;
          return (
            <button
              key={cat}
              onClick={() => setCategory(cat)}
              className="group relative overflow-hidden rounded-xl border border-crimson/20 bg-card/50 backdrop-blur-xl p-6 text-left transition-all hover:border-crimson/60 hover:shadow-[0_0_40px_-10px_oklch(0.6_0.26_22/45%)]"
              style={{ animation: `fade-up 0.6s ${i * 60}ms both` }}
            >
              <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl pointer-events-none`} />
              <div className="relative">
                <div className="flex items-center justify-between">
                  <div className="h-11 w-11 rounded-lg border border-crimson/25 bg-background/40 grid place-items-center text-crimson-glow">
                    <Icon className="h-5 w-5" />
                  </div>
                  <ChevronRight className="h-4 w-4 text-muted-foreground group-hover:text-crimson-glow transition-colors" />
                </div>
                <div className="mt-4 font-mono text-[10px] uppercase tracking-widest text-muted-foreground">Category</div>
                <h3 className="mt-1 font-display text-xl font-semibold tracking-tight text-foreground">{cat}</h3>
                <p className="mt-2 text-xs text-muted-foreground">{CAT_META[cat].blurb}</p>
                <div className="mt-4 flex items-center gap-3 text-[11px] font-mono">
                  <span className="rounded-full border border-crimson/30 bg-crimson/5 px-2 py-0.5 text-crimson-glow">
                    {list.length} modules
                  </span>
                  {lockedCount > 0 && (
                    <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/30 bg-amber-400/5 px-2 py-0.5 text-amber-300">
                      <Lock className="h-3 w-3" /> {lockedCount} locked
                    </span>
                  )}
                </div>
              </div>
            </button>
          );
        })}
      </div>
    );
  }

  const list = grouped.get(category) ?? [];
  return (
    <div>
      <div className="mb-5 flex items-center justify-between gap-3" style={{ animation: "fade-up 0.4s both" }}>
        <button
          onClick={() => { setCategory(null); setActive(null); }}
          className="inline-flex items-center gap-1.5 rounded-md border border-crimson/25 bg-card/40 px-3 py-1.5 text-xs font-mono text-muted-foreground hover:text-crimson-glow hover:border-crimson/60 transition-colors"
        >
          <ChevronLeft className="h-3.5 w-3.5" /> All categories
        </button>
        <div className="text-right">
          <div className="font-mono text-[10px] uppercase tracking-widest text-crimson-glow/80">Category</div>
          <div className="font-display text-lg font-semibold text-foreground">{category}</div>
        </div>
      </div>

      {list.length === 0 ? (
        <div className="rounded-xl border border-dashed border-crimson/25 bg-card/30 p-10 text-center">
          <div className="font-mono text-[11px] uppercase tracking-widest text-crimson-glow/70">Empty category</div>
          <h4 className="mt-2 font-display text-xl font-semibold text-foreground">No modules here yet</h4>
          <p className="mt-1 text-sm text-muted-foreground">{CAT_META[category].blurb}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 auto-rows-fr">
          {list.map((m, i) => {
            const effRank = tierRank(tier);
            const locked = m.comingSoon || effRank < tierRank(m.minTier);
            return (
              <ModuleCard
                key={m.slug}
                mod={m}
                locked={locked}
                comingSoon={!!m.comingSoon}
                delay={i * 50}
                expanded={active === m.slug}
                onToggle={() => setActive((cur) => (cur === m.slug ? null : m.slug))}
                session={session}
                onUpgrade={onUpgrade}
                onUsed={onUsed}
              />
            );
          })}
        </div>
      )}
    </div>
  );
}

function ModuleCard({
  mod, locked, comingSoon, delay, expanded, onToggle, session, onUpgrade, onUsed,
}: {
  mod: ModuleSummary;
  locked: boolean;
  comingSoon: boolean;
  delay: number;
  expanded: boolean;
  onToggle: () => void;
  session: { handle: string; secret_id: string };
  onUpgrade: (planName: string) => void;
  onUsed: () => void;
}) {
  const Icon = CAT_META[mod.category].icon;
  const tint = CAT_META[mod.category].tint;
  const [query, setQuery] = useState("");
  const [pickOpen, setPickOpen] = useState(false);
  const [savedTo, setSavedTo] = useState<string | null>(null);
  const execFn = useServerFn(executeModule);
  const listCasesFn = useServerFn(listCases);
  const addFn = useServerFn(addFinding);

  const run = useMutation({
    mutationFn: () => execFn({ data: { ...session, slug: mod.slug, query } }),
    onSettled: () => { setSavedTo(null); onUsed(); },
  });

  const cases = useQuery({
    queryKey: ["cases", session.handle],
    queryFn: () => listCasesFn({ data: session }),
    enabled: pickOpen,
  });

  const attach = useMutation({
    mutationFn: (caseId: string) =>
      addFn({ data: { ...session, case_id: caseId, slug: mod.slug, query, result_json: run.data?.dataJson ?? "null" } }),
    onSuccess: (_d, caseId) => { setSavedTo(caseId); setPickOpen(false); },
  });

  return (
    <div
      className={`relative overflow-hidden rounded-xl border bg-card/50 backdrop-blur-xl p-5 transition-all
        ${locked ? "border-crimson/10 opacity-80" : "border-crimson/20 hover:border-crimson/50"}`}
      style={{ animation: `fade-up 0.6s ${delay}ms both` }}
    >
      <div className={`absolute -top-12 -right-12 h-32 w-32 rounded-full bg-gradient-to-br ${tint} to-transparent blur-2xl pointer-events-none`} />

      <div className="relative">
        {mod.image && (
          <div className="relative -mx-5 -mt-5 mb-4 h-32 overflow-hidden border-b border-crimson/20">
            <img
              src={mod.image}
              alt={mod.name}
              loading="lazy"
              width={768}
              height={512}
              className="h-full w-full object-cover opacity-80"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-card via-card/30 to-transparent" />
            {comingSoon && (
              <span className="absolute top-2 right-2 inline-flex items-center gap-1 rounded-full border border-amber-400/50 bg-background/70 px-2 py-0.5 text-[10px] font-mono text-amber-300 backdrop-blur">
                <Clock className="h-3 w-3" /> Coming soon
              </span>
            )}
          </div>
        )}
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-lg border border-crimson/25 bg-background/40 grid place-items-center text-crimson-glow">
              <Icon className="h-4 w-4" />
            </div>
            <div>
              <div className="font-mono text-[10px] uppercase tracking-widest text-muted-foreground">{mod.category}</div>
              <div className="font-display text-base font-semibold text-foreground leading-tight">{mod.name}</div>
            </div>
          </div>
          {comingSoon ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
              <Clock className="h-3 w-3" /> Coming soon
            </span>
          ) : locked ? (
            <span className="inline-flex items-center gap-1 rounded-full border border-amber-400/40 bg-amber-400/10 px-2 py-0.5 text-[10px] font-mono text-amber-300">
              <Lock className="h-3 w-3" /> {mod.minTier}+
            </span>
          ) : (
            <span className="inline-flex items-center gap-1 rounded-full border border-emerald-400/40 bg-emerald-400/10 px-2 py-0.5 text-[10px] font-mono text-emerald-300">
              ● Ready
            </span>
          )}
        </div>

        <p className="mt-3 text-xs text-muted-foreground">{mod.description}</p>

        <div className="mt-4 flex flex-wrap gap-2">
          {comingSoon ? (
            <Button size="sm" variant="outlineGlow" disabled className="w-full sm:w-auto">
              <Clock className="h-3.5 w-3.5 mr-1.5" /> Coming soon
            </Button>
          ) : locked ? (
            <Button size="sm" variant="outlineGlow" onClick={() => onUpgrade(mod.minTier)} className="w-full sm:w-auto">
              <Lock className="h-3.5 w-3.5 mr-1.5" /> Unlock — Upgrade
            </Button>
          ) : (
            <Button size="sm" variant="hero" onClick={onToggle} className="w-full sm:w-auto">
              <Play className="h-3.5 w-3.5 mr-1.5" /> {expanded ? "Close" : "Run module"}
            </Button>
          )}
        </div>

        {expanded && !locked && (
          <div className="mt-4 space-y-2 animate-fade-up">
            <label className="block text-[10px] uppercase tracking-widest font-mono text-muted-foreground">
              {mod.inputLabel}
            </label>
            <div className="flex gap-2">
              <input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder={mod.inputPlaceholder}
                className="flex-1 rounded-md border border-crimson/25 bg-background/60 px-3 py-2 font-mono text-sm text-foreground placeholder:text-muted-foreground/60 focus:outline-none focus:border-crimson/60"
              />
              <Button size="sm" variant="hero" disabled={!query.trim() || run.isPending} onClick={() => run.mutate()}>
                {run.isPending ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Execute"}
              </Button>
            </div>
            {run.isError && (
              <div className="flex items-start gap-2 text-xs text-amber-300 font-mono">
                <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                {(run.error as Error).message}
              </div>
            )}
            {run.data && (
              <>
                {run.data.error ? (
                  <div className="flex items-start gap-2 text-xs text-amber-300 font-mono">
                    <AlertTriangle className="h-3.5 w-3.5 mt-0.5 shrink-0" />
                    {run.data.error} — no credit charged.
                  </div>
                ) : (
                  <ResultViewer rawJson={run.data.dataJson} source={mod.name} />
                )}
                <div className="relative">
                  <Button
                    size="sm" variant="outlineGlow"
                    disabled={!!savedTo || !!run.data.error}
                    onClick={() => setPickOpen((o) => !o)}
                  >
                    {savedTo ? <Check className="h-3.5 w-3.5" /> : <FolderPlus className="h-3.5 w-3.5" />}
                    {savedTo ? "Attached to case" : "Add to investigation"}
                  </Button>
                  {pickOpen && !savedTo && (
                    <div className="absolute z-20 mt-1 w-64 rounded-md border border-crimson/30 bg-popover/95 backdrop-blur-xl shadow-lg p-2 max-h-72 overflow-y-auto">
                      {cases.isLoading ? (
                        <div className="text-xs text-muted-foreground p-2">Loading cases…</div>
                      ) : !cases.data?.length ? (
                        <div className="text-xs text-muted-foreground p-2">
                          No cases yet. Create one from the Investigations page.
                        </div>
                      ) : (
                        cases.data.map((c) => (
                          <button
                            key={c.id}
                            onClick={() => attach.mutate(c.id)}
                            disabled={attach.isPending}
                            className="block w-full text-left text-sm px-2 py-1.5 rounded hover:bg-crimson/15 hover:text-crimson-glow truncate"
                          >
                            {c.name}
                          </button>
                        ))
                      )}
                      {attach.isError && (
                        <div className="text-[11px] text-amber-300 p-2">{(attach.error as Error).message}</div>
                      )}
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
