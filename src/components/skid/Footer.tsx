import { Link } from "@tanstack/react-router";

const links: { label: string; doc: "privacy" | "terms" | "eula" | "acceptable-use" | "cookies" }[] = [
  { label: "Privacy", doc: "privacy" },
  { label: "Terms", doc: "terms" },
  { label: "EULA", doc: "eula" },
  { label: "Acceptable Use", doc: "acceptable-use" },
  { label: "Cookies", doc: "cookies" },
];

export function Footer() {
  return (
    <footer className="relative border-t border-crimson/15 bg-background/60 backdrop-blur-sm">
      <div className="mx-auto max-w-7xl px-6 py-8 flex flex-col sm:flex-row items-center justify-between gap-4">
        <p className="font-mono text-xs text-muted-foreground">
          © {new Date().getFullYear()}{" "}
          <span className="text-foreground/80">
            skidsint<span className="text-crimson"></span>.
          </span>{" "}
          · All rights reserved.
        </p>
        <ul className="flex items-center gap-1 flex-wrap">
          {links.map((l) => (
            <li key={l.label}>
              <Link
                to="/legal/$doc"
                params={{ doc: l.doc }}
                className="px-3 py-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground hover:text-crimson-glow transition-colors"
              >
                {l.label}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </footer>
  );
}
