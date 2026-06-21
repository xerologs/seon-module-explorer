import { type ReactNode } from "react";
import { createFileRoute, Link } from "@tanstack/react-router";
import { ArrowLeft, ScrollText } from "lucide-react";
import { Nav } from "@/components/skid/Nav";
import { Footer } from "@/components/skid/Footer";

export const Route = createFileRoute("/legal/$doc")({
  head: ({ params }) => {
    const meta = DOCS[params.doc] ?? FALLBACK;
    return {
      meta: [
        { title: `${meta.title} — SkidSint` },
        { name: "description", content: meta.summary },
        { property: "og:title", content: `${meta.title} — SkidSint` },
        { property: "og:description", content: meta.summary },
        { name: "robots", content: "index,follow" },
      ],
    };
  },
  component: LegalDocPage,
  notFoundComponent: () => <NotFoundDoc />,
});

type DocDef = { title: string; summary: string; updated: string; body: ReactNode };

const FALLBACK: DocDef = {
  title: "Legal",
  summary: "SkidSint legal documents.",
  updated: "2026-06-20",
  body: <p>Document not found.</p>,
};

const DOCS: Record<string, DocDef> = {
  privacy: {
    title: "Privacy Policy",
    summary: "How SkidSint collects, processes, and discards your data.",
    updated: "2026-06-20",
    body: (
      <>
        <Section title="1. What we collect">
          <p>
            SkidSint stores only what is required to operate the platform: a self-chosen handle, the
            randomly-generated SKID key, your plan tier, role, request counters, investigation case data,
            and AI chat history you create. We do not collect real names, email addresses, phone numbers,
            payment card data, IP geolocation, or device fingerprints from end users.
          </p>
        </Section>
        <Section title="2. What we do not store">
          <p>
            The targets you query (emails, usernames, Discord IDs, IPs, etc.) are forwarded to the
            upstream intelligence aggregator for the duration of the request only. Module responses are
            <strong> not</strong> persisted server-side unless you explicitly attach them to a case via the
            "Add to investigation" action. We do not log raw query parameters.
          </p>
        </Section>
        <Section title="3. Cookies & local storage">
          <p>
            We use a single <code>localStorage</code> entry (<code>skidsint.session.v2</code>) to keep
            you signed in across reloads. No third-party analytics, advertising cookies, or trackers are
            embedded. See the <Link to="/legal/$doc" params={{ doc: "cookies" }} className="text-crimson-glow underline">Cookie Policy</Link>.
          </p>
        </Section>
        <Section title="4. Third parties">
          <p>
            We pass module requests to OATH.NET-class intelligence APIs and route AI agent prompts through
            the Lovable AI Gateway. Supabase provides our database. None of these vendors receive your
            SKID key.
          </p>
        </Section>
        <Section title="5. Data deletion">
          <p>
            Delete any case or chat thread to remove its rows instantly. To wipe your entire account,
            contact the operator on Telegram (handle listed in the dashboard upgrade modal).
          </p>
        </Section>
        <Section title="6. Children">
          <p>
            SkidSint is restricted to users 18+ and to authorized security professionals. We do not
            knowingly process data from minors.
          </p>
        </Section>
        <Section title="7. Changes">
          <p>
            Material changes to this policy will be announced via the in-app banner at least seven days
            before they take effect.
          </p>
        </Section>
      </>
    ),
  },
  terms: {
    title: "Terms of Service",
    summary: "The agreement that governs your use of SkidSint.",
    updated: "2026-06-20",
    body: (
      <>
        <Section title="1. Acceptance">
          <p>
            By creating a SkidSint account you confirm you are at least 18 years old, that you are a
            security professional, researcher, or authorized investigator, and that you agree to these
            Terms, the <Link to="/legal/$doc" params={{ doc: "acceptable-use" }} className="text-crimson-glow underline">Acceptable Use Policy</Link>,
            the <Link to="/legal/$doc" params={{ doc: "eula" }} className="text-crimson-glow underline">EULA</Link>,
            and the <Link to="/legal/$doc" params={{ doc: "privacy" }} className="text-crimson-glow underline">Privacy Policy</Link>.
          </p>
        </Section>
        <Section title="2. Account & key">
          <p>
            Your SKID key is the sole credential. We cannot recover it for you. You are responsible for
            every request issued from your account. Sharing, reselling, or sub-licensing access is
            grounds for immediate termination without refund.
          </p>
        </Section>
        <Section title="3. Plans, credits & refunds">
          <p>
            Plans are billed off-platform via the operator. Daily-quota and one-time credits are
            non-transferable. All sales are final once the SKID key is issued. Lifetime access persists
            for the operational lifetime of the platform — we make no guarantee of perpetual uptime.
          </p>
        </Section>
        <Section title="4. Service availability">
          <p>
            We provide SkidSint and its upstream modules "as is" with no SLA. Modules may break, return
            stale data, or be removed at any time when upstream sources change.
          </p>
        </Section>
        <Section title="5. Termination">
          <p>
            We may suspend or terminate accounts that violate the Acceptable Use Policy, that attempt to
            abuse rate limits, or that target SkidSint infrastructure itself.
          </p>
        </Section>
        <Section title="6. Liability">
          <p>
            To the maximum extent permitted by law, SkidSint and its operators are not liable for any
            indirect, incidental, or consequential damages arising from use of the platform. Total
            liability is capped at the amount you paid in the prior 30 days.
          </p>
        </Section>
        <Section title="7. Governing law & disputes">
          <p>
            These Terms are governed by the laws of the operator's jurisdiction. Disputes are resolved by
            binding individual arbitration; class actions are waived.
          </p>
        </Section>
      </>
    ),
  },
  eula: {
    title: "End-User License Agreement",
    summary: "Your license to access the SkidSint software platform.",
    updated: "2026-06-20",
    body: (
      <>
        <Section title="1. Grant of license">
          <p>
            Subject to your active plan and these terms, SkidSint grants you a non-exclusive,
            non-transferable, revocable license to access and use the SkidSint platform via the official
            web interface.
          </p>
        </Section>
        <Section title="2. Restrictions">
          <ul>
            <li>No reverse-engineering, scraping, or rebuilding our endpoints into another product.</li>
            <li>No automated abuse of the request rate limits.</li>
            <li>No redistribution of module output as a commercial dataset.</li>
            <li>No use of the platform to violate the <Link to="/legal/$doc" params={{ doc: "acceptable-use" }} className="text-crimson-glow underline">Acceptable Use Policy</Link>.</li>
          </ul>
        </Section>
        <Section title="3. Ownership">
          <p>
            SkidSint, its UI, its module orchestration code and its branding remain the sole property of
            the operator. No rights are transferred to you.
          </p>
        </Section>
        <Section title="4. Output">
          <p>
            Module output is sourced from public and breach-corpus intelligence feeds. You are solely
            responsible for what you do with it. Always verify before acting on a finding.
          </p>
        </Section>
        <Section title="5. Termination">
          <p>
            Your license terminates automatically if you breach these terms or if your plan lapses.
          </p>
        </Section>
      </>
    ),
  },
  "acceptable-use": {
    title: "Acceptable Use Policy",
    summary: "What you may and may not do with SkidSint.",
    updated: "2026-06-20",
    body: (
      <>
        <Section title="Intended use">
          <p>
            SkidSint is built for authorized security research, red-team engagements, fraud investigation,
            journalism, and CTI work. You must have a lawful basis for every query you run.
          </p>
        </Section>
        <Section title="Prohibited use">
          <ul>
            <li>Doxxing, harassment, stalking, or coordinated targeting of individuals.</li>
            <li>Swatting, threats of violence, or any activity that endangers physical safety.</li>
            <li>Identity theft, account takeover, financial fraud, or unauthorized account access.</li>
            <li>Targeting minors in any capacity.</li>
            <li>Use against critical infrastructure, government systems, or healthcare providers without explicit written authorization.</li>
            <li>Reselling raw module output as a competitor product.</li>
          </ul>
        </Section>
        <Section title="Reporting & enforcement">
          <p>
            We honor lawful takedown requests and cooperate with credible abuse reports. Confirmed abuse
            results in immediate account termination with no refund. Severe cases are referred to the
            relevant authorities.
          </p>
        </Section>
      </>
    ),
  },
  cookies: {
    title: "Cookie Policy",
    summary: "How SkidSint uses local storage and cookies.",
    updated: "2026-06-20",
    body: (
      <>
        <Section title="What we use">
          <p>
            SkidSint does not set advertising or third-party tracking cookies. We use a single
            first-party browser storage entry (<code>localStorage</code>) to persist your active session
            so you do not have to re-enter your handle and SKID key on every page load.
          </p>
        </Section>
        <Section title="How to clear it">
          <p>
            Click <strong>Sign out</strong> anywhere in the app, or clear your browser's site data for the
            SkidSint domain.
          </p>
        </Section>
        <Section title="Strictly-necessary classification">
          <p>
            Under most cookie regimes (incl. ePrivacy / GDPR Art. 5(3) exception) the session entry is a
            strictly-necessary technical storage operation and does not require opt-in consent.
          </p>
        </Section>
      </>
    ),
  },
};

function Section({ title, children }: { title: string; children: ReactNode }) {
  return (
    <section className="mt-8 first:mt-0">
      <h2 className="font-display text-xl font-semibold text-foreground tracking-tight">{title}</h2>
      <div className="mt-3 space-y-3 text-sm leading-relaxed text-muted-foreground [&_a]:text-crimson-glow [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1 [&_code]:rounded [&_code]:bg-card/60 [&_code]:px-1.5 [&_code]:py-0.5 [&_code]:font-mono [&_code]:text-xs [&_code]:text-foreground/80 [&_strong]:text-foreground">
        {children}
      </div>
    </section>
  );
}

function NotFoundDoc() {
  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 mx-auto max-w-3xl px-6 pt-32 pb-16">
        <h1 className="font-display text-3xl font-bold">Document not found</h1>
        <Link to="/" className="mt-4 inline-block text-crimson-glow">← Back home</Link>
      </main>
      <Footer />
    </div>
  );
}

function LegalDocPage() {
  const { doc } = Route.useParams();
  const meta = DOCS[doc];
  if (!meta) return <NotFoundDoc />;

  return (
    <div className="min-h-screen flex flex-col">
      <Nav />
      <main className="flex-1 mx-auto w-full max-w-3xl px-6 pt-28 pb-20">
        <Link
          to="/"
          className="inline-flex items-center gap-2 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-crimson-glow transition-colors"
        >
          <ArrowLeft className="h-3.5 w-3.5" /> Back home
        </Link>

        <div className="mt-6 flex items-start gap-4">
          <div className="h-12 w-12 shrink-0 rounded-lg border border-crimson/30 bg-card/60 backdrop-blur-md grid place-items-center text-crimson-glow">
            <ScrollText className="h-5 w-5" />
          </div>
          <div>
            <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-crimson-glow/80">
              Legal · skidsint.
            </div>
            <h1 className="mt-1 font-display text-3xl font-bold tracking-tight">{meta.title}</h1>
            <p className="mt-1 text-xs text-muted-foreground">
              Last updated <time>{meta.updated}</time>
            </p>
          </div>
        </div>

        <div className="mt-10 rounded-xl border border-crimson/15 bg-card/40 backdrop-blur-xl p-7">
          {meta.body}
        </div>

        <nav className="mt-10 grid grid-cols-2 sm:grid-cols-5 gap-2 text-[11px] font-mono uppercase tracking-widest">
          {(["privacy", "terms", "eula", "acceptable-use", "cookies"] as const).map((d) => (
            <Link
              key={d}
              to="/legal/$doc"
              params={{ doc: d }}
              className={`rounded-md border px-3 py-2 text-center transition-colors ${
                d === doc
                  ? "border-crimson/60 bg-crimson/10 text-crimson-glow"
                  : "border-crimson/15 bg-card/30 text-muted-foreground hover:text-crimson-glow hover:border-crimson/40"
              }`}
            >
              {d.replace("-", " ")}
            </Link>
          ))}
        </nav>
      </main>
      <Footer />
    </div>
  );
}
