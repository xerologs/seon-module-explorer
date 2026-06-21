import { useEffect } from "react";
import { Send, Lock, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { TELEGRAM_HANDLE } from "@/lib/plans";

interface Props {
  open: boolean;
  planName?: string;
  onClose: () => void;
}

export function UpgradeModal({ open, planName = "this plan", onClose }: Props) {
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);
    document.body.style.overflow = "hidden";
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = "";
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-[100] grid place-items-center p-4 animate-fade-up" role="dialog" aria-modal="true">
      <div className="absolute inset-0 bg-background/80 backdrop-blur-md" onClick={onClose} />
      <div
        className="relative w-full max-w-md rounded-xl border border-crimson/40 bg-popover/80 backdrop-blur-xl p-7 border-glow-strong"
        style={{ animation: "fade-up 0.5s cubic-bezier(0.16,1,0.3,1) both" }}
      >
        <button
          onClick={onClose}
          aria-label="Close"
          className="absolute top-3 right-3 p-2 text-muted-foreground hover:text-crimson-glow transition-colors"
        >
          <X className="h-4 w-4" />
        </button>

        <div className="inline-flex items-center gap-2 rounded-full border border-crimson/40 bg-crimson/10 px-3 py-1 text-[10px] font-mono uppercase tracking-[0.2em] text-crimson-glow">
          <Lock className="h-3 w-3" /> Upgrade Required
        </div>
        <h3 className="mt-4 font-display text-2xl font-semibold tracking-tight">
          Unlock <span className="text-crimson-glow text-glow">{planName}</span>
        </h3>
        <p className="mt-2 text-sm text-muted-foreground">
          Contact <span className="text-foreground font-mono">{TELEGRAM_HANDLE}</span> on Telegram to purchase{" "}
          <span className="text-foreground">{planName}</span> and receive your activation key.
        </p>

        <div className="mt-5 rounded-lg border border-crimson/20 bg-card/60 p-4 font-mono text-xs">
          <div className="text-muted-foreground mb-1">// telegram operator</div>
          <div className="text-crimson-glow text-base tracking-wider">{TELEGRAM_HANDLE}</div>
        </div>

        <div className="mt-6 flex flex-col sm:flex-row gap-2">
          <Button asChild variant="hero" size="lg" className="flex-1">
            <a
              href={`https://t.me/${TELEGRAM_HANDLE.replace(/^@/, "")}`}
              target="_blank"
              rel="noopener noreferrer"
            >
              <Send className="h-4 w-4 mr-1.5" /> Open Telegram
            </a>
          </Button>
          <Button variant="outline" size="lg" onClick={onClose}>
            Cancel
          </Button>
        </div>
        <p className="mt-4 text-[10px] font-mono text-muted-foreground/70">
          // payments handled off-platform · keys delivered manually
        </p>
      </div>
    </div>
  );
}
