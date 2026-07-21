import type { Edge, Node } from "@xyflow/react";

// ---------------------------------------------------------------------------
// API contracts (mirrors packages/sdd-core/src/board.ts, JSON Canvas format)
// ---------------------------------------------------------------------------

export interface CanvasNode {
  id: string;
  type: "file" | "text";
  x: number;
  y: number;
  width: number;
  height: number;
  file?: string;
  text?: string;
  color?: string;
}

export interface CanvasEdge {
  id: string;
  fromNode: string;
  toNode: string;
  fromSide?: string;
  toSide?: string;
  label?: string;
}

export interface BoardCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

export interface SpecSummary {
  id: string;
  dir: string;
  status: string;
  tasks: { done: number; total: number };
}

export interface BoardResponse {
  projectRoot: string;
  canvas: BoardCanvas;
  specs: SpecSummary[];
}

export interface TaskItem {
  text: string;
  done: boolean;
  line: number;
}

export interface SpecDetail {
  id: string;
  docs: { spec: string; plan: string; tasks: string };
  tasks: TaskItem[];
}

export interface CreateSpecResult {
  specId: string;
  specDir: string;
}

// --- Gate semaphore (GET /api/gate, mirrors sdd-core GateSummary) ----------

export interface ValidationMessage {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
}

export interface ValidationCounts {
  ok: boolean;
  errors: number;
  warnings: number;
  messages: ValidationMessage[];
}

export interface GateSummary {
  ok: boolean;
  errors: number;
  warnings: number;
  approvedSpecs: number;
  totalSpecs: number;
  gate: ValidationCounts & { approvedSpecs: number; totalSpecs: number };
  validation: ValidationCounts;
  specIssues: Record<string, ValidationMessage[]>;
  generalIssues: ValidationMessage[];
}

// --- Spec actions (approve + guided sections) ------------------------------

export interface ApproveSpecResult {
  specId: string;
  status: string;
  approvalDate: string;
  approver: string;
  evidenceUpdated: boolean;
  fieldsUpdated: string[];
}

export interface SpecSectionsInput {
  story?: string;
  scenarios?: string[];
  criteria?: string[];
  outOfScope?: string;
}

export interface UpdateSpecSectionsResult {
  specId: string;
  updated: string[];
  created: string[];
}

// ---------------------------------------------------------------------------
// React Flow node/edge shapes (type aliases so they satisfy Record<string, unknown>)
// ---------------------------------------------------------------------------

export type SpecNodeData = {
  specId: string;
  file: string;
  width: number;
  height: number;
};

export type NoteNodeData = {
  text: string;
  color?: string;
  /** Preserved for JSON Canvas "file" nodes that do not map to a spec. */
  file?: string;
  width: number;
  height: number;
};

export type SpecFlowNode = Node<SpecNodeData, "spec">;
export type NoteFlowNode = Node<NoteNodeData, "note">;
export type AppNode = SpecFlowNode | NoteFlowNode;

export type EdgeData = { label?: string };
export type AppEdge = Edge<EdgeData, "labeled">;

export type SaveState = "saved" | "dirty" | "saving" | "error";
export type PaletteKind = "idea" | "epic" | "spec";

// --- Live sync (SSE /api/events) -------------------------------------------

/** Payload of the `change` SSE event emitted by the server watcher. */
export interface LiveChange {
  path: string;
  kind: ChangeKind;
}

export type ChangeKind = "board" | "specs";
export type LiveStatus = "on" | "off";
