import { Button } from "@/components/ui/button";
import { ArrowDown, Send, Sparkles } from "lucide-react";

function scrollTo(id: string) {
  document.getElementById(id)?.scrollIntoView({ behavior: "smooth", block: "start" });
}

export function Hero() {
  return (
    <section
      id="hero"
      className="relative min-h-screen flex items-center justify-center overflow-hidden pt-14"
    >
      {/* Grid + scanline backdrop */}
      <div className="absolute inset-0 grid-bg pointer-events-none" />
      <div className="absolute inset-0 overflow-hidden pointer-events-none">
        <div className="absolute left-0 right-0 h-px bg-gradient-to-r from-transparent via-crimson-glow/60 to-transparent animate-scan" />
      </div>
      <div className="absolute inset-x-0 bottom-0 h-48 section-fade pointer-events-none" />

      <div className="relative mx-auto max-w-5xl px-6 text-center">
        <div className="inline-flex items-center gap-2 rounded-full border border-crimson/40 bg-crimson/5 px-3 py-1 mb-8 backdrop-blur-sm animate-fade-up">
          <Sparkles className="h-3 w-3 text-crimson-glow" />
          <span className="font-mono text-[11px] uppercase tracking-[0.18em] text-crimson-glow">
            OSINT · Intelligence Aggregation
          </span>
        </div>

        <h1
          className="font-display font-bold tracking-tight text-[clamp(3.5rem,12vw,9rem)] leading-[0.95] text-foreground text-glow animate-glitch"
        >
          Skid<span className="text-crimson">Sint</span>.

        </h1>

        <p className="mt-6 max-w-2xl mx-auto text-base sm:text-lg text-muted-foreground animate-fade-up" style={{ animationDelay: "200ms" }}>
          A red-team grade open-source intelligence terminal. Aggregate, correlate, and dissect
          surface signals across the dark and visible web — fast, quiet, and unattributed.
        </p>

        <div
          className="mt-10 flex flex-wrap items-center justify-center gap-3 animate-fade-up"
          style={{ animationDelay: "400ms" }}
        >
          <Button variant="hero" size="lg" onClick={() => scrollTo("pricing")}>
            Pricing
          </Button>
          <Button variant="outlineGlow" size="lg" onClick={() => scrollTo("information")}>
            Information
          </Button>
          <Button variant="outlineGlow" size="lg" onClick={() => scrollTo("features")}>
            Features
          </Button>
        </div>

        <div
          className="mt-8 flex flex-col items-center gap-4 animate-fade-up"
          style={{ animationDelay: "600ms" }}
        >
          <button
            onClick={() => scrollTo("information")}
            className="text-muted-foreground hover:text-crimson-glow transition-colors animate-pulse-glow rounded-full p-2"
            aria-label="Scroll down"
          >
            <ArrowDown className="h-5 w-5" />
          </button>

          <a
            href="https://t.me/skidsint"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-full border border-crimson/40 bg-crimson/5 px-4 py-2 text-xs font-mono uppercase tracking-[0.18em] text-crimson-glow hover:border-crimson hover:bg-crimson/10 hover:border-glow transition-all"
          >
            <Send className="h-3.5 w-3.5" />
            Join us on Telegram
          </a>
        </div>
      </div>
    </section>
  );
}
