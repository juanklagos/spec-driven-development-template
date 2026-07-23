// Spec 024, R3. The board ↔ JSON Canvas converter — the frontier where a
// regression corrupts the user's specs on disk. The round-trip must preserve
// nodes, text, colors, spec references and edges. Typed edges (spec 009) also
// carry a derived JSON Canvas color that the round-trip must re-derive.

import { describe, expect, it } from "vitest";

import { boardToFlow, edgeKind, flowToBoard } from "./convert";
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
