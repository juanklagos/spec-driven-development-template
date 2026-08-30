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
import { ApiError, api, errorMessage } from "./api";
import { PlanError, applyPlan, type ApplyMode } from "./boardplan";
import {
  ARROW,
  EPIC_COLOR,
  GROUP_FRAME,
  IDEA_COLOR,
  NOTE_CARD,
  SPEC_CARD,
  applyGroupMembership,
  boardToFlow,
  flowToBoard,
  styleEdgeForLabel,
  toAbsoluteNodes
} from "./convert";
import { currentLang, translate } from "./i18n";
import type { AgentPresence, AiRequest, AiRequestTarget, AiRequestType } from "./requests";
import { templateToPlan, type BoardPlan, type BoardTemplate } from "./templates";
import type { DrawerTab,
  AppEdge,
  AppNode,
  ChangeKind,
  GateSummary,
  LiveStatus,
  SaveState,
  SpecScore,
  SpecSummary,
  TaskItem,
  ViewMode
} from "./types";

/** ContextStrip filters (spec 030): dim non-matching nodes, never hide them. */
/** Sección a la que saltar y con qué indicación (spec 036, R9). */
export interface AiPrefill {
  specId: string;
  refId: string;
  instruction: string;
}

export interface BoardFilters {
  pending: boolean;
  warnings: boolean;
  drift: boolean;
}

const SAVE_DEBOUNCE_MS = 500;
/** Spec 042 (R5): esperas del reintento del guardado. El cuarto fallo es error. */
const SAVE_RETRY_DELAYS_MS = [250, 1000, 4000];
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

// --- Tasks section preference (spec 022) ----------------------------------
// The tasks list is the longest and most variable section of the drawer, so it
// folds. The choice is one preference for the whole builder, not one per spec:
// it survives opening another spec and reloading the page.
/** localStorage key for "keep the drawer's tasks list folded". */
export const TASKS_COLLAPSED_KEY = "sdd-builder-tasks-collapsed";

/** Unset means expanded: whoever never folded it sees exactly today's drawer. */
export function readTasksCollapsed(): boolean {
  try {
    return localStorage.getItem(TASKS_COLLAPSED_KEY) === "1";
  } catch {
    // Private mode etc. — fall back to the default.
    return false;
  }
}

export function writeTasksCollapsed(collapsed: boolean): void {
  try {
    if (collapsed) localStorage.setItem(TASKS_COLLAPSED_KEY, "1");
    else localStorage.removeItem(TASKS_COLLAPSED_KEY);
  } catch {
    // Non-fatal: the choice simply won't survive a reload.
  }
}

const uid = (): string => crypto.randomUUID().slice(0, 8);

interface BuilderStore {
  loading: boolean;
  loadError: string | null;
  /**
   * Spec 042 (R1/R2). El tablero existe en disco pero no se pudo leer. Es un
   * estado distinto de «no hay servidor»: mientras dure, el lienzo NO guarda,
   * porque guardar aquí es exactamente lo que borraba el trabajo.
   */
  boardUnreadable: { path: string; message: string } | null;
  discardUnreadableBoard: () => Promise<void>;
  projectRoot: string;
  nodes: AppNode[];
  edges: AppEdge[];
  specs: Record<string, SpecSummary>;
  saveState: SaveState;
  saveError: string | null;
  selectedSpecId: string | null;
  /** Consumed once by SpecDrawer when a spec is opened; null means "summary". */
  requestedDrawerTab: DrawerTab | null;
  editingEdgeId: string | null;
  liveStatus: LiveStatus;
  workspaceChanged: boolean;
  /** Canvas vs kanban board view (spec 009, R1). Same data, two projections. */
  viewMode: ViewMode;
  /** Connected SSE clients on this workspace (spec 009, R4); 0 = unknown. */
  presenceCount: number;
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
  /** ⌘K palette (spec 030): in the store so the gate bar and empty state can open it. */
  paletteOpen: boolean;
  /** Bitácora modal (spec 030): opened from the ⋯ menu and from ⌘K. */
  bitacoraOpen: boolean;
  /** "Conectar agente" panel (spec 032): from ⌘K, the empty state and "sin agente". */
  connectOpen: boolean;
  /** Cached spec scores so the card foot can show "C · 68" without opening the drawer. */
  scores: Record<string, SpecScore>;
  /** ContextStrip filters (spec 030): dim non-matching nodes at 0.35 opacity. */
  filters: BoardFilters;
  /** Graph zoom for the ContextStrip meta (from React Flow onMove). */
  zoom: number;
  /** AI request queue (spec 031): every request on disk, oldest first. */
  aiRequests: AiRequest[];
  /** Last time an agent polled the queue; what "agent connected" means (R6). */
  agentPresence: AgentPresence | null;

  load: () => Promise<void>;
  setPaletteOpen: (open: boolean) => void;
  setBitacoraOpen: (open: boolean) => void;
  setConnectOpen: (open: boolean) => void;
  loadScores: () => Promise<void>;
  toggleFilter: (key: keyof BoardFilters) => void;
  setZoom: (zoom: number) => void;
  onNodesChange: (changes: NodeChange<AppNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<AppEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNote: (kind: "idea" | "epic", position: XYPosition) => void;
  addSpecNode: (specId: string, position: XYPosition) => void;
  updateNoteText: (id: string, text: string) => void;
  /** Spec 041: grupos de JSON Canvas — marco titulado que arrastra lo que contiene. */
  addGroup: (position: XYPosition) => void;
  renameGroup: (id: string, label: string) => void;
  resizeGroup: (id: string, width: number, height: number) => void;
  updateEdgeLabel: (id: string, label: string) => void;
  removeEdge: (id: string) => void;
  setEditingEdge: (id: string | null) => void;
  setViewMode: (mode: ViewMode) => void;
  setPresenceCount: (count: number) => void;
  /** Optional tab lets a caller land on the panel that matters (kanban -> approval). */
  selectSpec: (id: string | null, tab?: DrawerTab) => void;
  applyTasks: (id: string, tasks: TaskItem[]) => void;
  refreshSpecs: () => Promise<void>;
  refreshGate: () => Promise<void>;
  pushHistory: () => void;
  undo: () => void;
  redo: () => void;
  /** `append` (asistente, spec 036) añade; `empty-only` (plantillas) exige lienzo virgen. */
  applyBoardPlan: (plan: BoardPlan, mode?: ApplyMode) => Promise<void>;
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
  /**
   * Spec 036 (R9): un hallazgo de la revisión pide abrir el «Ampliar con IA»
   * de SU sección con la instrucción ya escrita. Es una petición de foco, no
   * una escritura: quien escribe sigue siendo el diff que la persona acepta.
   */
  aiPrefill: AiPrefill | null;
  setAiPrefill: (prefill: AiPrefill | null) => void;
  loadAiRequests: () => Promise<void>;
  sendAiRequest: (input: {
    type: AiRequestType;
    target?: AiRequestTarget;
    currentText?: string;
    instruction: string;
  }) => Promise<AiRequest>;
  closeAiRequest: (id: string, resolution: "accepted" | "rejected" | "cancelled") => Promise<void>;
}

export const useBuilderStore = create<BuilderStore>()((set, get) => ({
  loading: true,
  loadError: null,
  boardUnreadable: null,
  projectRoot: "",
  requestedDrawerTab: null,
  nodes: [],
  edges: [],
  specs: {},
  saveState: "saved",
  saveError: null,
  selectedSpecId: null,
  editingEdgeId: null,
  liveStatus: "off",
  workspaceChanged: false,
  viewMode: "canvas",
  presenceCount: 0,
  specsVersion: 0,
  gate: null,
  gateBusy: false,
  gateError: null,
  past: [],
  future: [],
  tourOpen: false,
  galleryOpen: false,
  assistantOpen: false,
  paletteOpen: false,
  bitacoraOpen: false,
  connectOpen: false,
  scores: {},
  filters: { pending: false, warnings: false, drift: false },
  zoom: 1,
  aiRequests: [],
  agentPresence: null,
  aiPrefill: null,

  setPaletteOpen: (open) => set({ paletteOpen: open }),

  setBitacoraOpen: (open) => set({ bitacoraOpen: open }),

  setConnectOpen: (open) => set({ connectOpen: open }),

  // Batch-fetch every spec's score (spec 030, R4). Failures are silent: the
  // card foot simply shows nothing until the next refresh succeeds.
  loadScores: async () => {
    const ids = Object.keys(get().specs);
    if (ids.length === 0) return;
    const settled = await Promise.allSettled(ids.map((id) => api.getSpecScore(id)));
    const scores: Record<string, SpecScore> = { ...get().scores };
    settled.forEach((result, i) => {
      if (result.status === "fulfilled") scores[ids[i]] = result.value;
    });
    set({ scores });
  },

  toggleFilter: (key) => set({ filters: { ...get().filters, [key]: !get().filters[key] } }),

  setZoom: (zoom) => set({ zoom }),

  load: async () => {
    set({ loading: true, loadError: null, boardUnreadable: null });
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
      void get().loadScores();
      void get().loadAiRequests();
    } catch (error) {
      // Spec 042: el servidor SÍ respondió, y lo que dijo es que el archivo del
      // tablero no se puede leer. Pintarlo como «no encuentro el servidor»
      // mandaba a la persona a reiniciar algo que estaba funcionando.
      if (error instanceof ApiError && error.code === "BOARD_UNREADABLE") {
        set({
          loading: false,
          boardUnreadable: { path: error.detail ?? "specs/board.canvas", message: error.message }
        });
        return;
      }
      set({ loading: false, loadError: errorMessage(error) });
    }
  },

  // Segunda salida del aviso (spec 042, escenario 1). El servidor conserva el
  // archivo ilegible como `board.canvas.bak` antes de sustituirlo.
  discardUnreadableBoard: async () => {
    try {
      await api.resetBoard();
      set({ boardUnreadable: null });
      await get().load();
    } catch (error) {
      set({ loadError: errorMessage(error) });
    }
  },

  // --- AI request queue (spec 031) -----------------------------------------

  setAiPrefill: (aiPrefill) => set({ aiPrefill }),

  loadAiRequests: async () => {
    try {
      const { requests, agent } = await api.listAiRequests();
      set({ aiRequests: requests, agentPresence: agent });
    } catch {
      // Non-fatal: the next SSE `request` event (or reload) will retry.
    }
  },

  sendAiRequest: async (input) => {
    const created = await api.createAiRequest(input);
    // Optimistic append; the SSE echo will reconcile with the disk state.
    set({ aiRequests: [...get().aiRequests, created] });
    return created;
  },

  closeAiRequest: async (id, resolution) => {
    const resolved = await api.resolveAiRequest(id, resolution);
    set({ aiRequests: get().aiRequests.map((r) => (r.id === id ? resolved : r)) });
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
    // Spec 041. Membership is geometric, so it is re-derived whenever geometry
    // settles. Removals dissolve it FIRST: a child whose frame disappears would
    // otherwise keep a position relative to a node that no longer exists, and
    // jump across the board. That is also what makes "deleting a group frees
    // its cards" true without a special case.
    const dragEnded = changes.some((c) => c.type === "position" && c.dragging === false);
    const base = removing ? toAbsoluteNodes(get().nodes) : get().nodes;
    const applied = applyNodeChanges(changes, base);
    set({ nodes: removing || dragEnded ? applyGroupMembership(toAbsoluteNodes(applied)) : applied });
    const persistent = removing || dragEnded;
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
    const edge: AppEdge = styleEdgeForLabel({
      id: `e-${uid()}`,
      source: connection.source,
      target: connection.target,
      type: "labeled",
      data: { label: "" },
      markerEnd: ARROW
    });
    // New connections immediately ask for their purpose (spec 010, R3): the
    // freshly created edge opens the picker; "related" stays the default.
    set({ edges: addEdge(edge, get().edges), editingEdgeId: edge.id });
    get().scheduleSave();
  },

  addNote: (kind, position) => {
    get().pushHistory();
    const node: AppNode = {
      id: `note-${uid()}`,
      type: "note",
      position,
      data: {
        text: kind === "idea" ? translate("note.idea.new") : translate("note.epic.new"),
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
        { id: specId, type: "spec", deletable: false, position, data: { specId, file: `specs/${specId}/spec.md`, ...SPEC_CARD } }
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

  addGroup: (position) => {
    get().pushHistory();
    const node: AppNode = {
      id: `group-${uid()}`,
      type: "group",
      position,
      dragHandle: ".group-handle",
      zIndex: -1,
      width: GROUP_FRAME.width,
      height: GROUP_FRAME.height,
      data: { label: translate("group.new"), ...GROUP_FRAME }
    };
    // Whatever the new frame lands on top of becomes its child right away:
    // membership is geometry (spec 041), so it is derived, never declared.
    set({ nodes: applyGroupMembership(toAbsoluteNodes([...get().nodes, node])) });
    get().scheduleSave();
  },

  renameGroup: (id, label) => {
    get().pushHistory();
    set({
      nodes: get().nodes.map((n) =>
        n.id === id && n.type === "group" ? { ...n, data: { ...n.data, label } } : n
      )
    });
    get().scheduleSave();
  },

  resizeGroup: (id, width, height) => {
    get().pushHistory();
    const resized = get().nodes.map((n) =>
      n.id === id && n.type === "group"
        ? { ...n, width, height, data: { ...n.data, width, height } }
        : n
    );
    // Un marco más grande adopta lo que ahora cae dentro, y uno más pequeño
    // suelta lo que se quedó fuera: la pertenencia es geometría (spec 041).
    set({ nodes: applyGroupMembership(toAbsoluteNodes(resized)) });
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
      edges: get().edges.map((e) =>
        // Typed labels re-derive the edge's stroke/arrow color (spec 009, R2).
        e.id === id ? styleEdgeForLabel({ ...e, data: { ...e.data, label } }) : e
      ),
      editingEdgeId: null
    });
    get().scheduleSave();
  },

  // Remove one connection (relations panel, spec 010, R3).
  removeEdge: (id) => {
    if (!get().edges.some((e) => e.id === id)) return;
    get().pushHistory();
    set({
      edges: get().edges.filter((e) => e.id !== id),
      editingEdgeId: get().editingEdgeId === id ? null : get().editingEdgeId
    });
    get().scheduleSave();
  },

  setEditingEdge: (id) => set({ editingEdgeId: id }),

  setViewMode: (mode) => set({ viewMode: mode }),

  setPresenceCount: (count) => set({ presenceCount: count }),

  selectSpec: (id, tab) => set({ selectedSpecId: id, requestedDrawerTab: tab ?? null }),

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
  applyBoardPlan: async (plan, mode = "append") => {
    // Tras un PUT propio, la ventana de eco evita que el watcher nos devuelva
    // nuestro propio cambio como si viniera de fuera.
    const settle = async (): Promise<void> => {
      lastBoardPutAt = Date.now();
      await get().load();
    };
    try {
      await applyPlan(api, plan, { mode, runId: uid() });
      await settle();
    } catch (error) {
      if (!(error instanceof PlanError)) throw error;
      if (error.code === "board-not-empty") {
        // Ni una escritura: no hay nada que asentar.
        throw new Error(translate("error.templatesNonEmpty"));
      }
      // R4: lo que sí se creó ya está en disco, así que la pantalla debe
      // reflejarlo antes de contar lo que falló. Con cero creadas no se
      // escribió lienzo alguno, y el mensaje tiene que decir eso y no otra cosa.
      const name = error.failedName ?? "?";
      if (error.createdCount === 0) throw new Error(translate("error.planPartial.none", { name }));
      await settle();
      throw new Error(
        error.createdCount === 1
          ? translate("error.planPartial.one", { name })
          : translate("error.planPartial.many", { n: error.createdCount, name })
      );
    }
  },

  applyTemplate: async (template) => get().applyBoardPlan(templateToPlan(template, currentLang()), "empty-only"),

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
    // Spec 042 (R2): con un tablero que no se pudo leer, cualquier escritura
    // sustituye el archivo del usuario por lo que el lienzo tenga en memoria.
    // Ésa es la ruta de pérdida entera, y aquí es donde se corta.
    if (get().boardUnreadable) return;
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
    const { nodes, edges, loading, loadError, boardUnreadable } = get();
    if (loading || loadError || boardUnreadable) return;
    set({ saveState: "saving", saveError: null });
    const canvas = flowToBoard(nodes, edges);
    // Spec 042 (R5). Un corte de red de un segundo dejaba el guardado en error
    // y ahí se quedaba hasta el siguiente gesto de la persona. Tres reintentos
    // con espera creciente cubren el caso normal —el servidor reiniciándose—
    // sin convertir un fallo real en una espera indefinida.
    for (let attempt = 0; ; attempt++) {
      try {
        await api.putBoard(canvas);
        lastBoardPutAt = Date.now();
        set({ saveState: "saved" });
        return;
      } catch (error) {
        if (attempt >= SAVE_RETRY_DELAYS_MS.length) {
          set({ saveState: "error", saveError: errorMessage(error) });
          return;
        }
        await new Promise((resolve) => setTimeout(resolve, SAVE_RETRY_DELAYS_MS[attempt]));
      }
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

    if (kind === "request") {
      // The AI queue changed on disk (new proposal, claim, presence touch).
      // No echo guard needed: re-reading the queue is idempotent for the UI.
      await get().loadAiRequests();
      return;
    }

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
          // sdd-note-spec-not-deletable: a spec card stands for a directory on
          // disk. Pressing Delete used to remove the node, and then THIS very
          // block put it back at the bottom of the board on the next live
          // event — the card vanished and reappeared somewhere else, which
          // reads as the tool corrupting itself. Notes stay deletable; they
          // exist only on the canvas.
          deletable: false,
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
        // The gate depends on the same documents: refresh the semaphore too,
        // and the scores — they read the same files (spec 030).
        void get().refreshGate();
        void get().loadScores();
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
    // Spec 042 (R5): `error` entra en la guarda. Antes se colaba, y la recarga
    // se llevaba por delante las tarjetas, el historial de deshacer y el propio
    // banner rojo que denunciaba que nada de eso estaba en disco.
    if (saveState === "dirty" || saveState === "saving" || saveState === "error" || dragActive) {
      return;
    }
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
