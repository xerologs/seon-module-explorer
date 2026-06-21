import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useServerFn } from "@tanstack/react-start";
import { Shield, Loader2, Check, AlertTriangle, Eye, EyeOff, Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { adminListUsers, adminUpdateUser, adminDeleteUser } from "@/lib/dashboard.functions";
import { TIER_ORDER, type Role, type Tier } from "@/lib/plans";

interface Props {
  session: { handle: string; secret_id: string; role: Role };
}

type AdminUser = {
  id: string; handle: string; secret_id: string; tier: Tier; role: Role;
  total_lookups: number; daily_usage: number; one_time_credits: number;
};

export function AdminPanel({ session }: Props) {
  const listFn = useServerFn(adminListUsers);
  const updateFn = useServerFn(adminUpdateUser);
  const deleteFn = useServerFn(adminDeleteUser);
  const qc = useQueryClient();
  const isAdmin = session.role === "admin" || session.role === "master_admin";
  const canEdit = isAdmin;
  const canEditRoles = session.role === "master_admin";

  const q = useQuery({
    queryKey: ["admin-users"],
    queryFn: () => listFn({ data: { handle: session.handle, secret_id: session.secret_id } }),
    refetchInterval: 15_000,
  });

  const update = useMutation({
    mutationFn: (vars: { target_id: string; tier?: Tier; add_credits?: number; role?: Role }) =>
      updateFn({ data: { handle: session.handle, secret_id: session.secret_id, ...vars } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  const del = useMutation({
    mutationFn: (target_id: string) =>
      deleteFn({ data: { handle: session.handle, secret_id: session.secret_id, target_id } }),
    onSuccess: () => qc.invalidateQueries({ queryKey: ["admin-users"] }),
  });

  return (
    <div className="rounded-xl border border-crimson/25 bg-card/50 backdrop-blur-xl p-5 sm:p-6" style={{ animation: "fade-up 0.7s both" }}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2 text-[11px] font-mono uppercase tracking-widest text-crimson-glow">
          <Shield className="h-3.5 w-3.5" /> Administration · {session.role}
        </div>
        {q.isFetching && <Loader2 className="h-3.5 w-3.5 animate-spin text-muted-foreground" />}
      </div>

      {q.isError && (
        <div className="text-sm text-amber-300 font-mono">// {(q.error as Error).message}</div>
      )}

      <div className="overflow-x-auto -mx-2">
        <table className="w-full text-sm min-w-[700px]">
          <thead>
            <tr className="text-left text-[10px] uppercase tracking-widest text-muted-foreground border-b border-crimson/15">
              <th className="p-3">Operator</th>
              <th className="p-3">Plan</th>
              <th className="p-3">24h usage</th>
              <th className="p-3">Credits</th>
              <th className="p-3">Lookups</th>
              <th className="p-3">Role</th>
              {canEdit && <th className="p-3">Actions</th>}
            </tr>
          </thead>
          <tbody>
            {(q.data ?? []).map((u: AdminUser) => (
              <UserRow
                key={u.id}
                u={u}
                canEdit={canEdit && u.role !== "master_admin"}
                canEditRoles={canEditRoles && u.role !== "master_admin"}
                canDelete={canEdit && u.role !== "master_admin" && u.handle.toLowerCase() !== session.handle.toLowerCase()}
                onSave={(vars) => update.mutate({ target_id: u.id, ...vars })}
                saving={update.isPending}
                onDelete={() => {
                  if (confirm(`Delete @${u.handle}? This permanently wipes their account, cases, chats, and credits.`)) {
                    del.mutate(u.id);
                  }
                }}
                deleting={del.isPending}
              />
            ))}
            {q.isLoading && (
              <tr><td colSpan={7} className="p-6 text-center text-muted-foreground font-mono text-xs">// loading users…</td></tr>
            )}
          </tbody>
        </table>
      </div>

      {update.isError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 font-mono">
          <AlertTriangle className="h-3.5 w-3.5" /> {(update.error as Error).message}
        </div>
      )}
      {del.isError && (
        <div className="mt-3 flex items-center gap-2 text-xs text-amber-300 font-mono">
          <AlertTriangle className="h-3.5 w-3.5" /> {(del.error as Error).message}
        </div>
      )}
      {update.isSuccess && !update.isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300 font-mono">
          <Check className="h-3.5 w-3.5" /> updated
        </div>
      )}
      {del.isSuccess && !del.isPending && (
        <div className="mt-3 flex items-center gap-2 text-xs text-emerald-300 font-mono">
          <Check className="h-3.5 w-3.5" /> account deleted
        </div>
      )}
    </div>
  );
}

function UserRow({
  u, canEdit, canEditRoles, canDelete, onSave, saving, onDelete, deleting,
}: {
  u: AdminUser;
  canEdit: boolean;
  canEditRoles: boolean;
  canDelete: boolean;
  onSave: (v: { tier?: Tier; add_credits?: number; role?: Role }) => void;
  saving: boolean;
  onDelete: () => void;
  deleting: boolean;
}) {
  const [tier, setTier] = useState<Tier>(u.tier);
  const [role, setRole] = useState<Role>(u.role);
  const [credits, setCredits] = useState("");
  const [reveal, setReveal] = useState(false);
  const dirty = tier !== u.tier || role !== u.role || !!credits;
  return (
    <tr className="border-b border-crimson/10 last:border-0 hover:bg-crimson/5">
      <td className="p-3 font-mono align-top">
        <div className="flex items-center gap-1">
          <span className="text-crimson-glow">@</span>{u.handle}
        </div>
        <button
          onClick={() => setReveal((v) => !v)}
          title={reveal ? "Click to hide" : "Click to reveal SKID id"}
          className={`mt-1 inline-flex items-center gap-1 text-[10px] font-mono px-1.5 py-0.5 rounded border border-crimson/20 bg-background/60 transition-all max-w-[180px] truncate
            ${reveal ? "text-foreground/90 hover:border-crimson/50" : "text-muted-foreground hover:border-crimson/40"}`}
        >
          {reveal ? <EyeOff className="h-3 w-3 shrink-0" /> : <Eye className="h-3 w-3 shrink-0" />}
          <span className={reveal ? "" : "blur-sm select-none"}>
            {u.secret_id.slice(0, 18)}{u.secret_id.length > 18 ? "…" : ""}
          </span>
        </button>
      </td>
      <td className="p-3">{u.tier}</td>
      <td className="p-3 font-mono text-xs">{u.daily_usage}</td>
      <td className="p-3 font-mono text-xs">{u.one_time_credits}</td>
      <td className="p-3 font-mono text-xs">{u.total_lookups.toLocaleString()}</td>
      <td className="p-3 text-xs">
        <span className={`font-mono ${u.role === "master_admin" ? "text-amber-300" : u.role === "admin" ? "text-crimson-glow" : u.role === "support" ? "text-sky-300" : "text-muted-foreground"}`}>
          {u.role}
        </span>
      </td>
      {(canEdit || canDelete) && (
        <td className="p-3">
          <div className="flex flex-wrap items-center gap-2">
            {canEdit && <>
              <select
              value={tier}
              onChange={(e) => setTier(e.target.value as Tier)}
              className="rounded-md border border-crimson/25 bg-background/60 px-2 py-1 text-xs font-mono"
            >
              {TIER_ORDER.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            {canEditRoles && (
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="rounded-md border border-crimson/25 bg-background/60 px-2 py-1 text-xs font-mono"
                title="Role"
              >
                <option value="user">user</option>
                <option value="support">support</option>
                <option value="admin">admin</option>
              </select>
            )}
            <input
              type="number"
              min={0}
              value={credits}
              onChange={(e) => setCredits(e.target.value)}
              placeholder="+credits"
              className="w-24 rounded-md border border-crimson/25 bg-background/60 px-2 py-1 text-xs font-mono"
            />
            <Button
              size="sm"
              variant="hero"
              disabled={saving || !dirty}
              onClick={() => {
                onSave({
                  tier: tier !== u.tier ? tier : undefined,
                  role: role !== u.role ? role : undefined,
                  add_credits: credits ? Number(credits) : undefined,
                });
                setCredits("");
              }}
            >
              Save
            </Button>
            </>}
            {canDelete && (
              <Button
                size="sm"
                variant="outline"
                disabled={deleting}
                onClick={onDelete}
                className="text-rose-300 hover:bg-rose-500/10 border-rose-500/30"
                title="Delete account"
              >
                <Trash2 className="h-3.5 w-3.5" />
              </Button>
            )}
          </div>
        </td>
      )}
    </tr>
  );
}
