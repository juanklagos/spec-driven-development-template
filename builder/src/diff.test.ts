// Spec 031, T10 — the pure line diff behind the accept/reject panel.
import { describe, expect, it } from "vitest";
import { diffLines } from "./diff";

describe("diffLines", () => {
  it("marks unchanged, added and removed lines", () => {
    const rows = diffLines("uno\ndos\ntres", "uno\ndos nuevo\ntres\ncuatro");
    expect(rows).toEqual([
      { type: "same", text: "uno" },
      { type: "del", text: "dos" },
      { type: "add", text: "dos nuevo" },
      { type: "same", text: "tres" },
      { type: "add", text: "cuatro" }
    ]);
  });

  it("handles an empty current text (everything is new)", () => {
    expect(diffLines("", "a\nb")).toEqual([
      { type: "add", text: "a" },
      { type: "add", text: "b" }
    ]);
  });

  it("handles an empty proposal (everything is removed)", () => {
    expect(diffLines("a\nb", "")).toEqual([
      { type: "del", text: "a" },
      { type: "del", text: "b" }
    ]);
  });

  it("returns only 'same' rows for identical texts", () => {
    expect(diffLines("a\nb", "a\nb").every((r) => r.type === "same")).toBe(true);
  });
});
