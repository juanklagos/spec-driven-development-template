// Spec 036, T1/T3 (R2, R4). El plan se aplica contra un PUERTO, no contra
// `fetch` ni contra el store: por eso esto se prueba sin servidor y sin React.

import { describe, expect, it, vi } from "vitest";
import { PlanError, applyPlan, appendToCanvas, planToCanvas, type BoardPort } from "./boardplan";
import { intersectionArea } from "./layout";
import type { BoardPlan } from "./templates";
import type { BoardCanvas, BoardResponse, CanvasNode, SpecSummary } from "./types";

const PLAN: BoardPlan = {
  id: "assistant",
  notes: [{ key: "idea", text: "Idea", color: "#eab308", x: 40, y: -220, width: 260, height: 120 }],
  specs: [
    { key: "a", name: "primera", x: 0, y: 220 },
    { key: "b", name: "segunda", x: 340, y: 220 }
  ],
  edges: [{ from: "idea", to: "a", label: "contiene" }]
};

const EXISTING: BoardCanvas = {
  nodes: [
    { id: "001-ya-estaba", type: "file", file: "specs/001-ya-estaba/spec.md", x: -554, y: -272, width: 300, height: 136 },
    { id: "note-vieja", type: "text", text: "Idea vieja", color: "#eab308", x: -540, y: -487, width: 260, height: 120 }
  ],
  edges: [{ id: "edge-vieja", fromNode: "note-vieja", toNode: "001-ya-estaba" }]
};

const summary = (id: string): SpecSummary => ({
  title: id,
  id,
  dir: `specs/${id}`,
  status: "Pendiente",
  tasks: { done: 0, total: 0 },
  tone: "pending"
});

function port(overrides: Partial<BoardPort> & { specs?: SpecSummary[]; canvas?: BoardCanvas } = {}): {
  port: BoardPort;
  put: ReturnType<typeof vi.fn>;
  created: string[];
} {
  const created: string[] = [];
  const put = vi.fn(async () => ({ ok: true }));
  const board: BoardResponse = {
    projectRoot: "/tmp/ws",
    canvas: overrides.canvas ?? { nodes: [], edges: [] },
    specs: overrides.specs ?? []
  };
  return {
    created,
    put,
    port: {
      getBoard: async () => board,
      createSpec: async (name: string) => {
        created.push(name);
        return { specId: `00${created.length}-${name}`, dir: `specs/00${created.length}-${name}` };
      },
      putBoard: put,
      ...overrides
    } as BoardPort
  };
}

describe("planToCanvas", () => {
  it("turns notes, specs and edges into canvas items", () => {
    const canvas = planToCanvas(PLAN, new Map([["a", "001-primera"], ["b", "002-segunda"]]), "run1");
    expect(canvas.nodes.map((n) => n.id)).toEqual(["note-run1-idea", "001-primera", "002-segunda"]);
    expect(canvas.edges).toHaveLength(1);
    expect(canvas.edges[0]).toMatchObject({ fromNode: "note-run1-idea", toNode: "001-primera", label: "contiene" });
  });

  it("drops edges whose ends were not created", () => {
    const canvas = planToCanvas(PLAN, new Map([["b", "002-segunda"]]), "run1");
    expect(canvas.edges).toEqual([]);
  });

  it("two runs of the same plan never share a node id", () => {
    const first = planToCanvas(PLAN, new Map([["a", "001-x"]]), "run1");
    const second = planToCanvas(PLAN, new Map([["a", "003-y"]]), "run2");
    const ids = new Set(first.nodes.map((n) => n.id));
    expect(second.nodes.filter((n) => ids.has(n.id)).map((n) => n.id)).toEqual([]);
  });
});

describe("appendToCanvas", () => {
  it("R2: keeps every previous node and edge, id by id", () => {
    const incoming = planToCanvas(PLAN, new Map([["a", "002-primera"]]), "run1");
    const merged = appendToCanvas(EXISTING, incoming);

    for (const node of EXISTING.nodes) {
      expect(merged.nodes).toContainEqual(node); // misma posición, mismo todo
    }
    expect(merged.edges).toEqual(expect.arrayContaining(EXISTING.edges));
    expect(merged.nodes).toHaveLength(EXISTING.nodes.length + incoming.nodes.length);
  });

  it("R3: nothing new overlaps anything old", () => {
    const incoming = planToCanvas(PLAN, new Map([["a", "002-primera"], ["b", "003-segunda"]]), "run1");
    const merged = appendToCanvas(EXISTING, incoming);
    const old = new Set(EXISTING.nodes.map((n) => n.id));
    const added = merged.nodes.filter((n: CanvasNode) => !old.has(n.id));

    for (const a of EXISTING.nodes) {
      for (const b of added) expect(intersectionArea(a, b)).toBe(0);
    }
  });
});

describe("applyPlan", () => {
  it("append: creates every spec and merges the canvas", async () => {
    const { port: p, put, created } = port({ canvas: EXISTING, specs: [summary("001-ya-estaba")] });
    const result = await applyPlan(p, PLAN, { mode: "append", runId: "run1" });

    expect(created).toEqual(["primera", "segunda"]);
    expect(result.createdIds).toHaveLength(2);
    expect(put).toHaveBeenCalledTimes(1);
    const sent = put.mock.calls[0][0] as BoardCanvas;
    expect(sent.nodes.map((n) => n.id)).toEqual(expect.arrayContaining(["001-ya-estaba", "note-vieja"]));
  });

  it("empty-only: refuses a populated workspace and writes nothing", async () => {
    const { port: p, put, created } = port({ specs: [summary("001-ya-estaba")] });
    await expect(applyPlan(p, PLAN, { mode: "empty-only", runId: "run1" })).rejects.toMatchObject({
      code: "board-not-empty"
    });
    expect(created).toEqual([]);
    expect(put).not.toHaveBeenCalled();
  });

  it("R4: a failure halfway keeps what was created, names the one that failed, and still saves a coherent canvas", async () => {
    const put = vi.fn(async () => ({ ok: true }));
    const p: BoardPort = {
      getBoard: async () => ({ projectRoot: "/tmp/ws", canvas: EXISTING, specs: [summary("001-ya-estaba")] }),
      createSpec: async (name: string) => {
        if (name === "segunda") throw new Error("disk full");
        return { specId: "002-primera", dir: "specs/002-primera" };
      },
      putBoard: put
    };

    const error = await applyPlan(p, PLAN, { mode: "append", runId: "run1" }).catch((e) => e as PlanError);

    expect(error).toBeInstanceOf(PlanError);
    expect(error.code).toBe("partial");
    expect(error.failedName).toBe("segunda");
    expect(error.createdCount).toBe(1);

    // El lienzo guardado corresponde al disco: la spec creada sí, la fallida no.
    expect(put).toHaveBeenCalledTimes(1);
    const sent = put.mock.calls[0][0] as BoardCanvas;
    const ids = sent.nodes.map((n) => n.id);
    expect(ids).toContain("002-primera");
    expect(ids).toContain("001-ya-estaba");
    expect(ids.some((id) => id.includes("segunda"))).toBe(false);
  });
});

describe("applyPlan: a total failure leaves no debris", () => {
  it("writes no canvas at all when not a single spec could be created", async () => {
    const put = vi.fn(async () => ({ ok: true }));
    const p: BoardPort = {
      getBoard: async () => ({ projectRoot: "/tmp/ws", canvas: EXISTING, specs: [summary("001-ya-estaba")] }),
      createSpec: async () => {
        throw new Error("specs/_template missing");
      },
      putBoard: put
    };

    const error = await applyPlan(p, PLAN, { mode: "append", runId: "run1" }).catch((e) => e as PlanError);

    expect(error.code).toBe("partial");
    expect(error.createdCount).toBe(0);
    // Sin nada creado, la nota de idea y las épicas serían basura en el
    // lienzo de alguien que no consiguió nada.
    expect(put).not.toHaveBeenCalled();
  });
});

