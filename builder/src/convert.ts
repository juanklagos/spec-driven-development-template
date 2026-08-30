import { MarkerType } from "@xyflow/react";
import type {
  AppEdge,
  AppNode,
  BoardCanvas,
  CanvasEdge,
  CanvasNode,
  SpecSummary
} from "./types";

// Obsidian/JSON Canvas preset colors "1".."6" mapped to hex for rendering.
const PRESET_COLORS: Record<string, string> = {
  "1": "#ef4444",
  "2": "#f97316",
  "3": "#eab308",
  "4": "#22c55e",
  "5": "#06b6d4",
  "6": "#a855f7"
};

export const IDEA_COLOR = "#eab308";
export const EPIC_COLOR = "#a855f7";

export const SPEC_CARD = { width: 300, height: 180 };
export const NOTE_CARD = { width: 260, height: 120 };
/** Spec 041: a new frame has to be big enough to drop a couple of cards in. */
export const GROUP_FRAME = { width: 560, height: 360 };

export function colorToHex(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  return PRESET_COLORS[color] ?? color;
}

const SPEC_FILE_RE = /^specs\/([^/]+)\/spec\.md$/;

export const ARROW = { type: MarkerType.ArrowClosed, width: 18, height: 18 } as const;

// --- Typed edges (spec 009, R2 + spec 010, R3) -----------------------------
// The edge label carries the canonical connection purpose (ES and EN
// spellings are both canonical). KEEP THE LABEL SETS IN SYNC with the core
// copy in packages/sdd-core/src/board.ts (`classifyEdgeLabel`) — same
// keep-in-sync contract as the EARS lint in ears.ts.

export type EdgeKind = "related" | "depends" | "blocks" | "contains";

const DEPENDS_EDGE_LABELS = new Set(["depende de", "depends on"]);
const BLOCKS_EDGE_LABELS = new Set(["bloquea", "blocks"]);
const CONTAINS_EDGE_LABELS = new Set(["contiene", "contains", "contiene / contains"]);

/**
 * Stroke/marker colors readable in both themes: blue related (the default
 * purpose), amber depends, red blocks, gray contains (epic → spec).
 */
const EDGE_KIND_STROKE: Record<EdgeKind, string> = {
  related: "#3b82f6",
  depends: "#d97706",
  blocks: "#dc2626",
  contains: "#6b7280"
};

/**
 * JSON Canvas color persisted for typed edges (mirrors sdd-core
 * canvasEdgeColorForLabel): presets for depends/blocks, hex for contains,
 * none for the default related.
 */
const EDGE_KIND_CANVAS_COLOR: Partial<Record<EdgeKind, string>> = {
  depends: "3",
  blocks: "1",
  contains: "#6b7280"
};

export function edgeKind(label: string | undefined): EdgeKind {
  const value = (label ?? "").trim().toLowerCase();
  if (DEPENDS_EDGE_LABELS.has(value)) return "depends";
  if (BLOCKS_EDGE_LABELS.has(value)) return "blocks";
  if (CONTAINS_EDGE_LABELS.has(value)) return "contains";
  return "related";
}

/** Canonical label written to board.canvas for a purpose, per language. */
export const EDGE_KIND_LABELS: Record<Exclude<EdgeKind, "related">, { es: string; en: string }> = {
  depends: { es: "depende de", en: "depends on" },
  blocks: { es: "bloquea", en: "blocks" },
  contains: { es: "contiene", en: "contains" }
};

/**
 * Derive the visual style (stroke + arrow color) of an edge from its label.
 * The label is the single source of truth: re-styling after a label change
 * self-heals any stale color coming from board.canvas.
 */
export function styleEdgeForLabel(edge: AppEdge): AppEdge {
  const stroke = EDGE_KIND_STROKE[edgeKind(edge.data?.label)];
  return {
    ...edge,
    style: { stroke, strokeWidth: 1.8 },
    markerEnd: { ...ARROW, color: stroke }
  };
}

function toFlowEdge(edge: CanvasEdge): AppEdge {
  return styleEdgeForLabel({
    id: edge.id,
    source: edge.fromNode,
    target: edge.toNode,
    type: "labeled",
    // Spec 042: carry back what the file said, so saving does not flatten the
    // sides or overwrite a color this builder never chose. `originalLabel` is
    // what makes "the person changed the purpose" distinguishable later.
    data: {
      label: edge.label ?? "",
      originalLabel: edge.label ?? "",
      ...(edge.fromSide ? { fromSide: edge.fromSide } : {}),
      ...(edge.toSide ? { toSide: edge.toSide } : {}),
      ...(edge.color ? { color: edge.color } : {}),
      ...extraOf(edge, EDGE_OWN_FIELDS)
    },
    markerEnd: ARROW
  });
}

/**
 * JSON Canvas -> React Flow. Canvas "file" nodes that point to a spec become
 * spec cards; everything else becomes a note card. Specs that exist on disk
 * but are not on the canvas yet are appended below the existing content.
 */
export function boardToFlow(
  canvas: BoardCanvas,
  specs: SpecSummary[]
): { nodes: AppNode[]; edges: AppEdge[] } {
  const specIds = new Set(specs.map((s) => s.id));
  const nodes: AppNode[] = [];
  const covered = new Set<string>();
  let maxBottom = 0;

  for (const n of canvas.nodes) {
    maxBottom = Math.max(maxBottom, n.y + n.height);
    const position = { x: n.x, y: n.y };
    // Spec 041. Before this branch existed, a group fell through to the note
    // fallback below, which reads `n.text` — and a group has none, so the card
    // came up empty and the next save wrote it back as type "text", erasing
    // the label and the background from the user's file.
    if (n.type === "group") {
      nodes.push(toGroupNode(n, position));
      continue;
    }
    if (n.type === "file") {
      const fromFile = n.file?.match(SPEC_FILE_RE)?.[1];
      const specId = specIds.has(n.id) ? n.id : fromFile && specIds.has(fromFile) ? fromFile : undefined;
      if (specId) {
        covered.add(specId);
        nodes.push({
          id: n.id,
          type: "spec",
          // See sdd-note-spec-not-deletable in store.ts.
          deletable: false,
          position,
          data: {
            specId,
            file: n.file ?? `specs/${specId}/spec.md`,
            width: n.width,
            height: n.height,
            ...extraOf(n)
          }
        });
        continue;
      }
      // A file node that is not a known spec: keep it as a note but remember
      // the file so saving does not destroy the reference.
      nodes.push({
        id: n.id,
        type: "note",
        position,
        data: {
          text: n.file ?? "(archivo / file)",
          file: n.file,
          canvasType: "file",
          color: n.color,
          width: n.width,
          height: n.height,
          ...extraOf(n)
        }
      });
      continue;
    }
    // Spec 042. A link is the fourth node type of JSON Canvas 1.0. It used to
    // fall through to the text fallback below, which reads `n.text` — a link
    // has none, so the card came up empty and the next save wrote it back as
    // `type:"text"`, dropping the URL from the user's file. Same shape of
    // defect the 041 fixed for groups, and the same treatment: show what it
    // points at, and give it back untouched.
    if (n.type === "link") {
      nodes.push({
        id: n.id,
        type: "note",
        position,
        data: {
          text: n.url ?? "(enlace / link)",
          canvasType: "link",
          color: n.color,
          width: n.width,
          height: n.height,
          ...extraOf(n)
        }
      });
      continue;
    }
    nodes.push({
      id: n.id,
      type: "note",
      position,
      data: {
        text: n.text ?? "",
        canvasType: "text",
        color: n.color,
        width: n.width,
        height: n.height,
        ...extraOf(n)
      }
    });
  }

  const missing = specs.filter((s) => !covered.has(s.id));
  const baseY = canvas.nodes.length > 0 ? maxBottom + 60 : 0;
  missing.forEach((spec, i) => {
    nodes.push({
      id: spec.id,
      type: "spec",
      deletable: false,
      position: { x: (i % 3) * (SPEC_CARD.width + 40), y: baseY + Math.floor(i / 3) * (SPEC_CARD.height + 40) },
      data: { specId: spec.id, file: `specs/${spec.id}/spec.md`, ...SPEC_CARD }
    });
  });

  return { nodes: applyGroupMembership(nodes), edges: canvas.edges.map(toFlowEdge) };
}

/**
 * JSON Canvas fields the builder paints itself; anything else is carried in
 * `extra` and written back untouched.
 *
 * Spec 041 introduced this for the group node. Spec 042 generalises it to every
 * node and to edges: the same argument applies to `subpath`, to `url`, and to
 * whatever a future JSON Canvas revision adds. One set for all types is safe
 * because the fields are disjoint per type — a group has no `text`, a note has
 * no `label` — and carrying a key the node never had costs nothing.
 */
const NODE_OWN_FIELDS = new Set([
  "id",
  "type",
  "x",
  "y",
  "width",
  "height",
  "text",
  "file",
  // `url` is deliberately NOT here. The builder shows it as the card's text but
  // never writes it back from `data`, so it has to travel in `extra` to survive
  // the round-trip — including when the person edits the card's text.
  "color",
  "label",
  "background",
  "backgroundStyle"
]);

/** Edge fields the builder paints; the rest travels in `extra`. */
const EDGE_OWN_FIELDS = new Set([
  "id",
  "fromNode",
  "toNode",
  "fromSide",
  "toSide",
  "label",
  "color"
]);

/** Everything the source object carried that this builder does not paint. */
function extraFields(source: object, own: Set<string>): Record<string, unknown> {
  const extra: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(source as Record<string, unknown>)) {
    if (!own.has(key)) extra[key] = value;
  }
  return extra;
}

/** `{ extra }` when there is anything to carry, `{}` otherwise. */
function extraOf(source: object, own: Set<string> = NODE_OWN_FIELDS): { extra?: Record<string, unknown> } {
  const extra = extraFields(source, own);
  return Object.keys(extra).length > 0 ? { extra } : {};
}

/** JSON Canvas group -> React Flow node, keeping every field it arrived with. */
function toGroupNode(n: CanvasNode, position: { x: number; y: number }): AppNode {
  return {
    id: n.id,
    type: "group",
    position,
    // Solo la cabecera arrastra: el cuerpo del marco no captura el puntero,
    // así que las tarjetas de encima siguen siendo clicables.
    dragHandle: ".group-handle",
    // Un grupo es fondo. React Flow apila por orden y por zIndex; sin esto el
    // marco taparía las tarjetas que contiene.
    zIndex: -1,
    // El tamaño se declara en el nodo, no solo dentro de `data`: sin esto el
    // wrapper de React Flow se ajusta a la chapa del título (medido: 150×342
    // para un marco de 760×320) y ese número acabaría en el archivo.
    width: n.width,
    height: n.height,
    data: {
      label: n.label ?? "",
      ...(n.color ? { color: n.color } : {}),
      ...(n.background ? { background: n.background } : {}),
      ...(n.backgroundStyle ? { backgroundStyle: n.backgroundStyle } : {}),
      width: n.width,
      height: n.height,
      ...extraOf(n)
    }
  };
}


// --- Group membership (spec 041, decisión 2) -------------------------------
// JSON Canvas has NO parent field: being inside a group is geometry, not data
// (spec 1.0, verified 2026-08-25). React Flow needs the opposite — an explicit
// `parentId` plus positions relative to the parent. So membership is DERIVED
// on every load and DISSOLVED again on every save. Writing a parentId into the
// file would take it outside the format, and Obsidian — where these boards
// come from — would stop understanding it.

type Rect = { x: number; y: number; width: number; height: number };

function rectOf(n: AppNode, at: { x: number; y: number }): Rect {
  return { x: at.x, y: at.y, width: n.data.width, height: n.data.height };
}

function contains(outer: Rect, inner: Rect): boolean {
  return (
    inner.x >= outer.x &&
    inner.y >= outer.y &&
    inner.x + inner.width <= outer.x + outer.width &&
    inner.y + inner.height <= outer.y + outer.height
  );
}

/** Absolute position of a node whose `position` may be relative to a parent. */
function absolutePosition(node: AppNode, byId: Map<string, AppNode>): { x: number; y: number } {
  let x = node.position.x;
  let y = node.position.y;
  const seen = new Set<string>([node.id]);
  let parentId = node.parentId;
  while (parentId && !seen.has(parentId)) {
    const parent = byId.get(parentId);
    if (!parent) break;
    seen.add(parentId);
    x += parent.position.x;
    y += parent.position.y;
    parentId = parent.parentId;
  }
  return { x, y };
}

/** Every node with an absolute position and no parent link. The save shape. */
export function toAbsoluteNodes(nodes: AppNode[]): AppNode[] {
  const byId = new Map(nodes.map((n) => [n.id, n]));
  return nodes.map((n) => {
    const { parentId: _drop, extent: _extent, ...rest } = n;
    return { ...rest, position: absolutePosition(n, byId) } as AppNode;
  });
}

/**
 * Derive `parentId` from geometry and rewrite child positions as relative.
 * Takes and returns nodes in absolute coordinates. The parent of a node is the
 * SMALLEST group that fully contains it (spec 041, decisión 4), which also
 * makes nesting deterministic and cycle-free: a group can only be the child of
 * a strictly larger one. Parents are emitted before their children, which the
 * React Flow runtime requires.
 */
export function applyGroupMembership(nodes: AppNode[]): AppNode[] {
  const groups = nodes.filter((n) => n.type === "group");
  if (groups.length === 0) return nodes.map((n) => ({ ...n, parentId: undefined }) as AppNode);

  const absById = new Map(nodes.map((n) => [n.id, { ...n.position }]));
  const parentOf = new Map<string, string>();

  for (const node of nodes) {
    const here = absById.get(node.id)!;
    const mine = rectOf(node, here);
    const myArea = mine.width * mine.height;
    let best: { id: string; area: number } | undefined;
    for (const group of groups) {
      if (group.id === node.id) continue;
      const gr = rectOf(group, absById.get(group.id)!);
      const area = gr.width * gr.height;
      // A group only nests inside a strictly larger one: equal areas would let
      // two identical frames adopt each other.
      if (node.type === "group" && area <= myArea) continue;
      if (!contains(gr, mine)) continue;
      if (!best || area < best.area) best = { id: group.id, area };
    }
    if (best) parentOf.set(node.id, best.id);
  }

  const depthOf = (id: string): number => {
    let depth = 0;
    let current = parentOf.get(id);
    const seen = new Set<string>([id]);
    while (current && !seen.has(current)) {
      seen.add(current);
      depth += 1;
      current = parentOf.get(current);
    }
    return depth;
  };

  const placed = nodes.map((node) => {
    const parentId = parentOf.get(node.id);
    if (!parentId) return { ...node, parentId: undefined } as AppNode;
    const here = absById.get(node.id)!;
    const parent = absById.get(parentId)!;
    return {
      ...node,
      parentId,
      position: { x: here.x - parent.x, y: here.y - parent.y }
    } as AppNode;
  });

  // Parent before child. Stable within a depth so the rest of the order — and
  // with it the paint order of overlapping cards — survives untouched.
  return placed
    .map((node, index) => ({ node, index, depth: depthOf(node.id) }))
    .sort((a, b) => a.depth - b.depth || a.index - b.index)
    .map((entry) => entry.node);
}

/** React Flow -> JSON Canvas (what PUT /api/board expects). */
export function flowToBoard(nodes: AppNode[], edges: AppEdge[]): BoardCanvas {
  // Absolute first: JSON Canvas stores absolute coordinates and knows nothing
  // about parents, so the runtime's relative positions never reach the file.
  const canvasNodes: CanvasNode[] = toAbsoluteNodes(nodes).map((n) => {
    const base = {
      id: n.id,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
      width: Math.round(n.measured?.width ?? n.data.width),
      height: Math.round(n.measured?.height ?? n.data.height)
    };
    if (n.type === "group") {
      // `extra` first so the geometry the user just moved always wins over the
      // copy that came in with the file. Size comes from `data`, never from
      // `measured`: a frame is as big as the file says, not as big as the DOM
      // happened to lay it out.
      return {
        ...(n.data.extra ?? {}),
        ...base,
        width: Math.round(n.data.width),
        height: Math.round(n.data.height),
        type: "group",
        ...(n.data.label ? { label: n.data.label } : {}),
        ...(n.data.color ? { color: n.data.color } : {}),
        ...(n.data.background ? { background: n.data.background } : {}),
        ...(n.data.backgroundStyle ? { backgroundStyle: n.data.backgroundStyle } : {})
      } as CanvasNode;
    }
    // Spec 042. `extra` first, geometry after: what the person just moved always
    // wins over the copy that came in with the file.
    if (n.type === "spec") {
      return { ...(n.data.extra ?? {}), ...base, type: "file", file: n.data.file } as CanvasNode;
    }
    if (n.data.canvasType === "link") {
      // The URL itself rides in `extra` (see NODE_OWN_FIELDS).
      return {
        ...(n.data.extra ?? {}),
        ...base,
        type: "link",
        ...(n.data.color ? { color: n.data.color } : {})
      } as CanvasNode;
    }
    if (n.data.file) {
      return {
        ...(n.data.extra ?? {}),
        ...base,
        type: "file",
        file: n.data.file,
        ...(n.data.color ? { color: n.data.color } : {})
      } as CanvasNode;
    }
    return {
      ...(n.data.extra ?? {}),
      ...base,
      type: "text",
      text: n.data.text,
      ...(n.data.color ? { color: n.data.color } : {})
    } as CanvasNode;
  });

  const canvasEdges: CanvasEdge[] = edges.map((e) => {
    // Spec 042. The color is re-derived ONLY when the person changed the
    // purpose; otherwise the file's own color wins. Re-deriving on every save
    // overwrote colors this builder never chose — and the sides were written
    // literally as right/left, flattening the geometry another canvas editor
    // had set.
    const label = e.data?.label;
    const labelChanged = (e.data?.originalLabel ?? "") !== (label ?? "");
    const derived = EDGE_KIND_CANVAS_COLOR[edgeKind(label)];
    const color = labelChanged ? derived : (e.data?.color ?? derived);
    return {
      ...(e.data?.extra ?? {}),
      id: e.id,
      fromNode: e.source,
      toNode: e.target,
      ...(e.data?.fromSide ? { fromSide: e.data.fromSide } : {}),
      ...(e.data?.toSide ? { toSide: e.data.toSide } : {}),
      ...(label ? { label } : {}),
      ...(color ? { color } : {})
    };
  });

  return { nodes: canvasNodes, edges: canvasEdges };
}
