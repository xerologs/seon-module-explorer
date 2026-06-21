import { useEffect, useMemo } from "react";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { ArrowLeft, Lock } from "lucide-react";
import { useAuth } from "@/lib/auth-context";
import { tierRank } from "@/lib/plans";
import { AppShell } from "@/components/skid/AppShell";
import { NexusCanvas } from "@/components/skid/NexusCanvas";
import { Button } from "@/components/ui/button";
import { listGraphs } from "@/lib/skidgraph";

export const Route = createFileRoute("/skidgraph/$graphId")({
  head: () => ({
    meta: [
      { title: "SkidGraph — SkidSint" },
      { name: "robots", content: "noindex,nofollow" },
    ],
  }),
  component: SkidGraphPage,
});

function SkidGraphPage() {
  const { graphId } = Route.useParams();
  const { session, ready } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    if (ready && !session) navigate({ to: "/", hash: "hero", replace: true });
  }, [ready, session, navigate]);

  const entry = useMemo(
    () => session ? listGraphs(session.id).find((g) => g.id === graphId) : undefined,
    [graphId, session?.id],
  );

  if (!ready || !session) {
    return <div className="min-h-screen grid place-items-center font-mono text-xs text-muted-foreground animate-pulse">// loading…</div>;
  }

  const allowed = tierRank(session.tier) >= tierRank("Investigator");

  return (
    <AppShell>
      <div className="flex-1 flex flex-col">
        <header className="border-b border-crimson/15 bg-background/60 backdrop-blur-md sticky top-0 z-30">
          <div className="mx-auto max-w-[1600px] px-6 h-14 flex items-center gap-3">
            <Link
              to="/skidgraph"
              className="p-2 rounded-md text-muted-foreground hover:text-crimson-glow hover:bg-crimson/10 transition-colors"
              aria-label="Back to graphs"
            >
              <ArrowLeft className="h-4 w-4" />
            </Link>
            <h1 className="font-display text-base font-semibold truncate flex-1">
              {entry?.name ?? "SkidGraph"}
            </h1>
            <span className="inline-flex items-center gap-1.5 rounded-full border border-crimson/40 bg-crimson/10 px-2.5 py-1 text-[10px] font-mono uppercase tracking-widest text-crimson-glow">
              Investigator+
            </span>
          </div>
        </header>

        {allowed ? (
          <NexusCanvas id={graphId} ownerId={session.id} name={entry?.name} />
        ) : (
          <div className="flex-1 grid place-items-center px-6">
            <div className="max-w-md text-center rounded-xl border border-crimson/25 bg-card/40 backdrop-blur-md p-8">
              <div className="mx-auto h-12 w-12 grid place-items-center rounded-md border border-crimson/40 bg-crimson/10 text-crimson-glow mb-4">
                <Lock className="h-5 w-5" />
              </div>
              <h2 className="font-display text-xl font-semibold mb-2">Locked to Investigator+</h2>
              <p className="text-sm text-muted-foreground mb-6">
                SkidGraph — drag-and-drop identity board with card, logo-orbit, and 3D layouts —
                is included with the Investigator and Lifetime tiers.
              </p>
              <Button asChild variant="hero" size="lg">
                <Link to="/" hash="pricing">See pricing</Link>
              </Button>
            </div>
          </div>
        )}
      </div>
    </AppShell>
  );
}
