import { useEffect, useState } from "react";
import { useServerFn } from "@tanstack/react-start";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Checkbox } from "@/components/ui/checkbox";
import { toast } from "sonner";
import { Check, Copy, KeyRound, Loader2, ShieldCheck, UserPlus } from "lucide-react";
import { signupAccount, loginAccount } from "@/lib/auth.functions";
import { useAuth } from "@/lib/auth-context";

type Mode = "login" | "signup";

export function AuthModal({
  open,
  onOpenChange,
  initialMode = "login",
}: {
  open: boolean;
  onOpenChange: (v: boolean) => void;
  initialMode?: Mode;
}) {
  const [mode, setMode] = useState<Mode>(initialMode);
  const [issuedKey, setIssuedKey] = useState<{ handle: string; secret_id: string } | null>(null);

  useEffect(() => {
    if (open) setMode(initialMode);
  }, [open, initialMode]);

  return (
    <Dialog
      open={open}
      onOpenChange={(v) => {
        onOpenChange(v);
        if (!v) {
          setTimeout(() => {
            setIssuedKey(null);
            setMode(initialMode);
          }, 200);
        }
      }}
    >
      <DialogContent className="border-glow bg-popover/90 backdrop-blur-xl sm:max-w-md p-0 overflow-hidden">
        <div className="relative">
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-crimson-glow to-transparent" />
          <div className="p-7">
            {issuedKey ? (
              <SuccessPanel data={issuedKey} onClose={() => onOpenChange(false)} />
            ) : mode === "login" ? (
              <LoginPanel onSwap={() => setMode("signup")} onDone={() => onOpenChange(false)} />
            ) : (
              <SignupPanel onSwap={() => setMode("login")} onIssued={setIssuedKey} />
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function Header({ icon: Icon, title, subtitle }: { icon: typeof KeyRound; title: string; subtitle: string }) {
  return (
    <div className="mb-6">
      <DialogTitle className="sr-only">{title}</DialogTitle>
      <div className="flex items-center gap-3">
        <div className="grid h-10 w-10 place-items-center rounded-md border border-crimson/40 bg-crimson/10 text-crimson-glow border-glow">
          <Icon className="h-5 w-5" />
        </div>
        <div>
          <h2 className="font-display text-xl font-semibold tracking-tight">{title}</h2>
          <p className="text-xs text-muted-foreground font-mono uppercase tracking-widest">{subtitle}</p>
        </div>
      </div>
    </div>
  );
}

function LoginPanel({ onSwap, onDone }: { onSwap: () => void; onDone: () => void }) {
  const [handle, setHandle] = useState("");
  const [secret, setSecret] = useState("");
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const login = useServerFn(loginAccount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      const res = await login({ data: { handle, secret_id: secret.trim().toUpperCase() } });
      setSession(res);
      toast.success(`Welcome back, ${res.handle}`);
      onDone();
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Login failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header icon={KeyRound} title="Access Terminal" subtitle="Authenticate with your SKID key" />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="login-handle" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Handle
          </Label>
          <Input
            id="login-handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="operator_07"
            autoComplete="username"
            className="font-mono bg-background/40 border-crimson/30 focus-visible:ring-crimson"
            required
          />
        </div>
        <div className="space-y-1.5">
          <Label htmlFor="login-key" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            SKID Key
          </Label>
          <Input
            id="login-key"
            value={secret}
            onChange={(e) => setSecret(e.target.value.toUpperCase())}
            placeholder="SKID-XXXX-XXXX-XXXX"
            autoComplete="current-password"
            className="font-mono tracking-wider bg-background/40 border-crimson/30 focus-visible:ring-crimson"
            required
          />
        </div>
        <Button type="submit" variant="hero" size="lg" className="w-full" disabled={loading}>
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Authenticate"}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        No account yet?{" "}
        <button onClick={onSwap} className="text-crimson-glow hover:underline font-medium">
          Provision a new key
        </button>
      </p>
    </>
  );
}

function SignupPanel({
  onSwap,
  onIssued,
}: {
  onSwap: () => void;
  onIssued: (d: { handle: string; secret_id: string }) => void;
}) {
  const [handle, setHandle] = useState("");
  const [agreed, setAgreed] = useState(false);
  const [captcha, setCaptcha] = useState(false);
  const [loading, setLoading] = useState(false);
  const { setSession } = useAuth();
  const signup = useServerFn(signupAccount);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    if (!agreed || !captcha) {
      toast.error("Confirm consent and the bot check first");
      return;
    }
    setLoading(true);
    try {
      const res = await signup({ data: { handle, agreed: true as const, captcha: true as const } });
      setSession(res);
      onIssued(res);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Signup failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      <Header icon={UserPlus} title="Provision Account" subtitle="Generate your SKID identity" />
      <form onSubmit={submit} className="space-y-4">
        <div className="space-y-1.5">
          <Label htmlFor="signup-handle" className="font-mono text-xs uppercase tracking-widest text-muted-foreground">
            Handle
          </Label>
          <Input
            id="signup-handle"
            value={handle}
            onChange={(e) => setHandle(e.target.value)}
            placeholder="ghost_runner"
            autoComplete="username"
            className="font-mono bg-background/40 border-crimson/30 focus-visible:ring-crimson"
            required
            minLength={3}
            maxLength={20}
          />
          <p className="text-[11px] text-muted-foreground font-mono">3–20 chars · letters, digits, underscore</p>
        </div>

        <div className="rounded-md border border-crimson/20 bg-background/30 p-3 space-y-3">
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={agreed} onCheckedChange={(v) => setAgreed(v === true)} className="mt-0.5" />
            <span className="text-xs text-muted-foreground leading-relaxed">
              I agree to the <span className="text-foreground/90">Terms of Service</span>,{" "}
              <span className="text-foreground/90">Privacy Policy</span>, and EULA.
            </span>
          </label>
          <label className="flex items-start gap-3 cursor-pointer">
            <Checkbox checked={captcha} onCheckedChange={(v) => setCaptcha(v === true)} className="mt-0.5" />
            <span className="text-xs text-muted-foreground leading-relaxed flex items-center gap-2">
              <ShieldCheck className="h-3.5 w-3.5 text-crimson-glow" />
              Confirm I'm not a robot
            </span>
          </label>
        </div>

        <Button
          type="submit"
          variant="hero"
          size="lg"
          className="w-full"
          disabled={loading || !agreed || !captcha}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : "Create Account"}
        </Button>
      </form>
      <p className="mt-5 text-center text-xs text-muted-foreground">
        Already provisioned?{" "}
        <button onClick={onSwap} className="text-crimson-glow hover:underline font-medium">
          Sign in
        </button>
      </p>
    </>
  );
}

function SuccessPanel({ data, onClose }: { data: { handle: string; secret_id: string }; onClose: () => void }) {
  const [copied, setCopied] = useState(false);
  function copy() {
    navigator.clipboard.writeText(data.secret_id);
    setCopied(true);
    toast.success("SKID key copied");
    setTimeout(() => setCopied(false), 1800);
  }
  return (
    <div className="animate-fade-up">
      <Header icon={ShieldCheck} title="Identity Provisioned" subtitle="Store this key — it is your password" />
      <div className="space-y-4">
        <div className="rounded-md border border-crimson/30 bg-background/40 p-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-muted-foreground mb-1">Handle</div>
          <div className="font-display text-lg">{data.handle}</div>
        </div>
        <div className="rounded-md border-glow-strong border border-crimson/50 bg-crimson/5 p-4">
          <div className="text-[11px] font-mono uppercase tracking-widest text-crimson-glow mb-2">Your SKID Key</div>
          <div className="flex items-center justify-between gap-3">
            <code className="font-mono text-lg tracking-wider text-glow text-crimson-glow break-all">
              {data.secret_id}
            </code>
            <Button type="button" size="icon" variant="ghost" onClick={copy} className="shrink-0 hover:bg-crimson/20">
              {copied ? <Check className="h-4 w-4 text-crimson-glow" /> : <Copy className="h-4 w-4" />}
            </Button>
          </div>
        </div>
        <div className="rounded-md border border-amber-500/30 bg-amber-500/5 p-3 text-xs text-amber-200/80">
          ⚠ This key is shown <strong>once</strong>. Store it somewhere safe — it cannot be recovered.
        </div>
        <Button onClick={onClose} variant="hero" size="lg" className="w-full">
          Enter SkidSint
        </Button>
      </div>
    </div>
  );
}
