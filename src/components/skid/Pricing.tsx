import { useState } from "react";
import { Check, Zap, X as XIcon } from "lucide-react";
import { Button } from "@/components/ui/button";
import { useReveal } from "@/lib/use-reveal";
import { PLANS, TIER_ORDER, type Tier } from "@/lib/plans";
import { UpgradeModal } from "./UpgradeModal";

const COMPARISON_ROWS: { label: string; values: Record<Tier, string | boolean> }[] = [
  { label: "Daily requests", values: { Guest: "0", Basic: "100", Investigator: "500", Lifetime: "2,000" } },
  { label: "Powerful Modules", values: { Guest: false, Basic: true, Investigator: true, Lifetime: true } },
  { label: "Premium Modules", values: { Guest: false, Basic: false, Investigator: true, Lifetime: true } },
  { label: "OSINT Agent (AI)", values: { Guest: false, Basic: false, Investigator: true, Lifetime: true } },
  { label: "Case Creator", values: { Guest: false, Basic: true, Investigator: true, Lifetime: true } },
  { label: "SkidGraph ", values: { Guest: false, Basic: false, Investigator: true, Lifetime: true } },
  { label: "Priority support", values: { Guest: false, Basic: false, Investigator: true, Lifetime: true } },
  { label: "Billing", values: { Guest: "Free", Basic: "Monthly", Investigator: "Monthly", Lifetime: "One-time" } },
];

export function Pricing() {
  const ref = useReveal();
  const [upgradeFor, setUpgradeFor] = useState<string | null>(null);

  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="pricing"
      className="relative py-32 px-6 overflow-hidden"
    >
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-crimson/5 to-transparent pointer-events-none" />
      <div className="relative mx-auto max-w-6xl">
        <div className="text-center max-w-2xl mx-auto mb-14 reveal">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-crimson-glow mb-3">
            // 02 — Plans &amp; Pricing
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            One terminal. <span className="text-crimson text-glow">Four tiers.</span>
          </h2>
          <p className="mt-4 text-muted-foreground">
            Transparent pricing. Manual onboarding via Telegram. No surprise overages.
          </p>
        </div>

        {/* Plan cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
          {TIER_ORDER.map((tier, i) => {
            const p = PLANS[tier];
            const isGuest = tier === "Guest";
            return (
              <div
                key={tier}
                className={`reveal group relative rounded-xl p-6 backdrop-blur-sm transition-all duration-300 hover:-translate-y-1 ${
                  p.highlight
                    ? "border-glow-strong border border-crimson/60 bg-gradient-to-br from-crimson/15 via-card/60 to-card/30"
                    : "border border-crimson/20 bg-card/40 hover:border-crimson/50 hover:border-glow"
                }`}
                style={{ transitionDelay: `${i * 80}ms` }}
              >
                {p.highlight && (
                  <div className="absolute -top-3 left-1/2 -translate-x-1/2 inline-flex items-center gap-1 rounded-full bg-crimson text-primary-foreground px-3 py-0.5 text-[10px] font-mono uppercase tracking-widest shadow-[0_0_24px_oklch(0.6_0.26_22/0.6)]">
                    <Zap className="h-3 w-3" /> Most Picked
                  </div>
                )}
                <h3 className="font-display text-xl font-semibold mb-1">{p.name}</h3>
                <p className="text-xs text-muted-foreground mb-5 min-h-[2.5rem]">{p.blurb}</p>
                <div className="flex items-baseline gap-1 mb-5">
                  <span className="font-display text-4xl font-bold tracking-tight">{p.price}</span>
                  <span className="text-xs text-muted-foreground font-mono">{p.cadence}</span>
                </div>
                <ul className="space-y-2 mb-6">
                  {p.features.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-sm">
                      <Check className="h-4 w-4 text-crimson-glow shrink-0 mt-0.5" />
                      <span className="text-foreground/85">{f}</span>
                    </li>
                  ))}
                </ul>
                <Button
                  variant={p.highlight ? "hero" : "outlineGlow"}
                  size="lg"
                  className="w-full"
                  disabled={isGuest}
                  onClick={() => !isGuest && setUpgradeFor(p.name)}
                >
                  {isGuest ? "Default Tier" : "Get Started"}
                </Button>
              </div>
            );
          })}
        </div>

        {/* Full comparison table */}
        <div className="mt-16 reveal">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-crimson-glow/80 mb-4 text-center">
            // Full plan comparison
          </div>
          <div className="overflow-x-auto rounded-xl border border-crimson/20 bg-card/40 backdrop-blur-md">
            <table className="w-full text-sm min-w-[640px]">
              <thead>
                <tr className="border-b border-crimson/20 text-left">
                  <th className="p-4 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">Feature</th>
                  {TIER_ORDER.map((t) => (
                    <th
                      key={t}
                      className={`p-4 font-display text-sm ${
                        t === "Investigator" ? "text-crimson-glow text-glow" : "text-foreground"
                      }`}
                    >
                      {t}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {COMPARISON_ROWS.map((row, i) => (
                  <tr key={row.label} className={i % 2 ? "bg-background/30" : ""}>
                    <td className="p-4 text-foreground/80">{row.label}</td>
                    {TIER_ORDER.map((t) => {
                      const v = row.values[t];
                      return (
                        <td key={t} className="p-4">
                          {typeof v === "boolean" ? (
                            v ? (
                              <Check className="h-4 w-4 text-crimson-glow" />
                            ) : (
                              <XIcon className="h-4 w-4 text-muted-foreground/40" />
                            )
                          ) : (
                            <span className="font-mono text-xs text-foreground/85">{v}</span>
                          )}
                        </td>
                      );
                    })}
                  </tr>
                ))}
                <tr className="border-t border-crimson/20">
                  <td className="p-4" />
                  {TIER_ORDER.map((t) => {
                    const p = PLANS[t];
                    const isGuest = t === "Guest";
                    return (
                      <td key={t} className="p-4">
                        <Button
                          size="sm"
                          variant={p.highlight ? "hero" : "outlineGlow"}
                          disabled={isGuest}
                          onClick={() => !isGuest && setUpgradeFor(p.name)}
                          className="w-full"
                        >
                          {isGuest ? "Default" : "Get Started"}
                        </Button>
                      </td>
                    );
                  })}
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </div>

      <UpgradeModal open={!!upgradeFor} planName={upgradeFor ?? undefined} onClose={() => setUpgradeFor(null)} />
    </section>
  );
}
