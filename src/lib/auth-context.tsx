import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { verifySession, type AuthProfile } from "./auth.functions";

type Session = AuthProfile | null;

interface AuthCtx {
  session: Session;
  ready: boolean;
  setSession: (s: Session) => void;
  logout: () => void;
}

const Ctx = createContext<AuthCtx | null>(null);
const STORAGE_KEY = "skidsint.session.v2";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSessionState] = useState<Session>(null);
  const [ready, setReady] = useState(false);

  useEffect(() => {
    let cancelled = false;
    try {
      const raw = localStorage.getItem(STORAGE_KEY);
      if (!raw) { setReady(true); return; }
      const parsed = JSON.parse(raw) as Session;
      if (!parsed?.handle || !parsed?.secret_id) { setReady(true); return; }
      verifySession({ data: { handle: parsed.handle, secret_id: parsed.secret_id } })
        .then((res) => {
          if (cancelled) return;
          if (res.valid && res.profile) {
            setSessionState(res.profile as AuthProfile);
            localStorage.setItem(STORAGE_KEY, JSON.stringify(res.profile));
          } else {
            localStorage.removeItem(STORAGE_KEY);
          }
        })
        .catch(() => { if (!cancelled) setSessionState(parsed); })
        .finally(() => !cancelled && setReady(true));
    } catch {
      setReady(true);
    }
    return () => { cancelled = true; };
  }, []);

  const setSession = useCallback((s: Session) => {
    setSessionState(s);
    if (s) localStorage.setItem(STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(STORAGE_KEY);
  }, []);

  const logout = useCallback(() => setSession(null), [setSession]);

  const value = useMemo(() => ({ session, ready, setSession, logout }), [session, ready, setSession, logout]);
  return <Ctx.Provider value={value}>{children}</Ctx.Provider>;
}

export function useAuth() {
  const ctx = useContext(Ctx);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
