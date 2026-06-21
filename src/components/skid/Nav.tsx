import { useEffect, useRef, useState } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { AuthModal } from "./AuthModal";
import { useAuth } from "@/lib/auth-context";
import { Gauge, LogOut, Send, Terminal } from "lucide-react";

export function Nav() {
  const [open, setOpen] = useState(false);
  const [mode, setMode] = useState<"login" | "signup">("login");
  const { session, logout } = useAuth();
  const navigate = useNavigate();
  const prevSession = useRef(session);

  // Auto-redirect to dashboard after a fresh login/signup via the modal
  useEffect(() => {
    if (!prevSession.current && session && open) {
      setOpen(false);
      navigate({ to: "/dashboard" });
    }
    prevSession.current = session;
  }, [session, open, navigate]);

  function openWith(m: "login" | "signup") {
    setMode(m);
    setOpen(true);
  }

  return (
    <>
      <header className="fixed top-0 inset-x-0 z-50 backdrop-blur-md bg-background/40 border-b border-crimson/15">
        <div className="mx-auto max-w-7xl px-6 h-14 flex items-center justify-between">
          <Link
            to="/"
            hash="hero"
            className="group flex items-center gap-2 font-mono text-sm tracking-tight"
            aria-label="skidsint home"
          >
            <Terminal className="h-4 w-4 text-crimson group-hover:text-crimson-glow transition-colors" />
            <span className="font-display lowercase font-medium text-foreground/90 group-hover:text-crimson-glow transition-colors">
              skidsint<span className="text-crimson"></span>.
            </span>
          </Link>

          <nav className="flex items-center gap-2">
            <a
              href="https://t.me/skidsint"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:inline-flex items-center justify-center h-8 w-8 rounded-md border border-crimson/30 bg-crimson/5 text-crimson-glow hover:bg-crimson/15 hover:border-crimson/60 transition-all"
              aria-label="Telegram"
              title="Join us on Telegram"
            >
              <Send className="h-3.5 w-3.5" />
            </a>
            {session ? (
              <>
                <span className="hidden sm:inline-block font-mono text-xs text-muted-foreground mr-2">
                  <span className="text-crimson-glow">@</span>
                  {session.handle}
                </span>
                <Button variant="hero" size="sm" asChild>
                  <Link to="/dashboard">
                    <Gauge className="h-3.5 w-3.5" />
                    <span className="hidden sm:inline">Dashboard</span>
                  </Link>
                </Button>
                <Button variant="ghostGlow" size="sm" onClick={logout}>
                  <LogOut className="h-3.5 w-3.5" />
                  <span className="hidden sm:inline">Sign out</span>
                </Button>
              </>
            ) : (
              <>
                <Button variant="ghostGlow" size="sm" onClick={() => openWith("login")}>
                  Login
                </Button>
                <Button variant="hero" size="sm" onClick={() => openWith("signup")}>
                  Sign Up
                </Button>
              </>
            )}
          </nav>
        </div>
      </header>
      <AuthModal open={open} onOpenChange={setOpen} initialMode={mode} />
    </>
  );
}
