// SkidGraph (visual identity graph) — client-only, account-scoped storage helpers.
// The active account id is part of every key so one browser login cannot see
// another account's graphs.

import { CATALOG_BY_SLUG } from "./skidgraph-catalog";

const STORAGE_PREFIX = "skidsint.skidgraph.graph.v2.";
const INDEX_PREFIX = "skidsint.skidgraph.index.v2.";

export type GraphIndexEntry = {
  id: string;
  name: string;
  createdAt: string;
  source: "scratch" | "case";
  ownerId: string;
  caseId?: string;
};

type SeedNode = {
  id: string;
  slug: string;
  label: string;
  link?: string;
  x: number;
  y: number;
  z: number;
};
type SeedEdge = { id: string; a: string; b: string };
type SeedGraph = { nodes: SeedNode[]; edges: SeedEdge[] };

export function graphStorageKey(ownerId: string, graphId: string) {
  return `${STORAGE_PREFIX}${ownerId}.${graphId}`;
}

function indexKey(ownerId: string) {
  return `${INDEX_PREFIX}${ownerId}`;
}

function uid() {
  return Math.random().toString(36).slice(2, 10);
}

export function listGraphs(ownerId: string): GraphIndexEntry[] {
  if (typeof window === "undefined") return [];
  try {
    const raw = localStorage.getItem(indexKey(ownerId));
    if (!raw) return [];
    return (JSON.parse(raw) as GraphIndexEntry[]).filter((g) => g.ownerId === ownerId);
  } catch {
    return [];
  }
}

export function saveIndex(ownerId: string, list: GraphIndexEntry[]) {
  if (typeof window === "undefined") return;
  localStorage.setItem(indexKey(ownerId), JSON.stringify(list.filter((g) => g.ownerId === ownerId)));
}

export function addToIndex(ownerId: string, entry: GraphIndexEntry) {
  const list = listGraphs(ownerId).filter((g) => g.id !== entry.id);
  list.unshift(entry);
  saveIndex(ownerId, list);
}

export function removeGraph(ownerId: string, id: string) {
  if (typeof window === "undefined") return;
  saveIndex(ownerId, listGraphs(ownerId).filter((g) => g.id !== id));
  localStorage.removeItem(graphStorageKey(ownerId, id));
}

export function writeGraph(ownerId: string, id: string, graph: SeedGraph) {
  if (typeof window === "undefined") return;
  localStorage.setItem(graphStorageKey(ownerId, id), JSON.stringify(graph));
}

// Map module category → catalog node slug (best-effort heuristic).
const CATEGORY_TO_SLUG: Record<string, string> = {
  Breach: "email",
  Discord: "discord",
  Social: "username",
  IP: "ip",
  Identity: "email",
};

const FIELD_TO_SLUG: Array<[RegExp, string]> = [
  [/\b(alias|aka|username|user|handle)\b/i, "alias"],
  [/\b(snapchat|snap)\b/i, "snapchat"],
  [/\b(telegram|tg)\b/i, "telegram"],
  [/\b(discord)\b/i, "discord"],
  [/\b(ip|ipv4|ipv6)\b/i, "ip"],
  [/\b(email|e-mail|mail)\b/i, "email"],
  [/\b(phone|mobile|cell)\b/i, "phone"],
  [/\b(instagram|ig)\b/i, "instagram"],
  [/\b(tiktok)\b/i, "tiktok"],
  [/\b(x|twitter)\b/i, "x"],
  [/\b(youtube|yt)\b/i, "youtube"],
  [/\b(reddit)\b/i, "reddit"],
  [/\b(domain|host)\b/i, "domain"],
  [/\b(url|link)\b/i, "url"],
  [/\b(wallet|crypto|btc|bitcoin|eth|ethereum)\b/i, "wallet"],
];

function slugForText(label: string, fallback = "username") {
  const direct = CATALOG_BY_SLUG[label.trim().toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "")];
  if (direct) return direct.slug;
  return FIELD_TO_SLUG.find(([rx]) => rx.test(label))?.[1] ?? fallback;
}

function extractNoteNodes(notes: string): Array<{ slug: string; label: string; link?: string }> {
  const out: Array<{ slug: string; label: string; link?: string }> = [];
  for (const raw of notes.split(/\r?\n/)) {
    const line = raw.trim();
    if (!line) continue;
    const match = line.match(/^(.{1,48}?)(?:\s*[-:—=]\s+|\s+-\s+)(.{1,180})$/);
    if (!match) continue;
    const [, key, value] = match;
    const clean = value.trim();
    if (!clean) continue;
    out.push({ slug: slugForText(key), label: clean, link: /^https?:\/\//i.test(clean) ? clean : undefined });
  }
  return out;
}

function extractFindingNodes(
  findings: Array<{ module_slug?: string; module_name: string; module_category: string; query: string; result_json?: string }>,
): Array<{ slug: string; label: string; link?: string }> {
  const out: Array<{ slug: string; label: string; link?: string }> = [];
  for (const f of findings) {
    const slug = f.module_slug ? slugForText(f.module_slug, CATEGORY_TO_SLUG[f.module_category] ?? "username") : CATEGORY_TO_SLUG[f.module_category] ?? "username";
    if (f.query) out.push({ slug, label: f.query });
    if (!f.result_json) continue;
    try {
      const parsed = JSON.parse(f.result_json) as unknown;
      for (const value of collectStrings(parsed).slice(0, 18)) {
        const foundSlug = guessSlugForValue(value, slug);
        out.push({ slug: foundSlug, label: value, link: /^https?:\/\//i.test(value) ? value : undefined });
      }
    } catch {
      // Keep the explicit query even when provider JSON is malformed.
    }
  }
  return out;
}

function collectStrings(value: unknown, depth = 0): string[] {
  if (depth > 3) return [];
  if (typeof value === "string") {
    const clean = value.trim();
    return clean.length >= 3 && clean.length <= 180 ? [clean] : [];
  }
  if (Array.isArray(value)) return value.flatMap((item) => collectStrings(item, depth + 1));
  if (value && typeof value === "object") return Object.values(value).flatMap((item) => collectStrings(item, depth + 1));
  return [];
}

function guessSlugForValue(value: string, fallback: string) {
  if (/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value)) return "email";
  if (/^(?:\d{1,3}\.){3}\d{1,3}$/.test(value)) return "ip";
  if (/^https?:\/\//i.test(value)) return "url";
  if (/discord/i.test(value)) return "discord";
  if (/telegram|t\.me/i.test(value)) return "telegram";
  if (/snapchat/i.test(value)) return "snapchat";
  return fallback;
}

export function createBlankGraph(ownerId: string, name: string): string {
  const id = uid();
  writeGraph(ownerId, id, { nodes: [], edges: [] });
  addToIndex(ownerId, { id, name, ownerId, createdAt: new Date().toISOString(), source: "scratch" });
  return id;
}

export function seedGraphFromCase(
  ownerId: string,
  c: { id: string; name: string; notes?: string },
  findings: Array<{ id: string; module_slug?: string; module_name: string; module_category: string; query: string; result_json?: string }>,
): string {
  const id = uid();
  const centerId = uid();
  const nodes: SeedNode[] = [
    { id: centerId, slug: "person", label: c.name, x: 0, y: 0, z: 0 },
  ];
  const edges: SeedEdge[] = [];

  const extracted = [...extractNoteNodes(c.notes ?? ""), ...extractFindingNodes(findings)];
  const unique = extracted.filter((item, index, arr) =>
    arr.findIndex((other) => other.slug === item.slug && other.label.toLowerCase() === item.label.toLowerCase()) === index,
  );

  const n = Math.max(unique.length, 1);
  const radius = 220;
  unique.forEach((item, i) => {
    const angle = (i / n) * Math.PI * 2;
    const nodeId = uid();
    nodes.push({
      id: nodeId,
      slug: item.slug,
      label: item.label,
      link: item.link,
      x: Math.cos(angle) * radius,
      y: Math.sin(angle) * radius,
      z: Math.sin(angle * 1.7) * 70,
    });
    edges.push({ id: uid(), a: centerId, b: nodeId });
  });

  writeGraph(ownerId, id, { nodes, edges });
  addToIndex(ownerId, {
    id,
    name: `${c.name} — graph`,
    ownerId,
    createdAt: new Date().toISOString(),
    source: "case",
    caseId: c.id,
  });
  return id;
}
