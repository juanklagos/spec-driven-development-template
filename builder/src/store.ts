import {
  addEdge,
  applyEdgeChanges,
  applyNodeChanges,
  type Connection,
  type EdgeChange,
  type NodeChange,
  type XYPosition
} from "@xyflow/react";
import { create } from "zustand";
import { api, errorMessage } from "./api";
import { ARROW, EPIC_COLOR, IDEA_COLOR, NOTE_CARD, SPEC_CARD, boardToFlow, flowToBoard } from "./convert";
import type { AppEdge, AppNode, SaveState, SpecSummary, TaskItem } from "./types";

const SAVE_DEBOUNCE_MS = 500;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

const uid = (): string => crypto.randomUUID().slice(0, 8);

interface BuilderStore {
  loading: boolean;
  loadError: string | null;
  projectRoot: string;
  nodes: AppNode[];
  edges: AppEdge[];
  specs: Record<string, SpecSummary>;
  saveState: SaveState;
  saveError: string | null;
  selectedSpecId: string | null;
  editingEdgeId: string | null;

  load: () => Promise<void>;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNote: (kind: "idea" | "epic", position: XYPosition) => void;
  addSpecNode: (specId: string, position: XYPosition) => void;
  updateNoteText: (id: string, text: string) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  setEditingEdge: (id: string | null) => void;
  selectSpec: (id: string | null) => void;
  applyTasks: (id: string, tasks: TaskItem[]) => void;
  refreshSpecs: () => Promise<void>;
  scheduleSave: () => void;
  flushSave: () => Promise<void>;
}

export const useBuilderStore = create<BuilderStore>()((set, get) => ({
  loading: true,
  loadError: null,
  projectRoot: "",
  nodes: [],
  edges: [],
  specs: {},
  saveState: "saved",
  saveError: null,
  selectedSpecId: null,
  editingEdgeId: null,

  load: async () => {
    set({ loading: true, loadError: null });
    try {
      const board = await api.getBoard();
      const { nodes, edges } = boardToFlow(board.canvas, board.specs);
      set({
        loading: false,
        projectRoot: board.projectRoot,
        specs: Object.fromEntries(board.specs.map((s) => [s.id, s])),
        nodes,
        edges,
        saveState: "saved",
        saveError: null
      });
    } catch (error) {
      set({ loading: false, loadError: errorMessage(error) });
    }
  },

  onNodesChange: (changes) => {
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    const persistent = changes.some(
      (c) => c.type === "remove" || (c.type === "position" && c.dragging === false)
    );
    if (persistent) get().scheduleSave();
  },

  onEdgesChange: (changes) => {
    set({ edges: applyEdgeChanges(changes, get().edges) });
    if (changes.some((c) => c.type === "remove")) get().scheduleSave();
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    const edge: AppEdge = {
      id: `e-${uid()}`,
      source: connection.source,
      target: connection.target,
      type: "labeled",
      data: { label: "" },
      markerEnd: ARROW
    };
    set({ edges: addEdge(edge, get().edges) });
    get().scheduleSave();
  },

  addNote: (kind, position) => {
    const node: AppNode = {
      id: `note-${uid()}`,
      type: "note",
      position,
      data: {
        text: kind === "idea" ? "💡 Idea nueva / New idea" : "📦 Épica nueva / New epic",
        color: kind === "idea" ? IDEA_COLOR : EPIC_COLOR,
        ...NOTE_CARD
      }
    };
    set({ nodes: [...get().nodes, node] });
    get().scheduleSave();
  },

  addSpecNode: (specId, position) => {
    const specs = get().specs;
    const summary: SpecSummary =
      specs[specId] ?? { id: specId, dir: `specs/${specId}`, status: "Pendiente", tasks: { done: 0, total: 0 } };
    if (get().nodes.some((n) => n.id === specId)) return; // already on the canvas
    set({
      specs: { ...specs, [specId]: summary },
      nodes: [
        ...get().nodes,
        { id: specId, type: "spec", position, data: { specId, file: `specs/${specId}/spec.md`, ...SPEC_CARD } }
      ]
    });
    get().scheduleSave();
  },

  updateNoteText: (id, text) => {
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === "note" ? { ...n, data: { ...n.data, text } } : n
      )
    });
    get().scheduleSave();
  },

  updateEdgeLabel: (id, label) => {
    set({
      edges: get().edges.map((e) => (e.id === id ? { ...e, data: { ...e.data, label } } : e)),
      editingEdgeId: null
    });
    get().scheduleSave();
  },

  setEditingEdge: (id) => set({ editingEdgeId: id }),

  selectSpec: (id) => set({ selectedSpecId: id }),

  applyTasks: (id, tasks) => {
    const spec = get().specs[id];
    if (!spec) return;
    set({
      specs: {
        ...get().specs,
        [id]: { ...spec, tasks: { done: tasks.filter((t) => t.done).length, total: tasks.length } }
      }
    });
  },

  refreshSpecs: async () => {
    try {
      const board = await api.getBoard();
      set({
        projectRoot: board.projectRoot,
        specs: Object.fromEntries(board.specs.map((s) => [s.id, s]))
      });
    } catch {
      // Non-fatal: card data will refresh on the next successful load.
    }
  },

  scheduleSave: () => {
    set({ saveState: "dirty" });
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(() => {
      void get().flushSave();
    }, SAVE_DEBOUNCE_MS);
  },

  flushSave: async () => {
    if (saveTimer) {
      clearTimeout(saveTimer);
      saveTimer = null;
    }
    const { nodes, edges, loading, loadError } = get();
    if (loading || loadError) return;
    set({ saveState: "saving", saveError: null });
    try {
      await api.putBoard(flowToBoard(nodes, edges));
      set({ saveState: "saved" });
    } catch (error) {
      set({ saveState: "error", saveError: errorMessage(error) });
    }
  }
}));
