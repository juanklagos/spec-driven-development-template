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
  /** JSON Canvas color (preset "1".."6" or hex); typed edges carry it (spec 009). */
  color?: string;
}

export interface BoardCanvas {
  nodes: CanvasNode[];
  edges: CanvasEdge[];
}

/** Visual state computed once by sdd-core (specTone) and sent by the API. */
export type SpecTone = "pending" | "ok" | "done";

export interface SpecSummary {
  id: string;
  dir: string;
  status: string;
  tasks: { done: number; total: number };
  /** Server-computed: never re-derive it here or surfaces drift apart. */
  tone: SpecTone;
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

/** Typed-edge dependency warning (spec 009, R2; mirrors sdd-core). */
export interface DependencyWarning {
  edgeId: string;
  /** Approved spec that leans on an unapproved dependency. */
  dependent: string;
  /** The unapproved spec the dependent relies on. */
  dependency: string;
  label: string;
  message: string;
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
  /** Optional so a gate payload from an older server never breaks the UI. */
  dependencyWarnings?: DependencyWarning[];
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
  /** Requirements list (spec 010, R2). */
  requirements?: string[];
  /** Spec properties list — bridge to executable specs (spec 010, R2). */
  properties?: string[];
  /** Success criteria list (spec 010, R2). */
  successCriteria?: string[];
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
/** Canvas (React Flow) vs Kanban board view (spec 009, R1). */
export type ViewMode = "canvas" | "board";

// --- Tasks -> GitHub issues (POST /api/spec/:id/issues, spec 009, R3) -------

export type IssueTaskStatus = "created" | "skipped" | "failed";

export interface IssueTaskResult {
  line: number;
  task: string;
  title: string;
  status: IssueTaskStatus;
  url?: string;
  error?: string;
}

export interface CreateIssuesResult {
  specId: string;
  repo: string;
  created: number;
  skipped: number;
  failed: number;
  results: IssueTaskResult[];
}

// --- Live sync (SSE /api/events) -------------------------------------------

/** Payload of the `change` SSE event emitted by the server watcher. */
export interface LiveChange {
  path: string;
  kind: ChangeKind;
}

export type ChangeKind = "board" | "specs";
export type LiveStatus = "on" | "off";
