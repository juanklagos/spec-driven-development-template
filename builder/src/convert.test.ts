// Spec 024, R3. The board ↔ JSON Canvas converter — the frontier where a
// regression corrupts the user's specs on disk. The round-trip must preserve
// nodes, text, colors, spec references and edges. Typed edges (spec 009) also
// carry a derived JSON Canvas color that the round-trip must re-derive.

import { describe, expect, it } from "vitest";

import { boardToFlow, edgeKind, flowToBoard, toAbsoluteNodes } from "./convert";
import type { BoardCanvas, SpecSummary } from "./types";

function specSummary(id: string): SpecSummary {
  return {
    id,
    title: `Spec ${id}`,
    dir: `specs/${id}`,
    status: "Pendiente",
    tasks: { done: 0, total: 0 },
    tone: "pending"
  };
}

describe("edgeKind — label is the single source of truth", () => {
  it("classifies typed labels (ES and EN), case/space tolerant", () => {
    expect(edgeKind("depende de")).toBe("depends");
    expect(edgeKind("depends on")).toBe("depends");
    expect(edgeKind(" Bloquea ")).toBe("blocks");
    expect(edgeKind("blocks")).toBe("blocks");
    expect(edgeKind("contiene")).toBe("contains");
    expect(edgeKind("contains")).toBe("contains");
  });

  it("falls back to 'related' for anything unrecognized or empty", () => {
    expect(edgeKind(undefined)).toBe("related");
    expect(edgeKind("")).toBe("related");
    expect(edgeKind("se relaciona con")).toBe("related");
  });
});

describe("boardToFlow → flowToBoard round-trip", () => {
  it("preserves a text note with its color, position and size", () => {
    const canvas: BoardCanvas = {
      nodes: [{ id: "n1", type: "text", x: 10, y: 20, width: 260, height: 120, text: "📦 Idea", color: "4" }],
      edges: []
    };

    const { nodes, edges } = boardToFlow(canvas, []);
    const back = flowToBoard(nodes, edges);

    expect(back.nodes).toHaveLength(1);
    expect(back.nodes[0]).toMatchObject({
      id: "n1",
      type: "text",
      x: 10,
      y: 20,
      width: 260,
      height: 120,
      text: "📦 Idea",
      color: "4"
    });
  });

  it("preserves a spec reference: file node → spec card → file node", () => {
    const canvas: BoardCanvas = {
      nodes: [
        { id: "001-foo", type: "file", x: 0, y: 0, width: 300, height: 180, file: "specs/001-foo/spec.md" }
      ],
      edges: []
    };

    const { nodes, edges } = boardToFlow(canvas, [specSummary("001-foo")]);
    expect(nodes[0].type).toBe("spec");

    const back = flowToBoard(nodes, edges);
    expect(back.nodes[0]).toMatchObject({ id: "001-foo", type: "file", file: "specs/001-foo/spec.md" });
  });

  it("keeps a non-spec file node as a note without destroying the file reference", () => {
    const canvas: BoardCanvas = {
      nodes: [{ id: "f1", type: "file", x: 5, y: 5, width: 260, height: 120, file: "docs/readme.md" }],
      edges: []
    };

    const { nodes, edges } = boardToFlow(canvas, []);
    expect(nodes[0].type).toBe("note");

    const back = flowToBoard(nodes, edges);
    expect(back.nodes[0]).toMatchObject({ id: "f1", type: "file", file: "docs/readme.md" });
  });

  it("preserves edge endpoints and label, and re-derives the typed JSON Canvas color", () => {
    const canvas: BoardCanvas = {
      nodes: [
        { id: "a", type: "text", x: 0, y: 0, width: 260, height: 120, text: "A" },
        { id: "b", type: "text", x: 400, y: 0, width: 260, height: 120, text: "B" }
      ],
      edges: [{ id: "e1", fromNode: "a", toNode: "b", label: "depende de" }]
    };

    const { nodes, edges } = boardToFlow(canvas, []);
    const back = flowToBoard(nodes, edges);

    expect(back.edges).toHaveLength(1);
    expect(back.edges[0]).toMatchObject({
      id: "e1",
      fromNode: "a",
      toNode: "b",
      label: "depende de",
      color: "3" // depends → JSON Canvas preset 3, re-derived from the label
    });
  });

  it("a plain 'related' edge carries no color", () => {
    const canvas: BoardCanvas = {
      nodes: [
        { id: "a", type: "text", x: 0, y: 0, width: 260, height: 120, text: "A" },
        { id: "b", type: "text", x: 400, y: 0, width: 260, height: 120, text: "B" }
      ],
      edges: [{ id: "e1", fromNode: "a", toNode: "b" }]
    };

    const { nodes, edges } = boardToFlow(canvas, []);
    const back = flowToBoard(nodes, edges);

    expect(back.edges[0]).toMatchObject({ id: "e1", fromNode: "a", toNode: "b" });
    expect(back.edges[0].color).toBeUndefined();
  });
});

describe("boardToFlow — specs on disk but not on the canvas are appended", () => {
  it("adds a spec card for a spec missing from the canvas", () => {
    const canvas: BoardCanvas = { nodes: [], edges: [] };
    const { nodes } = boardToFlow(canvas, [specSummary("002-bar")]);
    expect(nodes).toHaveLength(1);
    expect(nodes[0]).toMatchObject({ id: "002-bar", type: "spec" });
  });
});

// --- Spec 041: JSON Canvas groups ------------------------------------------
// The defect this guards against was not a rendering bug. A group loaded as a
// note (its title lives in `label`, which the note branch never read) and the
// next layout save wrote it back as type "text" with an empty string — so the
// label and the background disappeared from the user's file on the first
// drag. These tests fail loudly if that path ever comes back.

describe("groups survive the round-trip (spec 041)", () => {
  const group = {
    id: "capa-0",
    type: "group" as const,
    label: "Capa 0 · Fundación",
    color: "4",
    background: "img/capa.png",
    backgroundStyle: "cover" as const,
    x: 0,
    y: 0,
    width: 800,
    height: 400
  };

  it("keeps the type, the label and every group field", () => {
    const canvas: BoardCanvas = { nodes: [group], edges: [] };
    const { nodes, edges } = boardToFlow(canvas, []);
    const back = flowToBoard(nodes, edges);

    expect(back.nodes[0]).toEqual(group);
  });

  it("reads the title from `label`, never from `text`", () => {
    const { nodes } = boardToFlow({ nodes: [group], edges: [] }, []);
    expect(nodes[0].type).toBe("group");
    expect(nodes[0].data).toMatchObject({ label: "Capa 0 · Fundación" });
  });

  it("never turns a group into a text node", () => {
    const { nodes, edges } = boardToFlow({ nodes: [group], edges: [] }, []);
    const back = flowToBoard(nodes, edges);
    expect(back.nodes[0].type).toBe("group");
    expect(back.nodes[0].text).toBeUndefined();
  });

  it("carries through fields this builder does not paint", () => {
    const exotic = { ...group, someFutureField: { a: 1 } } as unknown as BoardCanvas["nodes"][number];
    const { nodes, edges } = boardToFlow({ nodes: [exotic], edges: [] }, []);
    const back = flowToBoard(nodes, edges);
    expect(back.nodes[0]).toMatchObject({ someFutureField: { a: 1 } });
  });

  it("leaves a group with no optional field free of empty keys", () => {
    const bare = { id: "g", type: "group" as const, x: 10, y: 20, width: 300, height: 200 };
    const { nodes, edges } = boardToFlow({ nodes: [bare], edges: [] }, []);
    const back = flowToBoard(nodes, edges);
    expect(back.nodes[0]).toEqual(bare);
  });
});

describe("group membership is derived, never stored (spec 041)", () => {
  const frame = (id: string, x: number, y: number, width: number, height: number) => ({
    id,
    type: "group" as const,
    label: id,
    x,
    y,
    width,
    height
  });
  const note = (id: string, x: number, y: number) => ({
    id,
    type: "text" as const,
    text: id,
    x,
    y,
    width: 100,
    height: 50
  });

  it("adopts a card whose whole rectangle sits inside the frame", () => {
    const canvas: BoardCanvas = { nodes: [frame("g", 0, 0, 400, 300), note("n", 50, 40)], edges: [] };
    const { nodes } = boardToFlow(canvas, []);
    const child = nodes.find((n) => n.id === "n")!;
    expect(child.parentId).toBe("g");
    // Relative to the frame, which is what React Flow needs.
    expect(child.position).toEqual({ x: 50, y: 40 });
  });

  it("leaves a card that only half overlaps outside the frame", () => {
    const canvas: BoardCanvas = { nodes: [frame("g", 0, 0, 400, 300), note("n", 350, 40)], edges: [] };
    const { nodes } = boardToFlow(canvas, []);
    expect(nodes.find((n) => n.id === "n")!.parentId).toBeUndefined();
  });

  it("gives the card to the smallest frame that contains it", () => {
    const canvas: BoardCanvas = {
      nodes: [frame("big", 0, 0, 800, 600), frame("small", 20, 20, 300, 200), note("n", 40, 40)],
      edges: []
    };
    const { nodes } = boardToFlow(canvas, []);
    expect(nodes.find((n) => n.id === "n")!.parentId).toBe("small");
    // and the small frame is itself a child of the big one
    expect(nodes.find((n) => n.id === "small")!.parentId).toBe("big");
  });

  it("emits parents before their children, as the runtime requires", () => {
    const canvas: BoardCanvas = {
      nodes: [note("n", 40, 40), frame("small", 20, 20, 300, 200), frame("big", 0, 0, 800, 600)],
      edges: []
    };
    const { nodes } = boardToFlow(canvas, []);
    const order = nodes.map((n) => n.id);
    expect(order.indexOf("big")).toBeLessThan(order.indexOf("small"));
    expect(order.indexOf("small")).toBeLessThan(order.indexOf("n"));
  });

  it("writes absolute coordinates back and no parent field", () => {
    const canvas: BoardCanvas = { nodes: [frame("g", 100, 100, 400, 300), note("n", 150, 140)], edges: [] };
    const { nodes, edges } = boardToFlow(canvas, []);
    const back = flowToBoard(nodes, edges);
    const child = back.nodes.find((n) => n.id === "n")!;
    expect(child).toMatchObject({ x: 150, y: 140 });
    expect(child).not.toHaveProperty("parentId");
  });

  it("moving the frame moves its children in the saved file", () => {
    const canvas: BoardCanvas = { nodes: [frame("g", 0, 0, 400, 300), note("n", 50, 40)], edges: [] };
    const { nodes, edges } = boardToFlow(canvas, []);
    // The frame is dragged 200 to the right; React Flow only changes the
    // parent's position — the child's stays relative.
    const dragged = nodes.map((n) => (n.id === "g" ? { ...n, position: { x: 200, y: 0 } } : n));
    const back = flowToBoard(dragged, edges);
    expect(back.nodes.find((n) => n.id === "n")).toMatchObject({ x: 250, y: 40 });
  });

  it("deleting the frame leaves its children where they were", () => {
    const canvas: BoardCanvas = { nodes: [frame("g", 100, 100, 400, 300), note("n", 150, 140)], edges: [] };
    const { nodes, edges } = boardToFlow(canvas, []);
    const freed = toAbsoluteNodes(nodes).filter((n) => n.id !== "g");
    const back = flowToBoard(freed, edges);
    expect(back.nodes).toHaveLength(1);
    expect(back.nodes[0]).toMatchObject({ id: "n", x: 150, y: 140 });
  });

  it("a board with no groups is untouched", () => {
    const canvas: BoardCanvas = { nodes: [note("a", 0, 0), note("b", 500, 0)], edges: [] };
    const { nodes, edges } = boardToFlow(canvas, []);
    expect(nodes.every((n) => n.parentId === undefined)).toBe(true);
    expect(flowToBoard(nodes, edges).nodes).toEqual(canvas.nodes);
  });
});

describe("a frame is as big as the file says (spec 041)", () => {
  it("ignores the DOM measurement when saving a group", () => {
    const canvas: BoardCanvas = {
      nodes: [{ id: "g", type: "group", label: "L", x: 0, y: 0, width: 760, height: 320 }],
      edges: []
    };
    const { nodes, edges } = boardToFlow(canvas, []);
    // React Flow reports the wrapper it laid out, which for a frame is the
    // title pill and not the frame (measured 150x342 in the browser).
    const measured = nodes.map((n) => ({ ...n, measured: { width: 150, height: 342 } }));
    const back = flowToBoard(measured, edges);
    expect(back.nodes[0]).toMatchObject({ width: 760, height: 320 });
  });
});
