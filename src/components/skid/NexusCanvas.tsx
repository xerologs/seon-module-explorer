import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  Boxes, Circle, Layers3, Link2, MousePointer2, Plus, Save, Search, Trash2, X,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  CATALOG, CATALOG_BY_SLUG, FALLBACK_KIND, logoUrl, type NodeKind,
} from "@/lib/skidgraph-catalog";
import { graphStorageKey } from "@/lib/skidgraph";

type GraphNode = {
  id: string;
  slug: string;
  label: string;
  link?: string;
  x: number;          // world coords
  y: number;
  z: number;          // 0 by default; used in 3D mode
};
type GraphEdge = { id: string; a: string; b: string };
type GraphState = { nodes: GraphNode[]; edges: GraphEdge[] };

type Mode = "cards" | "logos" | "three";

function uid() { return Math.random().toString(36).slice(2, 10); }

export function NexusCanvas({ id, ownerId, name }: { id: string; ownerId: string; name?: string }) {
  const storageKey = graphStorageKey(ownerId, id);
  const [graph, setGraph] = useState<GraphState>({ nodes: [], edges: [] });
  const [loadedKey, setLoadedKey] = useState<string | null>(null);
  const [mode, setMode] = useState<Mode>("cards");
  const [tool, setTool] = useState<"select" | "connect">("select");
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [rotate, setRotate] = useState({ x: 18, y: -22 }); // 3D camera
  const [search, setSearch] = useState("");
  const [customName, setCustomName] = useState("");
  const [hoverNode, setHoverNode] = useState<string | null>(null);
  const [selectedNode, setSelectedNode] = useState<string | null>(null);
  const [connectFrom, setConnectFrom] = useState<string | null>(null);
  const [editing, setEditing] = useState<GraphNode | null>(null);
  const [paletteDrag, setPaletteDrag] = useState<{ slug: string; x: number; y: number } | null>(null);
  const [paletteHover, setPaletteHover] = useState<{ slug: string; top: number } | null>(null);
  const surfaceRef = useRef<HTMLDivElement>(null);

  // load / save
  useEffect(() => {
    setLoadedKey(null);
    try {
      const raw = localStorage.getItem(storageKey);
      setGraph(raw ? (JSON.parse(raw) as GraphState) : { nodes: [], edges: [] });
    } catch { /* noop */ }
    setLoadedKey(storageKey);
  }, [storageKey]);
  useEffect(() => {
    if (loadedKey !== storageKey) return;
    try { localStorage.setItem(storageKey, JSON.stringify(graph)); } catch { /* noop */ }
  }, [graph, loadedKey, storageKey]);

  // Always open inspector for the currently selected node so users can
  // re-edit a node simply by clicking it again.
  useEffect(() => {
    if (!selectedNode) return;
    const n = graph.nodes.find((x) => x.id === selectedNode);
    if (n) setEditing((curr) => (curr?.id === n.id ? curr : n));
  }, [selectedNode, graph.nodes]);

  // ── creation: drag from palette ───────────────────────────────────────────
  const addNodeAt = useCallback((slug: string, worldX: number, worldY: number) => {
    const kind = CATALOG_BY_SLUG[slug];
    if (!kind) return;
    const node: GraphNode = {
      id: uid(), slug,
      label: kind.label,
      x: worldX, y: worldY,
      z: mode === "three" ? 60 : 0,
    };
    setGraph((g) => ({ ...g, nodes: [...g.nodes, node] }));
    setSelectedNode(node.id);
    setEditing(node);
  }, [mode]);

  const addNodeFromClientPoint = useCallback((slug: string, clientX: number, clientY: number) => {
    const rect = surfaceRef.current?.getBoundingClientRect();
    if (!rect || clientX < rect.left || clientX > rect.right || clientY < rect.top || clientY > rect.bottom) return false;
    const cx = (clientX - rect.left - rect.width / 2 - pan.x) / zoom;
    const cy = (clientY - rect.top - rect.height / 2 - pan.y) / zoom;
    addNodeAt(slug, cx, cy);
    return true;
  }, [addNodeAt, pan.x, pan.y, zoom]);

  const onPalettePointerDown = (e: React.PointerEvent, slug: string) => {
    if (e.button !== 0 || !CATALOG_BY_SLUG[slug]) return;
    e.preventDefault();
    e.stopPropagation();
    const startX = e.clientX;
    const startY = e.clientY;
    let moved = false;
    const move = (ev: PointerEvent) => {
      ev.preventDefault();
      if (!moved && (Math.abs(ev.clientX - startX) > 4 || Math.abs(ev.clientY - startY) > 4)) moved = true;
      setPaletteDrag({ slug, x: ev.clientX, y: ev.clientY });
    };
    const up = (ev: PointerEvent) => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      setPaletteDrag(null);
      if (moved) addNodeFromClientPoint(slug, ev.clientX, ev.clientY);
      else addNodeAt(slug, -pan.x / zoom, -pan.y / zoom);
    };
    setPaletteDrag({ slug, x: startX, y: startY });
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };

  // Click-to-add fallback: tap a palette tile to drop it at canvas center.
  const onPaletteClick = (slug: string) => {
    addNodeAt(slug, -pan.x / zoom, -pan.y / zoom);
  };

  const createCustomNode = () => {
    const label = customName.trim() || "Custom node";
    const node: GraphNode = { id: uid(), slug: "custom", label, x: -pan.x / zoom, y: -pan.y / zoom, z: mode === "three" ? 90 : 0 };
    setGraph((g) => ({ ...g, nodes: [...g.nodes, node] }));
    setSelectedNode(node.id);
    setEditing(node);
    setCustomName("");
  };

  // ── node dragging (inside surface) ────────────────────────────────────────
  // Use window listeners — this avoids pointer-capture quirks (img/svg
  // targets, react re-renders mid-drag) and keeps the surface's own pan/orbit
  // handlers fully separate.
  const zoomRef = useRef(zoom);
  useEffect(() => { zoomRef.current = zoom; }, [zoom]);
  const graphRef = useRef(graph);
  useEffect(() => { graphRef.current = graph; }, [graph]);
  const onNodePointerDown = (e: React.PointerEvent, n: GraphNode) => {
    e.stopPropagation();
    e.preventDefault();
    if (tool === "connect") {
      if (!connectFrom) { setConnectFrom(n.id); return; }
      if (connectFrom !== n.id) {
        setGraph((g) => ({
          ...g,
          edges: g.edges.some((ed) =>
            (ed.a === connectFrom && ed.b === n.id) || (ed.a === n.id && ed.b === connectFrom),
          ) ? g.edges : [...g.edges, { id: uid(), a: connectFrom!, b: n.id }],
        }));
      }
      setConnectFrom(null);
      return;
    }
    const startX = e.clientX;
    const startY = e.clientY;
    const startNode = graphRef.current.nodes.find((m) => m.id === n.id) ?? n;
    let moved = false;
    const move = (ev: PointerEvent) => {
      ev.preventDefault();
      const z = zoomRef.current || 1;
      if (!moved && (Math.abs(ev.clientX - startX) > 2 || Math.abs(ev.clientY - startY) > 2)) moved = true;
      const nextX = startNode.x + (ev.clientX - startX) / z;
      const nextY = startNode.y + (ev.clientY - startY) / z;
      setGraph((g) => ({
        ...g,
        nodes: g.nodes.map((m) => m.id === n.id ? { ...m, x: nextX, y: nextY } : m),
      }));
    };
    const up = () => {
      window.removeEventListener("pointermove", move);
      window.removeEventListener("pointerup", up);
      window.removeEventListener("pointercancel", up);
      if (!moved) {
        setSelectedNode(n.id);
        setEditing(n);
      }
    };
    window.addEventListener("pointermove", move, { passive: false });
    window.addEventListener("pointerup", up);
    window.addEventListener("pointercancel", up);
  };


  // ── surface pan / zoom / 3D-rotate ────────────────────────────────────────
  const panRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const rotRef = useRef<{ x: number; y: number; px: number; py: number } | null>(null);
  const onSurfacePointerDown = (e: React.PointerEvent) => {
    // 3D: drag anywhere on the canvas to orbit. Hold alt / middle / right
    // mouse to pan instead. Outside 3D, primary drag pans.
    if (mode === "three" && !e.altKey && e.button !== 1 && e.button !== 2) {
      rotRef.current = { x: rotate.x, y: rotate.y, px: e.clientX, py: e.clientY };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setSelectedNode(null);
      return;
    }
    if (e.button === 1 || e.button === 2 || e.altKey) {
      panRef.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
    } else {
      // primary click on empty surface: pan
      panRef.current = { x: pan.x, y: pan.y, px: e.clientX, py: e.clientY };
      (e.currentTarget as Element).setPointerCapture(e.pointerId);
      setSelectedNode(null);
    }
  };
  const onSurfacePointerMove = (e: React.PointerEvent) => {
    if (rotRef.current) {
      setRotate({
        x: Math.max(-85, Math.min(85, rotRef.current.x - (e.clientY - rotRef.current.py) * 0.3)),
        y: rotRef.current.y + (e.clientX - rotRef.current.px) * 0.3,
      });
      return;
    }
    if (panRef.current) {
      setPan({ x: panRef.current.x + (e.clientX - panRef.current.px), y: panRef.current.y + (e.clientY - panRef.current.py) });
    }
  };
  const onSurfacePointerUp = () => { panRef.current = null; rotRef.current = null; };
  const onSurfaceWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const next = Math.min(2.4, Math.max(0.3, zoom * (e.deltaY > 0 ? 0.9 : 1.1)));
    setZoom(next);
  };

  const deleteNode = (id: string) => {
    setGraph((g) => ({
      nodes: g.nodes.filter((n) => n.id !== id),
      edges: g.edges.filter((e) => e.a !== id && e.b !== id),
    }));
    setSelectedNode(null); setEditing(null);
  };

  const filteredPalette = useMemo(() => {
    const q = search.trim().toLowerCase();
    return CATALOG.filter((c) =>
      !q || c.label.toLowerCase().includes(q) || c.slug.includes(q) || c.group.toLowerCase().includes(q),
    );
  }, [search]);

  const grouped = useMemo(() => {
    const g: Record<string, NodeKind[]> = {};
    for (const k of filteredPalette) (g[k.group] ||= []).push(k);
    return g;
  }, [filteredPalette]);

  // ──────────────────────────────────────────────────────────────────────────
  // Render helpers
  // ──────────────────────────────────────────────────────────────────────────
  const transform3d = mode === "three"
    ? `perspective(1400px) rotateX(${rotate.x}deg) rotateY(${rotate.y}deg)`
    : "";

  const nodeById = (id: string) => graph.nodes.find((n) => n.id === id);
  const hoveredPaletteKind = paletteHover ? CATALOG_BY_SLUG[paletteHover.slug] : null;

  return (
    <div className="flex h-[calc(100vh-3.5rem)] w-full text-sm">
      {/* ── palette ──────────────────────────────────────────────────────── */}
      <aside className="relative w-64 shrink-0 border-r border-crimson/15 bg-background/60 backdrop-blur-md flex flex-col">
        <div className="px-3 py-3 border-b border-crimson/15 flex items-center gap-2">
          <Boxes className="h-4 w-4 text-crimson-glow" />
          <span className="font-mono text-[11px] uppercase tracking-[0.2em] text-muted-foreground">Node palette</span>
        </div>
        <div className="p-2 border-b border-crimson/10 space-y-2">
          <div className="flex gap-1.5">
            <input
              value={customName}
              onChange={(e) => setCustomName(e.target.value)}
              onKeyDown={(e) => { if (e.key === "Enter") createCustomNode(); }}
              placeholder="Custom node…"
              className="min-w-0 flex-1 bg-background/40 border border-crimson/15 rounded-md px-2 py-1.5 text-xs font-mono outline-none focus:border-crimson/40"
            />
            <button
              onClick={createCustomNode}
              className="h-8 w-8 shrink-0 rounded-md border border-crimson/25 bg-crimson/10 text-crimson-glow grid place-items-center hover:bg-crimson/20 transition-colors"
              title="Create custom node"
              aria-label="Create custom node"
            >
              <Plus className="h-3.5 w-3.5" />
            </button>
          </div>
          <div className="relative">
            <Search className="absolute left-2 top-2.5 h-3.5 w-3.5 text-muted-foreground/60" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search nodes…"
              className="w-full bg-background/40 border border-crimson/15 rounded-md pl-7 pr-2 py-1.5 text-xs font-mono outline-none focus:border-crimson/40"
            />
          </div>
        </div>
        <div className="flex-1 overflow-y-auto px-2 py-3 space-y-4">
          {Object.entries(grouped).map(([group, kinds]) => (
            <div key={group}>
              <div className="font-mono text-[10px] uppercase tracking-[0.2em] text-muted-foreground mb-2 px-1">{group}</div>
              <div className="grid grid-cols-4 gap-1.5">
                {kinds.map((k) => (
                  <PaletteTile
                    key={k.slug}
                    kind={k}
                    onPointerDown={(e) => onPalettePointerDown(e, k.slug)}
                    onKeyActivate={() => onPaletteClick(k.slug)}
                    onHover={(rectTop) => setPaletteHover({ slug: k.slug, top: rectTop })}
                    onHoverEnd={() => setPaletteHover((h) => (h?.slug === k.slug ? null : h))}
                  />
                ))}
              </div>
            </div>
          ))}
        </div>
        <div className="border-t border-crimson/10 p-3 text-[10px] font-mono text-muted-foreground leading-relaxed">
          Drag — or click — a node onto the canvas. Use <kbd className="px-1 border border-crimson/20 rounded">Connect</kbd> to wire two nodes.
        </div>

        {/* Palette hover preview */}
        {hoveredPaletteKind && paletteHover && (
          <div
            className="pointer-events-none fixed z-50 w-72 rounded-lg border border-crimson/40 bg-background/95 backdrop-blur-xl shadow-2xl p-3"
            style={{ left: 272, top: Math.max(16, paletteHover.top - 8) }}
          >
            <div className="flex items-center gap-3 mb-2.5">
              <div className="h-11 w-11 rounded-md border border-foreground/10 grid place-items-center" style={{ background: `${hoveredPaletteKind.color}22`, boxShadow: `0 0 22px ${hoveredPaletteKind.color}44` }}>
                <LogoMark kind={hoveredPaletteKind} size={30} />
              </div>
              <div className="min-w-0">
                <div className="text-sm font-semibold text-foreground truncate">{hoveredPaletteKind.label}</div>
                <div className="text-[10px] font-mono uppercase tracking-widest text-muted-foreground">{hoveredPaletteKind.group}</div>
              </div>
            </div>
            <p className="text-xs text-muted-foreground leading-relaxed">{hoveredPaletteKind.description}</p>
            <div className="mt-2 flex items-center gap-2 text-[10px] font-mono uppercase tracking-widest text-crimson-glow/90">
              <span className="h-1.5 w-1.5 rounded-full" style={{ background: hoveredPaletteKind.color }} />
              Drag to canvas or click to add
            </div>
          </div>
        )}
      </aside>

      {/* ── canvas region ───────────────────────────────────────────────── */}
      <div className="relative flex-1 min-w-0 overflow-hidden bg-[radial-gradient(circle_at_18%_12%,_oklch(0.55_0.24_22_/_0.16),_transparent_34%),radial-gradient(circle_at_82%_82%,_oklch(0.62_0.18_190_/_0.12),_transparent_38%),linear-gradient(135deg,_oklch(0.08_0.012_20),_oklch(0.12_0.022_250)_52%,_oklch(0.07_0.015_20))] before:pointer-events-none after:pointer-events-none before:absolute before:inset-0 before:bg-[linear-gradient(to_right,_oklch(0.68_0.27_22_/_0.075)_1px,_transparent_1px),linear-gradient(to_bottom,_oklch(0.68_0.27_22_/_0.055)_1px,_transparent_1px)] before:bg-[size:44px_44px] before:[mask-image:radial-gradient(ellipse_at_center,_black_25%,_transparent_78%)] after:absolute after:inset-0 after:bg-[radial-gradient(circle_at_center,_transparent,_oklch(0.03_0.01_20_/_0.72))]">
        {/* toolbar */}
        <div className="absolute top-3 left-3 right-3 z-20 flex items-center justify-between gap-3 pointer-events-none">
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-crimson/20 bg-background/70 backdrop-blur-md p-1">
            <ModeBtn active={mode === "cards"} onClick={() => setMode("cards")} icon={<Layers3 className="h-3.5 w-3.5" />} label="Cards" />
            <ModeBtn active={mode === "logos"} onClick={() => setMode("logos")} icon={<Circle className="h-3.5 w-3.5" />} label="Logo orbit" />
            <ModeBtn active={mode === "three"} onClick={() => setMode("three")} icon={<Boxes className="h-3.5 w-3.5" />} label="3D" />
          </div>
          <div className="pointer-events-auto flex items-center gap-1.5 rounded-md border border-crimson/20 bg-background/70 backdrop-blur-md p-1">
            <ToolBtn active={tool === "select"} onClick={() => { setTool("select"); setConnectFrom(null); }} icon={<MousePointer2 className="h-3.5 w-3.5" />} label="Select" />
            <ToolBtn active={tool === "connect"} onClick={() => setTool("connect")} icon={<Link2 className="h-3.5 w-3.5" />} label={connectFrom ? "Pick target…" : "Connect"} />
            <div className="w-px h-5 bg-crimson/20 mx-1" />
            <button onClick={() => { setPan({ x: 0, y: 0 }); setZoom(1); setRotate({ x: 18, y: -22 }); }} className="px-2 h-7 text-[10px] font-mono uppercase tracking-widest text-muted-foreground hover:text-crimson-glow">Reset view</button>
          </div>
        </div>

        {/* surface */}
        <div
          ref={surfaceRef}
          onPointerDown={onSurfacePointerDown}
          onPointerMove={onSurfacePointerMove}
          onPointerUp={(e) => { onSurfacePointerUp(); (e.currentTarget as Element).releasePointerCapture?.(e.pointerId); }}
          onPointerCancel={onSurfacePointerUp}
          onWheel={onSurfaceWheel}
          onContextMenu={(e) => e.preventDefault()}
          className="absolute inset-0 z-10 select-none touch-none cursor-grab active:cursor-grabbing"
          style={{ perspective: mode === "three" ? "1400px" : undefined }}
        >
          {/* world */}
          <div
            className="absolute left-1/2 top-1/2"
            style={{
              transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom}) ${transform3d}`,
              transformStyle: mode === "three" ? "preserve-3d" : undefined,
              transition: mode === "three" ? "transform 80ms linear" : undefined,
            }}
          >
            {/* edges */}
            <svg
              className="absolute pointer-events-none overflow-visible"
              style={{ left: 0, top: 0, width: 1, height: 1 }}
            >
              {graph.edges.map((e) => {
                const a = nodeById(e.a); const b = nodeById(e.b);
                if (!a || !b) return null;
                return (
                  <line
                    key={e.id}
                    x1={a.x} y1={a.y} x2={b.x} y2={b.y}
                    stroke="oklch(0.68 0.27 22 / 0.55)"
                    strokeWidth={1.4}
                    strokeDasharray="2 4"
                  />
                );
              })}
            </svg>

            {/* nodes */}
              {graph.nodes.map((n) => {
              const k = CATALOG_BY_SLUG[n.slug] ?? FALLBACK_KIND;
              const isHover = hoverNode === n.id;
              const isSel = selectedNode === n.id;
              const isConnSource = connectFrom === n.id;
              return (
                <div
                  key={n.id}
                  onPointerDown={(e) => onNodePointerDown(e, n)}
                  onPointerEnter={() => setHoverNode(n.id)}
                  onPointerLeave={() => setHoverNode((h) => (h === n.id ? null : h))}
                  onDoubleClick={(e) => { e.stopPropagation(); setSelectedNode(n.id); setEditing(n); }}
                  className="absolute"
                  style={{
                    transform: `translate3d(${n.x}px, ${n.y}px, ${n.z}px)`,
                    transformStyle: mode === "three" ? "preserve-3d" : undefined,
                  }}
                >
                  <NodeView
                    node={n} kind={k} mode={mode}
                    expanded={mode !== "cards" && isHover}
                    selected={isSel} connectSource={isConnSource}
                  />
                </div>
              );
            })}

            {/* empty hint */}
            {graph.nodes.length === 0 && (
              <div className="absolute -translate-x-1/2 -translate-y-1/2 text-center pointer-events-none">
                <div className="font-mono text-[11px] uppercase tracking-[0.25em] text-muted-foreground/70 mb-2">
                  // {name ?? "Empty canvas"}
                </div>
                <div className="text-muted-foreground/60 text-sm max-w-xs">
                  Drag — or click — a node from the palette to start mapping this identity cluster.
                </div>
              </div>
            )}
          </div>

          {/* hud */}
          <div className="absolute bottom-3 left-3 z-20 font-mono text-[10px] text-muted-foreground/80 flex items-center gap-3 bg-background/60 backdrop-blur-md border border-crimson/15 rounded-md px-2.5 py-1">
            <span>{graph.nodes.length} nodes</span>
            <span className="opacity-50">·</span>
            <span>{graph.edges.length} edges</span>
            <span className="opacity-50">·</span>
            <span>zoom {(zoom * 100).toFixed(0)}%</span>
            {mode === "three" && (<><span className="opacity-50">·</span><span>drag to orbit · alt-drag to pan</span></>)}
          </div>
        </div>

        {paletteDrag && CATALOG_BY_SLUG[paletteDrag.slug] && (
          <div
            className="pointer-events-none fixed z-[70] -translate-x-1/2 -translate-y-1/2 rounded-lg border border-crimson/40 bg-background/90 p-2 shadow-2xl backdrop-blur-xl"
            style={{ left: paletteDrag.x, top: paletteDrag.y, boxShadow: `0 0 34px ${CATALOG_BY_SLUG[paletteDrag.slug].color}66` }}
          >
            <LogoMark kind={CATALOG_BY_SLUG[paletteDrag.slug]} size={34} />
          </div>
        )}

        {/* node inspector */}
        {editing && (
          <NodeInspector
            node={editing}
            onClose={() => setEditing(null)}
            onChange={(next) => {
              setGraph((g) => ({ ...g, nodes: g.nodes.map((m) => m.id === next.id ? next : m) }));
              setEditing(next);
            }}
            onDelete={() => deleteNode(editing.id)}
          />
        )}
      </div>
    </div>
  );
}

// ─── presentational ────────────────────────────────────────────────────────
function ModeBtn({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button
      onClick={onClick}
      className={`inline-flex items-center gap-1.5 px-2.5 h-7 rounded text-[10px] font-mono uppercase tracking-widest ${
        active ? "bg-crimson/25 text-crimson-glow" : "text-muted-foreground hover:text-foreground"
      }`}
    >
      {icon}{label}
    </button>
  );
}
function ToolBtn(props: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return <ModeBtn {...props} />;
}

function LogoMark({ kind, size = 22 }: { kind: NodeKind; size?: number }) {
  const url = logoUrl(kind);
  const [errored, setErrored] = useState(false);
  useEffect(() => { setErrored(false); }, [url]);
  if (url && !errored) {
    return (
      <img
        src={url}
        alt={`${kind.label} logo`}
        width={size}
        height={size}
        draggable={false}
        onError={() => setErrored(true)}
        style={{ width: size, height: size, objectFit: "contain", filter: `drop-shadow(0 0 6px ${kind.color}aa)` }}
      />
    );
  }
  return (
    <span
      className="font-display font-bold leading-none"
      style={{ color: kind.color, textShadow: `0 0 10px ${kind.color}aa`, fontSize: Math.max(10, size * 0.55) }}
    >
      {kind.logo}
    </span>
  );
}

function PaletteTile({
  kind, onPointerDown, onKeyActivate, onHover, onHoverEnd,
}: {
  kind: NodeKind;
  onPointerDown: (e: React.PointerEvent) => void;
  onKeyActivate: () => void;
  onHover: (rectTop: number) => void;
  onHoverEnd: () => void;
}) {
  return (
    <div
      role="button"
      tabIndex={0}
      draggable={false}
      onDragStart={(e) => e.preventDefault()}
      onPointerDown={onPointerDown}
      onKeyDown={(e) => { if (e.key === "Enter" || e.key === " ") { e.preventDefault(); onKeyActivate(); } }}
      onMouseEnter={(e) => onHover((e.currentTarget as HTMLElement).getBoundingClientRect().top)}
      onMouseLeave={onHoverEnd}
      aria-label={`${kind.label} node`}
      className="aspect-square rounded-md grid place-items-center cursor-grab active:cursor-grabbing border border-foreground/5 hover:border-foreground/30 hover:scale-[1.06] transition-all select-none"
      style={{ background: `linear-gradient(135deg, ${kind.color}33, ${kind.color}11)` }}
    >
      <LogoMark kind={kind} size={22} />
    </div>
  );
}

function NodeView({ node, kind, mode, expanded, selected, connectSource }: {
  node: GraphNode; kind: NodeKind; mode: Mode; expanded: boolean; selected: boolean; connectSource: boolean;
}) {
  const ring = selected || connectSource ? `0 0 0 2px ${kind.color}, 0 0 26px ${kind.color}cc` : `0 0 18px ${kind.color}44`;

  if (mode === "cards") {
    return (
      <div
        className="-translate-x-1/2 -translate-y-1/2 min-w-[180px] rounded-lg border border-foreground/10 cursor-grab active:cursor-grabbing"
        style={{
          background: `linear-gradient(155deg, ${kind.color}, ${kind.color}cc)`,
          boxShadow: ring,
        }}
      >
        <div className="flex items-center gap-2 px-3 py-2">
          <div className="h-8 w-8 rounded grid place-items-center bg-background/50">
            <LogoMark kind={kind} size={20} />
          </div>
          <div className="min-w-0 flex-1">
            <div className="text-[10px] uppercase tracking-widest text-primary-foreground/80 font-mono">{kind.label}</div>
            <div className="text-sm font-medium text-primary-foreground truncate">{node.label}</div>
          </div>
        </div>
        {node.link && (
          <div className="px-3 pb-2 text-[10px] font-mono text-primary-foreground/80 truncate">{node.link}</div>
        )}
      </div>
    );
  }

  // logos / 3D — same visual primitive
  return (
    <div className="-translate-x-1/2 -translate-y-1/2 cursor-grab active:cursor-grabbing" style={{ transformStyle: "preserve-3d" }}>
      <div
        className="relative h-14 w-14 rounded-full grid place-items-center border-2 transition-transform"
        style={{
          background: `radial-gradient(circle at 30% 25%, ${kind.color}33, ${kind.color}11 60%, transparent)`,
          borderColor: kind.color,
          boxShadow: ring,
          transform: mode === "three" ? "translateZ(20px)" : undefined,
        }}
      >
        <LogoMark kind={kind} size={28} />
      </div>
      {expanded && (
        <div
          className="absolute left-1/2 top-full mt-2 -translate-x-1/2 min-w-[200px] rounded-lg border border-foreground/10 bg-background/95 backdrop-blur-md p-2.5 shadow-xl"
          style={{ boxShadow: `0 8px 30px ${kind.color}55`, transform: mode === "three" ? "translateZ(40px) translate(-50%, 0)" : undefined }}
        >
          <div className="text-[10px] uppercase tracking-widest text-muted-foreground font-mono">{kind.label}</div>
          <div className="text-sm font-semibold truncate" style={{ color: kind.color }}>{node.label}</div>
          {node.link && <div className="mt-1 text-[10px] font-mono text-muted-foreground truncate">{node.link}</div>}
        </div>
      )}
    </div>
  );
}

function NodeInspector({ node, onChange, onClose, onDelete }: {
  node: GraphNode; onChange: (n: GraphNode) => void; onClose: () => void; onDelete: () => void;
}) {
  const k = CATALOG_BY_SLUG[node.slug] ?? FALLBACK_KIND;
  return (
    <div className="absolute top-16 right-3 z-30 w-72 rounded-xl border border-crimson/20 bg-background/95 backdrop-blur-xl shadow-2xl">
      <div className="flex items-center gap-2 px-3 py-2 border-b border-crimson/15">
        <div className="h-8 w-8 rounded grid place-items-center" style={{ background: `${k.color}22` }}>
          <LogoMark kind={k} size={22} />
        </div>
        <div className="flex-1 font-mono text-[11px] uppercase tracking-widest text-muted-foreground">{k.label}</div>
        <button onClick={onClose} className="text-muted-foreground hover:text-crimson-glow"><X className="h-4 w-4" /></button>
      </div>
      <div className="p-3 space-y-3">
        <p className="text-[11px] text-muted-foreground leading-relaxed">{k.description}</p>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">Label / handle</span>
          <input
            value={node.label}
            onChange={(e) => onChange({ ...node, label: e.target.value })}
            className="w-full bg-background/40 border border-crimson/20 rounded-md px-2 py-1.5 text-sm outline-none focus:border-crimson/50"
          />
        </label>
        <label className="block">
          <span className="block text-[10px] uppercase tracking-widest text-muted-foreground font-mono mb-1">Link / URL</span>
          <input
            value={node.link ?? ""}
            placeholder="https://…"
            onChange={(e) => onChange({ ...node, link: e.target.value })}
            className="w-full bg-background/40 border border-crimson/20 rounded-md px-2 py-1.5 text-xs font-mono outline-none focus:border-crimson/50"
          />
        </label>
        <div className="flex justify-between pt-1">
          <Button size="sm" variant="ghost" onClick={onDelete} className="text-crimson-glow hover:bg-crimson/10">
            <Trash2 className="h-3.5 w-3.5 mr-1" /> Delete
          </Button>
          <Button size="sm" variant="outlineGlow" onClick={onClose}>
            <Save className="h-3.5 w-3.5 mr-1" /> Done
          </Button>
        </div>
      </div>
    </div>
  );
}

// silenced unused warnings for icons reserved for future toolbar additions
void Plus;
