import { useMemo, useState } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";

/**
 * Renders an OSINT response as paginated, human-readable record cards.
 *
 * Strips wrapper metadata that the user doesn't care about (plan_type,
 * is_authenticated, service, lookups, quota, etc.) and surfaces only the
 * actual hits. Falls back to a JSON view for shapes we can't normalize.
 */

const NOISE_KEYS = new Set([
  // OATH.NET envelope
  "plan_type", "is_plan_active", "is_authenticated", "service", "lookups",
  "used_today", "left_today", "daily_limit", "is_unlimited",
  "service_id", "category", "credits", "credit", "credits_left",
  // LeakCheck envelope
  "success", "quota", "found",
  // TgScan envelope
  "status",
  // generic
  "code", "message", "error",
]);

type Rec = Record<string, unknown>;

/** Walk an arbitrary upstream payload and pull out the first array of record-like objects. */
function extractRecords(raw: unknown): { records: Rec[]; total: number } {
  if (raw == null) return { records: [], total: 0 };
  if (Array.isArray(raw)) {
    const recs = raw.filter((r) => r && typeof r === "object" && !Array.isArray(r)) as Rec[];
    return { records: recs, total: recs.length };
  }
  if (typeof raw !== "object") return { records: [], total: 0 };
  const obj = raw as Rec;

  // Preferred keys, in order of likelihood
  const candidates = ["data", "result", "results", "items", "hits", "entries", "records", "list", "matches"];
  for (const k of candidates) {
    const v = obj[k];
    if (Array.isArray(v)) {
      const recs = v.filter((r) => r && typeof r === "object" && !Array.isArray(r)) as Rec[];
      if (recs.length) return { records: recs, total: recs.length };
    }
  }
  // OATH.NET sometimes returns { result: { data: [...] } } — recurse one level into objects
  for (const k of Object.keys(obj)) {
    if (NOISE_KEYS.has(k)) continue;
    const v = obj[k];
    if (v && typeof v === "object" && !Array.isArray(v)) {
      const inner = extractRecords(v);
      if (inner.records.length) return inner;
    }
  }
  // Last resort: present the object itself as a single record (minus noise keys)
  const cleaned: Rec = {};
  for (const [k, v] of Object.entries(obj)) {
    if (NOISE_KEYS.has(k)) continue;
    cleaned[k] = v;
  }
  return Object.keys(cleaned).length ? { records: [cleaned], total: 1 } : { records: [], total: 0 };
}

function cleanRecord(rec: Rec): [string, unknown][] {
  return Object.entries(rec)
    .filter(([k, v]) => !NOISE_KEYS.has(k) && v !== null && v !== "" && v !== undefined)
    .map(([k, v]) => [k, v] as [string, unknown]);
}

function fmtValue(v: unknown): string {
  if (v == null) return "—";
  if (typeof v === "string") return v;
  if (typeof v === "number" || typeof v === "boolean") return String(v);
  try { return JSON.stringify(v); } catch { return String(v); }
}

function recordTitle(rec: Rec): string {
  for (const k of ["username", "user", "email", "handle", "name", "domain", "ip", "id"]) {
    const v = rec[k];
    if (typeof v === "string" && v.trim()) return v;
  }
  return "Record";
}

const PAGE_SIZE = 10;

export function ResultViewer({ rawJson, source }: { rawJson: string; source?: string }) {
  const [page, setPage] = useState(0);

  const { records } = useMemo(() => {
    let parsed: unknown = null;
    try { parsed = JSON.parse(rawJson); } catch { /* keep null */ }
    const { records } = extractRecords(parsed);
    return { records };
  }, [rawJson]);

  const total = records.length;
  const pages = Math.max(1, Math.ceil(total / PAGE_SIZE));
  const pageRecs = records.slice(page * PAGE_SIZE, (page + 1) * PAGE_SIZE);

  return (
    <div className="mt-2 space-y-2">
      <div className="text-[11px] font-mono text-muted-foreground">
        {total > 0
          ? <>Showing <span className="text-crimson-glow">{total}</span> result{total === 1 ? "" : "s"}{source ? <> from <span className="text-foreground">{source}</span></> : null}{pages > 1 && <> · Page {page + 1} of {pages}</>}</>
          : <>No results found.</>}
      </div>

      {total === 0 ? (
        <div className="rounded-md border border-crimson/15 bg-background/60 p-4 text-center text-xs font-mono text-muted-foreground">
          The upstream returned no matching records.
        </div>
      ) : (
        <>
          <div className="space-y-2 max-h-[28rem] overflow-y-auto pr-1">
            {pageRecs.map((rec, i) => {
              const fields = cleanRecord(rec);
              return (
                <div key={i} className="rounded-lg border border-crimson/20 bg-background/60 p-3">
                  <div className="font-display text-sm font-semibold text-foreground mb-1.5">
                    {recordTitle(rec)}
                  </div>
                  <ul className="space-y-1">
                    {fields.map(([k, v]) => (
                      <li key={k} className="font-mono text-[11px] leading-snug">
                        <span className="text-crimson-glow/90">{k}:</span>{" "}
                        <span className="text-foreground/90 break-all">{fmtValue(v)}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              );
            })}
          </div>
          {pages > 1 && (
            <div className="flex items-center justify-between gap-2 pt-1">
              <Button size="sm" variant="outlineGlow" disabled={page === 0} onClick={() => setPage((p) => Math.max(0, p - 1))}>
                <ChevronLeft className="h-3.5 w-3.5" /> Prev
              </Button>
              <div className="text-[11px] font-mono text-muted-foreground">
                Page {page + 1} / {pages}
              </div>
              <Button size="sm" variant="outlineGlow" disabled={page >= pages - 1} onClick={() => setPage((p) => Math.min(pages - 1, p + 1))}>
                Next <ChevronRight className="h-3.5 w-3.5" />
              </Button>
            </div>
          )}
        </>
      )}
    </div>
  );
}