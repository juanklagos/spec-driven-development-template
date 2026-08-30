// @vitest-environment jsdom
//
// Spec 042, fase 1 (R3). `store.ts` es el único módulo que llama a
// `api.putBoard`, es decir, el único que puede sobrescribir `specs/board.canvas`
// — y hasta esta spec no tenía ninguna prueba. La spec 024 ya lo había señalado
// («builder/src/store.ts (599 líneas) orquesta el estado y las llamadas al
// API», 024/spec.md:24) sin llegar a cubrirlo; desde entonces creció a 742.
//
// Esta suite fija el comportamiento ACTUAL, defectos incluidos. El caso del
// estado `error` documenta a propósito una pérdida de trabajo real: la fase 5
// de esta misma spec lo invierte, y entonces esta prueba se reescribe. Está
// marcado abajo para que nadie lo lea como comportamiento deseado.

import { beforeEach, describe, expect, it, vi } from "vitest";

import type { BoardResponse } from "./types";

const putBoard = vi.fn(async () => ({ ok: true }));
const getBoard = vi.fn<[], Promise<BoardResponse>>();

vi.mock("./api", () => ({
  api: {
    getBoard: () => getBoard(),
    putBoard: (canvas: unknown) => putBoard(canvas as never),
    getGate: vi.fn(async () => ({ ok: true, verdict: "open" })),
    getSpecScore: vi.fn(async () => ({ specId: "x", score: 0, grade: "D", notes: [] })),
    listAiRequests: vi.fn(async () => ({ requests: [], agent: null }))
  },
  errorMessage: (error: unknown) => (error instanceof Error ? error.message : String(error))
}));

const { useBuilderStore } = await import("./store");
const { GROUP_FRAME, NOTE_CARD } = await import("./convert");

/** A board with one frame and one loose note, in absolute coordinates. */
function frameAndNote() {
  return [
    {
      id: "group-1",
      type: "group" as const,
      position: { x: 50, y: 50 },
      width: GROUP_FRAME.width,
      height: GROUP_FRAME.height,
      data: { label: "Capa 0", ...GROUP_FRAME }
    },
    {
      id: "note-1",
      type: "note" as const,
      position: { x: 400, y: 400 },
      data: { text: "suelta", ...NOTE_CARD }
    }
  ];
}

function emptyBoard(): BoardResponse {
  return { projectRoot: "/tmp/p", canvas: { nodes: [], edges: [] }, specs: [] };
}

beforeEach(() => {
  vi.clearAllMocks();
  putBoard.mockResolvedValue({ ok: true });
  vi.useFakeTimers();
  getBoard.mockResolvedValue(emptyBoard());
  useBuilderStore.setState({
    loading: false,
    loadError: null,
    nodes: [],
    edges: [],
    specs: {},
    saveState: "saved",
    saveError: null,
    boardUnreadable: null,
    past: [],
    future: []
  });
  // `dragActive` es estado de módulo: cerrar cualquier arrastre abierto por una
  // prueba anterior, o `dragStarting` no volvería a disparar el historial.
  useBuilderStore.getState().onNodesChange([]);
});

describe("orden de coordenadas al cambiar nodos", () => {
  it("al terminar un arrastre deriva la pertenencia y deja la posición relativa al marco", () => {
    useBuilderStore.setState({ nodes: frameAndNote() as never });

    useBuilderStore.getState().onNodesChange([
      { id: "note-1", type: "position", dragging: false, position: { x: 150, y: 150 } }
    ]);

    const note = useBuilderStore.getState().nodes.find((n) => n.id === "note-1")!;
    // El marco está en (50,50): dentro de él, la posición se guarda relativa.
    expect(note.parentId).toBe("group-1");
    expect(note.position).toEqual({ x: 100, y: 100 });
  });

  it("al borrar un marco libera a sus hijos, que conservan su posición absoluta", () => {
    // La nota es hija: posición relativa (100,100) sobre un marco en (50,50),
    // es decir (150,150) absolutas.
    useBuilderStore.setState({
      nodes: [
        frameAndNote()[0],
        {
          id: "note-1",
          type: "note",
          parentId: "group-1",
          position: { x: 100, y: 100 },
          data: { text: "dentro", ...NOTE_CARD }
        }
      ] as never
    });

    useBuilderStore.getState().onNodesChange([{ id: "group-1", type: "remove" }]);

    const nodes = useBuilderStore.getState().nodes;
    expect(nodes.some((n) => n.id === "group-1")).toBe(false);
    const note = nodes.find((n) => n.id === "note-1")!;
    expect(note.parentId).toBeUndefined();
    // Si `applyNodeChanges` corriera antes de `toAbsoluteNodes`, la nota se
    // quedaría en (100,100) y saltaría por el tablero.
    expect(note.position).toEqual({ x: 150, y: 150 });
  });
});

describe("guardado", () => {
  it("agrupa varias mutaciones seguidas en un solo PUT", async () => {
    const store = useBuilderStore.getState();
    store.addNote("idea", { x: 0, y: 0 });
    store.addNote("epic", { x: 10, y: 10 });
    store.addNote("idea", { x: 20, y: 20 });

    expect(useBuilderStore.getState().saveState).toBe("dirty");
    expect(putBoard).not.toHaveBeenCalled();

    await vi.advanceTimersByTimeAsync(600);

    expect(putBoard).toHaveBeenCalledTimes(1);
    expect(useBuilderStore.getState().saveState).toBe("saved");
  });
});

describe("reconciliación con el disco", () => {
  it("descarta el eco de nuestro propio PUT y acepta el cambio ajeno posterior", async () => {
    useBuilderStore.setState({ nodes: frameAndNote() as never });
    await useBuilderStore.getState().flushSave();
    expect(putBoard).toHaveBeenCalledTimes(1);

    // Eco: llega dentro de la ventana de 1000 ms. No se relee nada.
    await useBuilderStore.getState().handleLiveChange("board");
    expect(getBoard).not.toHaveBeenCalled();
    expect(useBuilderStore.getState().nodes).toHaveLength(2);

    // Pasada la ventana, el mismo evento sí se atiende.
    vi.advanceTimersByTime(1500);
    await useBuilderStore.getState().handleLiveChange("board");
    expect(getBoard).toHaveBeenCalledTimes(1);
    expect(useBuilderStore.getState().nodes).toHaveLength(0);
  });

  it("ignora el cambio externo en dirty, saving y error", async () => {
    for (const state of ["dirty", "saving"] as const) {
      useBuilderStore.setState({ nodes: frameAndNote() as never, saveState: state });
      vi.advanceTimersByTime(1500);
      await useBuilderStore.getState().handleLiveChange("board");
      expect(getBoard, `estado ${state}`).not.toHaveBeenCalled();
      expect(useBuilderStore.getState().nodes, `estado ${state}`).toHaveLength(2);
    }

    // Spec 042 (R5), fase 5: `error` es el único estado en el que consta que el
    // trabajo NO está en disco, así que ahora también corta. Antes se colaba, y
    // la recarga borraba a la vez las tarjetas, el historial y el propio banner
    // que lo denunciaba. Esta prueba es la inversión de la de la fase 1.
    useBuilderStore.setState({
      nodes: frameAndNote() as never,
      saveState: "error",
      saveError: "sin conexión",
      past: [{ nodes: [], edges: [] }]
    });
    vi.advanceTimersByTime(1500);
    await useBuilderStore.getState().handleLiveChange("board");

    expect(getBoard).not.toHaveBeenCalled();
    expect(useBuilderStore.getState().nodes).toHaveLength(2);
    expect(useBuilderStore.getState().past).toHaveLength(1);
    expect(useBuilderStore.getState().saveState).toBe("error");
    expect(useBuilderStore.getState().saveError).toBe("sin conexión");
  });
});

describe("reintento del guardado (spec 042, R5)", () => {
  it("reintenta a 250 ms, 1 s y 4 s, y al cuarto fallo declara el error", async () => {
    putBoard.mockRejectedValue(new Error("sin conexión"));
    useBuilderStore.setState({ nodes: frameAndNote() as never });

    const done = useBuilderStore.getState().flushSave();

    await vi.advanceTimersByTimeAsync(0);
    expect(putBoard).toHaveBeenCalledTimes(1);
    expect(useBuilderStore.getState().saveState).toBe("saving");

    await vi.advanceTimersByTimeAsync(250);
    expect(putBoard).toHaveBeenCalledTimes(2);

    await vi.advanceTimersByTimeAsync(1000);
    expect(putBoard).toHaveBeenCalledTimes(3);

    await vi.advanceTimersByTimeAsync(4000);
    await done;
    expect(putBoard).toHaveBeenCalledTimes(4);
    expect(useBuilderStore.getState().saveState).toBe("error");
    expect(useBuilderStore.getState().saveError).toContain("sin conexión");
  });

  it("un reintento que sale bien deja el guardado en saved", async () => {
    putBoard.mockRejectedValueOnce(new Error("corte")).mockResolvedValue({ ok: true });
    useBuilderStore.setState({ nodes: frameAndNote() as never });

    const done = useBuilderStore.getState().flushSave();
    await vi.advanceTimersByTimeAsync(300);
    await done;

    expect(putBoard).toHaveBeenCalledTimes(2);
    expect(useBuilderStore.getState().saveState).toBe("saved");
  });
});

describe("tablero ilegible (spec 042, R2)", () => {
  it("con el tablero marcado como no fiable, ninguna mutación llega a putBoard", async () => {
    useBuilderStore.setState({
      nodes: frameAndNote() as never,
      boardUnreadable: { path: "specs/board.canvas", message: "roto" }
    });

    const store = useBuilderStore.getState();
    store.addNote("idea", { x: 0, y: 0 });
    store.onNodesChange([{ id: "note-1", type: "remove" }]);
    await vi.advanceTimersByTimeAsync(1000);
    await store.flushSave();

    // Ésta es la ruta de pérdida entera: mover una tarjeta «para investigar»
    // sobre un tablero que el builder no entendió escribía la cuadrícula por
    // defecto encima del archivo del usuario.
    expect(putBoard).not.toHaveBeenCalled();
    expect(useBuilderStore.getState().saveState).not.toBe("dirty");
  });
});

describe("deshacer y rehacer", () => {
  it("deshacer devuelve la posición previa al arrastre, y rehacer la vuelve a aplicar", () => {
    useBuilderStore.setState({ nodes: frameAndNote() as never });
    const store = useBuilderStore.getState();

    store.onNodesChange([
      { id: "note-1", type: "position", dragging: true, position: { x: 401, y: 401 } }
    ]);
    store.onNodesChange([
      { id: "note-1", type: "position", dragging: false, position: { x: 800, y: 800 } }
    ]);
    expect(useBuilderStore.getState().nodes.find((n) => n.id === "note-1")!.position).toEqual({
      x: 800,
      y: 800
    });

    useBuilderStore.getState().undo();
    expect(useBuilderStore.getState().nodes.find((n) => n.id === "note-1")!.position).toEqual({
      x: 400,
      y: 400
    });

    useBuilderStore.getState().redo();
    expect(useBuilderStore.getState().nodes.find((n) => n.id === "note-1")!.position).toEqual({
      x: 800,
      y: 800
    });
  });
});
