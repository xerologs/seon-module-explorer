import { Boxes, Database, Eye, Globe2, Network, ShieldAlert } from "lucide-react";
import { useReveal } from "@/lib/use-reveal";

const cards = [
  {
    icon: Globe2,
    title: "Surface Aggregation",
    body: "Crawl 80+ data sources in parallel — leaked archives, paste sites, registries, social graphs — into one normalized timeline.",
  },
  {
    icon: Network,
    title: "Correlation Graph",
    body: "Pivot from a single email, hash, or handle to a full identity cluster with live edge-weighted relationship mapping.",
  },
  {
    icon: Database,
    title: "Breach Intelligence",
    body: "Query 30B+ indexed credentials and infostealer logs with sub-second response. Filterable by domain, vector, and date.",
  },
  {
    icon: Eye,
    title: "Passive Recon",
    body: "All lookups are unattributed and zero-touch. Targets never see a probe, a request, or a footprint.",
  },
  {
    icon: ShieldAlert,
    title: "Threat Surface",
    body: "Continuous monitoring of your own assets with red-flag alerts the moment a new exposure surfaces.",
  },
  {
    icon: Boxes,
    title: "SkidGraph",
    body: "Drag any of 150+ network, social, and identity nodes onto an infinite board to assemble a target. Switch between card, logo-orbit, and full-3D layouts on the fly. Investigator+.",
  },
];

export function Information() {
  const ref = useReveal();
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="information"
      className="relative py-32 px-6"
    >
      <div className="mx-auto max-w-6xl">
        <div className="max-w-2xl mb-16 reveal">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-crimson-glow mb-3">
            // 01 — Capabilities
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Intelligence, distilled to <span className="text-crimson text-glow">signal</span>.
          </h2>
          <p className="mt-4 text-muted-foreground">
            SkidSint compresses the open web's noise into actionable, time-correlated intelligence.
            Built for analysts, threat hunters, and red teams who measure outcomes in minutes.
          </p>
        </div>

        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {cards.map((c, i) => (
            <div
              key={c.title}
              className="reveal group relative rounded-lg border border-crimson/20 bg-card/40 backdrop-blur-sm p-6 transition-all duration-300 hover:border-crimson/60 hover:-translate-y-1 hover:border-glow"
              style={{ transitionDelay: `${i * 60}ms` }}
            >
              <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-crimson/40 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
              <div className="grid h-10 w-10 place-items-center rounded-md border border-crimson/40 bg-crimson/10 text-crimson-glow mb-4">
                <c.icon className="h-5 w-5" />
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{c.title}</h3>
              <p className="text-sm text-muted-foreground leading-relaxed">{c.body}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
