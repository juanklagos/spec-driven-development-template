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

export function colorToHex(color: string | undefined, fallback: string): string {
  if (!color) return fallback;
  return PRESET_COLORS[color] ?? color;
}

const SPEC_FILE_RE = /^specs\/([^/]+)\/spec\.md$/;

export const ARROW = { type: MarkerType.ArrowClosed, width: 18, height: 18 } as const;

// --- Typed edges (spec 009, R2) --------------------------------------------
// The edge label carries the canonical dependency type (ES and EN spellings
// are both canonical). KEEP THE LABEL SETS IN SYNC with the core copy in
// packages/sdd-core/src/board.ts (`classifyEdgeLabel`) — same keep-in-sync
// contract as the EARS lint in ears.ts.

export type EdgeKind = "related" | "depends" | "blocks";

const DEPENDS_EDGE_LABELS = new Set(["depende de", "depends on"]);
const BLOCKS_EDGE_LABELS = new Set(["bloquea", "blocks"]);

/** Stroke/marker colors readable in both themes (amber depends, red blocks). */
const EDGE_KIND_STROKE: Partial<Record<EdgeKind, string>> = {
  depends: "#d97706",
  blocks: "#dc2626"
};

/** JSON Canvas preset color persisted for typed edges (mirrors sdd-core). */
const EDGE_KIND_CANVAS_COLOR: Partial<Record<EdgeKind, string>> = {
  depends: "3",
  blocks: "1"
};

export function edgeKind(label: string | undefined): EdgeKind {
  const value = (label ?? "").trim().toLowerCase();
  if (DEPENDS_EDGE_LABELS.has(value)) return "depends";
  if (BLOCKS_EDGE_LABELS.has(value)) return "blocks";
  return "related";
}

/**
 * Derive the visual style (stroke + arrow color) of an edge from its label.
 * The label is the single source of truth: re-styling after a label change
 * self-heals any stale color coming from board.canvas.
 */
export function styleEdgeForLabel(edge: AppEdge): AppEdge {
  const stroke = EDGE_KIND_STROKE[edgeKind(edge.data?.label)];
  return {
    ...edge,
    style: stroke ? { stroke, strokeWidth: 1.8 } : undefined,
    markerEnd: { ...ARROW, ...(stroke ? { color: stroke } : {}) }
  };
}

function toFlowEdge(edge: CanvasEdge): AppEdge {
  return styleEdgeForLabel({
    id: edge.id,
    source: edge.fromNode,
    target: edge.toNode,
    type: "labeled",
    data: { label: edge.label ?? "" },
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
    if (n.type === "file") {
      const fromFile = n.file?.match(SPEC_FILE_RE)?.[1];
      const specId = specIds.has(n.id) ? n.id : fromFile && specIds.has(fromFile) ? fromFile : undefined;
      if (specId) {
        covered.add(specId);
        nodes.push({
          id: n.id,
          type: "spec",
          position,
          data: {
            specId,
            file: n.file ?? `specs/${specId}/spec.md`,
            width: n.width,
            height: n.height
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
          color: n.color,
          width: n.width,
          height: n.height
        }
      });
      continue;
    }
    nodes.push({
      id: n.id,
      type: "note",
      position,
      data: { text: n.text ?? "", color: n.color, width: n.width, height: n.height }
    });
  }

  const missing = specs.filter((s) => !covered.has(s.id));
  const baseY = canvas.nodes.length > 0 ? maxBottom + 60 : 0;
  missing.forEach((spec, i) => {
    nodes.push({
      id: spec.id,
      type: "spec",
      position: { x: (i % 3) * (SPEC_CARD.width + 40), y: baseY + Math.floor(i / 3) * (SPEC_CARD.height + 40) },
      data: { specId: spec.id, file: `specs/${spec.id}/spec.md`, ...SPEC_CARD }
    });
  });

  return { nodes, edges: canvas.edges.map(toFlowEdge) };
}

/** React Flow -> JSON Canvas (what PUT /api/board expects). */
export function flowToBoard(nodes: AppNode[], edges: AppEdge[]): BoardCanvas {
  const canvasNodes: CanvasNode[] = nodes.map((n) => {
    const base = {
      id: n.id,
      x: Math.round(n.position.x),
      y: Math.round(n.position.y),
      width: Math.round(n.measured?.width ?? n.data.width),
      height: Math.round(n.measured?.height ?? n.data.height)
    };
    if (n.type === "spec") {
      return { ...base, type: "file", file: n.data.file };
    }
    if (n.data.file) {
      return { ...base, type: "file", file: n.data.file, ...(n.data.color ? { color: n.data.color } : {}) };
    }
    return { ...base, type: "text", text: n.data.text, ...(n.data.color ? { color: n.data.color } : {}) };
  });

  const canvasEdges: CanvasEdge[] = edges.map((e) => {
    const color = EDGE_KIND_CANVAS_COLOR[edgeKind(e.data?.label)];
    return {
      id: e.id,
      fromNode: e.source,
      toNode: e.target,
      fromSide: "right",
      toSide: "left",
      ...(e.data?.label ? { label: e.data.label } : {}),
      ...(color ? { color } : {})
    };
  });

  return { nodes: canvasNodes, edges: canvasEdges };
}
