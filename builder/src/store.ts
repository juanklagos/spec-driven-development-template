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
import { templateToPlan, type BoardPlan, type BoardTemplate } from "./templates";
import type {
  AppEdge,
  AppNode,
  BoardCanvas,
  CanvasEdge,
  CanvasNode,
  ChangeKind,
  GateSummary,
  LiveStatus,
  SaveState,
  SpecSummary,
  TaskItem
} from "./types";

const SAVE_DEBOUNCE_MS = 500;
let saveTimer: ReturnType<typeof setTimeout> | null = null;

// --- Live sync bookkeeping (module-level: not render state) ---------------
/** True while the user is dragging a node; external board changes are held off. */
let dragActive = false;
/**
 * Echo guard: our own PUT /api/board makes the server watcher emit a
 * `change kind=board` right back at us. Any board change arriving within
 * this window of our last successful PUT is our own echo and is ignored.
 */
const BOARD_ECHO_WINDOW_MS = 1000;
let lastBoardPutAt = 0;

// --- Undo/redo (spec 007, R6) ---------------------------------------------
const HISTORY_LIMIT = 50;
interface Snapshot {
  nodes: AppNode[];
  edges: AppEdge[];
}

/** localStorage key for "don't show the welcome tour again". */
export const TOUR_DISMISSED_KEY = "sdd-builder-tour-dismissed";
/** The tour auto-offers only once per page load (reloads re-trigger `load`). */
let tourOffered = false;

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
  liveStatus: LiveStatus;
  workspaceChanged: boolean;
  /** Bumped when spec documents change on disk so open views (drawer) re-sync. */
  specsVersion: number;
  /** Gate semaphore (GET /api/gate); null until the first fetch resolves. */
  gate: GateSummary | null;
  gateBusy: boolean;
  gateError: string | null;
  /** Canvas history for undo/redo (bounded snapshots of nodes+edges). */
  past: Snapshot[];
  future: Snapshot[];
  /** UI: welcome tour + template gallery + ✨ assistant visibility. */
  tourOpen: boolean;
  galleryOpen: boolean;
  assistantOpen: boolean;

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
  refreshGate: () => Promise<void>;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  applyBoardPlan: (plan: BoardPlan) => Promise<void>;
  applyTemplate: (template: BoardTemplate) => Promise<void>;
  openTour: () => void;
  closeTour: (dontShowAgain: boolean) => void;
  maybeStartTour: () => void;
  setGalleryOpen: (open: boolean) => void;
  setAssistantOpen: (open: boolean) => void;
  scheduleSave: () => void;
  flushSave: () => Promise<void>;
  setLiveStatus: (status: LiveStatus) => void;
  handleHello: (serverRoot: string) => void;
  handleLiveChange: (kind: ChangeKind) => Promise<void>;
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
  liveStatus: "off",
  workspaceChanged: false,
  specsVersion: 0,
  gate: null,
  gateBusy: false,
  gateError: null,
  past: [],
  future: [],
  tourOpen: false,
  galleryOpen: false,
  assistantOpen: false,

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
        saveError: null,
        past: [],
        future: []
      });
      void get().refreshGate();
    } catch (error) {
      set({ loading: false, loadError: errorMessage(error) });
    }
  },

  onNodesChange: (changes) => {
    // Record history before a drag starts or a node is removed, so undo
    // restores the pre-drag position / the removed card.
    const dragStarting =
      !dragActive && changes.some((c) => c.type === "position" && c.dragging === true);
    const removing = changes.some((c) => c.type === "remove");
    if (dragStarting || removing) get().pushHistory();
    for (const c of changes) {
      if (c.type === "position" && typeof c.dragging === "boolean") dragActive = c.dragging;
    }
    set({ nodes: applyNodeChanges(changes, get().nodes) });
    const persistent = changes.some(
      (c) => c.type === "remove" || (c.type === "position" && c.dragging === false)
    );
    if (persistent) get().scheduleSave();
  },

  onEdgesChange: (changes) => {
    if (changes.some((c) => c.type === "remove")) get().pushHistory();
    set({ edges: applyEdgeChanges(changes, get().edges) });
    if (changes.some((c) => c.type === "remove")) get().scheduleSave();
  },

  onConnect: (connection) => {
    if (!connection.source || !connection.target) return;
    if (connection.source === connection.target) return;
    get().pushHistory();
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
    get().pushHistory();
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
    get().pushHistory();
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
    get().pushHistory();
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === "note" ? { ...n, data: { ...n.data, text } } : n
      )
    });
    get().scheduleSave();
  },

  updateEdgeLabel: (id, label) => {
    const current = get().edges.find((e) => e.id === id);
    if (!current || (current.data?.label ?? "") === label) {
      set({ editingEdgeId: null });
      return;
    }
    get().pushHistory();
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

  refreshGate: async () => {
    if (get().gateBusy) return;
    set({ gateBusy: true, gateError: null });
    try {
      const gate = await api.getGate();
      set({ gate, gateBusy: false });
    } catch (error) {
      // Keep the last known gate; surface the failure in the chip tooltip.
      set({ gateBusy: false, gateError: errorMessage(error) });
    }
  },

  pushHistory: () => {
    const { nodes, edges, past } = get();
    set({ past: [...past, { nodes, edges }].slice(-HISTORY_LIMIT), future: [] });
  },

  undo: () => {
    const { past, future, nodes, edges } = get();
    const previous = past[past.length - 1];
    if (!previous) return;
    set({
      past: past.slice(0, -1),
      future: [...future, { nodes, edges }].slice(-HISTORY_LIMIT),
      nodes: previous.nodes,
      edges: previous.edges
    });
    get().scheduleSave();
  },

  redo: () => {
    const { past, future, nodes, edges } = get();
    const next = future[future.length - 1];
    if (!next) return;
    set({
      future: future.slice(0, -1),
      past: [...past, { nodes, edges }].slice(-HISTORY_LIMIT),
      nodes: next.nodes,
      edges: next.edges
    });
    get().scheduleSave();
  },

  // Apply a board plan (template gallery or ✨ assistant draft): create every
  // spec for real (POST /api/spec, in order), then persist a pre-laid-out
  // canvas (PUT /api/board) and reload. Guarded against non-empty workspaces
  // using the server's spec list as the truth.
  applyBoardPlan: async (plan) => {
    const board = await api.getBoard();
    if (board.specs.length > 0) {
      throw new Error(
        "Este workspace ya tiene specs; las plantillas solo se aplican en un workspace vacío. / " +
          "This workspace already has specs; templates only apply to an empty workspace."
      );
    }

    const idByKey = new Map<string, string>();
    for (const spec of plan.specs) {
      const created = await api.createSpec(spec.name);
      idByKey.set(spec.key, created.specId);
    }
    const noteIdByKey = new Map(plan.notes.map((note) => [note.key, `note-${plan.id}-${note.key}`]));
    const resolve = (key: string): string | undefined => idByKey.get(key) ?? noteIdByKey.get(key);

    const nodes: CanvasNode[] = [
      ...plan.notes.map(
        (note): CanvasNode => ({
          id: noteIdByKey.get(note.key) as string,
          type: "text",
          text: note.text,
          color: note.color,
          x: note.x,
          y: note.y,
          width: note.width,
          height: note.height
        })
      ),
      ...plan.specs.map(
        (spec): CanvasNode => ({
          id: idByKey.get(spec.key) as string,
          type: "file",
          file: `specs/${idByKey.get(spec.key)}/spec.md`,
          x: spec.x,
          y: spec.y,
          width: SPEC_CARD.width,
          height: SPEC_CARD.height
        })
      )
    ];
    const edges: CanvasEdge[] = plan.edges.flatMap((edge): CanvasEdge[] => {
      const fromNode = resolve(edge.from);
      const toNode = resolve(edge.to);
      if (!fromNode || !toNode) return [];
      return [
        {
          id: `edge-${plan.id}-${edge.from}-${edge.to}`,
          fromNode,
          toNode,
          fromSide: "right",
          toSide: "left",
          ...(edge.label ? { label: edge.label } : {})
        }
      ];
    });

    const canvas: BoardCanvas = { nodes, edges };
    await api.putBoard(canvas);
    lastBoardPutAt = Date.now();
    await get().load();
  },

  applyTemplate: async (template) => get().applyBoardPlan(templateToPlan(template)),

  openTour: () => set({ tourOpen: true }),

  closeTour: (dontShowAgain) => {
    if (dontShowAgain) {
      try {
        localStorage.setItem(TOUR_DISMISSED_KEY, "1");
      } catch {
        // Private mode etc.: the tour will simply offer itself again.
      }
    }
    set({ tourOpen: false });
  },

  maybeStartTour: () => {
    if (tourOffered) return;
    tourOffered = true;
    try {
      if (localStorage.getItem(TOUR_DISMISSED_KEY) === "1") return;
    } catch {
      return;
    }
    set({ tourOpen: true });
  },

  setGalleryOpen: (open) => set({ galleryOpen: open }),

  setAssistantOpen: (open) => set({ assistantOpen: open }),

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
      lastBoardPutAt = Date.now();
      set({ saveState: "saved" });
    } catch (error) {
      set({ saveState: "error", saveError: errorMessage(error) });
    }
  },

  setLiveStatus: (status) => set({ liveStatus: status }),

  // SSE `hello`: the server announces its workspace. If it differs from the
  // one this page loaded (server restarted with another SDD_PROJECT_ROOT),
  // the canvas on screen no longer matches the disk — ask for a reload.
  handleHello: (serverRoot) => {
    const current = get().projectRoot;
    if (current && serverRoot && current !== serverRoot) {
      set({ workspaceChanged: true });
    }
  },

  // SSE `change`: something on disk changed under specs/.
  handleLiveChange: async (kind) => {
    if (get().loading || get().loadError) return;

    if (kind === "specs") {
      // Spec documents changed on disk (tasks.md, spec.md, new bundles...).
      // Re-fetch and reconcile by stable spec id: update card status/progress,
      // append cards for brand-new specs — but NEVER touch existing node
      // positions, which may hold unsaved local moves.
      try {
        const board = await api.getBoard();
        const specs = Object.fromEntries(board.specs.map((s) => [s.id, s]));
        const nodes = get().nodes;
        const known = new Set(nodes.map((n) => n.id));
        const fresh = board.specs.filter((s) => !known.has(s.id));
        let maxBottom = 0;
        for (const n of nodes) maxBottom = Math.max(maxBottom, n.position.y + (n.data.height ?? 0));
        const appended: AppNode[] = fresh.map((spec, i) => ({
          id: spec.id,
          type: "spec",
          position: {
            x: (i % 3) * (SPEC_CARD.width + 40),
            y: (nodes.length > 0 ? maxBottom + 60 : 0) + Math.floor(i / 3) * (SPEC_CARD.height + 40)
          },
          data: { specId: spec.id, file: `specs/${spec.id}/spec.md`, ...SPEC_CARD }
        }));
        set({
          specs,
          ...(appended.length > 0 ? { nodes: [...nodes, ...appended] } : {}),
          specsVersion: get().specsVersion + 1
        });
        // The gate depends on the same documents: refresh the semaphore too.
        void get().refreshGate();
      } catch {
        // Transient fetch failure: the next change event will retry.
      }
      return;
    }

    // kind === "board": the canvas file itself changed.
    // 1) Echo guard: skip changes right after our own PUT (see BOARD_ECHO_WINDOW_MS).
    if (Date.now() - lastBoardPutAt < BOARD_ECHO_WINDOW_MS) return;
    // 2) Last-writer-wins: if there are unsaved local changes (save debounce
    //    pending, PUT in flight, or an active drag), IGNORE the external board
    //    change — our upcoming PUT will overwrite board.canvas anyway, and
    //    applying the stale disk state here would yank cards out from under
    //    the user. The .md files are never at risk (they are the source of
    //    truth and travel on kind=specs).
    const { saveState } = get();
    if (saveState === "dirty" || saveState === "saving" || dragActive) return;
    try {
      const board = await api.getBoard();
      const { nodes, edges } = boardToFlow(board.canvas, board.specs);
      set({
        projectRoot: board.projectRoot,
        specs: Object.fromEntries(board.specs.map((s) => [s.id, s])),
        nodes,
        edges,
        saveState: "saved",
        saveError: null,
        past: [],
        future: []
      });
    } catch {
      // Transient fetch failure: the next change event will retry.
    }
  }
}));
