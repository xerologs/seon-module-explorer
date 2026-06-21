import { createFileRoute } from "@tanstack/react-router";
import { Nav } from "@/components/skid/Nav";
import { Footer } from "@/components/skid/Footer";
import { Hero } from "@/components/skid/Hero";
import { Information } from "@/components/skid/Information";
import { Pricing } from "@/components/skid/Pricing";
import { FAQ } from "@/components/skid/FAQ";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "SkidSint — Red-Team Grade OSINT Terminal" },
      {
        name: "description",
        content:
          "SkidSint aggregates 80+ open intelligence sources into one passive, unattributed terminal for analysts, threat hunters, and red teams.",
      },
      { property: "og:title", content: "SkidSint — Red-Team Grade OSINT Terminal" },
      {
        property: "og:description",
        content:
          "One terminal. 80+ data sources. Passive, unattributed OSINT for analysts and red teams.",
      },
      { name: "twitter:title", content: "SkidSint — Red-Team Grade OSINT Terminal" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1">
        <Hero />
        <Information />
        <Pricing />
        <FAQ />
      </main>
      <Footer />
    </div>
  );
}
