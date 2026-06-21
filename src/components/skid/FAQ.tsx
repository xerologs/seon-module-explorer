import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useReveal } from "@/lib/use-reveal";

const faqs = [
  {
    q: "Is using SkidSint legal?",
    a: "Yes. SkidSint only aggregates publicly available and lawfully obtained data. You are responsible for using it in accordance with the laws of your jurisdiction and our Terms of Service.",
  },
  {
    q: "Do my searches leak to the target?",
    a: "No. Every lookup is performed against our indexed datasets or via passive, unattributed infrastructure. Targets never receive a probe, a DNS hit, or a request from you.",
  },
  {
    q: "Where is my data stored?",
    a: "Account metadata is stored on hardened EU/US edge nodes with at-rest encryption. Query history is retained only for your own dashboard and can be purged at any time.",
  },
  {
    q: "What is the SKID key?",
    a: "It's a cryptographically random alphanumeric identifier we issue once at signup. It acts as your password — there is no email recovery, by design, to keep your operator identity unattributed.",
  },
  {
    q: "Can I integrate it with my own tooling?",
    a: "Operator and Red Team tiers include a REST API, a streaming WebSocket feed, and CLI exports compatible with Maltego, Obsidian, Splunk, and Elasticsearch. (COMMING SOON)",
  },
  {
    q: "How do I cancel?",
    a: "Contact @breachcheck, one message. No phone calls, no retention specialists, no dark patterns.",
  },
];

export function FAQ() {
  const ref = useReveal();
  return (
    <section
      ref={ref as React.RefObject<HTMLElement>}
      id="features"
      className="relative py-32 px-6"
    >
      <div className="mx-auto max-w-3xl">
        <div className="text-center mb-12 reveal">
          <div className="font-mono text-[11px] uppercase tracking-[0.2em] text-crimson-glow mb-3">
            // 03 — FAQ
          </div>
          <h2 className="font-display text-4xl sm:text-5xl font-semibold tracking-tight">
            Operator <span className="text-crimson text-glow">briefing</span>.
          </h2>
        </div>
        <div className="reveal">
          <Accordion type="single" collapsible className="space-y-3">
            {faqs.map((f, i) => (
              <AccordionItem
                key={i}
                value={`item-${i}`}
                className="rounded-lg border border-crimson/20 bg-card/40 backdrop-blur-sm px-5 hover:border-crimson/50 transition-colors data-[state=open]:border-crimson/60 data-[state=open]:border-glow"
              >
                <AccordionTrigger className="font-display text-base hover:no-underline hover:text-crimson-glow py-5">
                  {f.q}
                </AccordionTrigger>
                <AccordionContent className="text-muted-foreground leading-relaxed pb-5">
                  {f.a}
                </AccordionContent>
              </AccordionItem>
            ))}
          </Accordion>
        </div>
      </div>
    </section>
  );
}
