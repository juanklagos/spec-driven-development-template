// Spec 036, T5/T8 (R6, R7, R8). Un solo analizador para los dos caminos: lo
// que llega por la cola y lo que se pega a mano tienen que producir
// exactamente la misma lista. Si esto se bifurca, se bifurca el producto.

import { describe, expect, it } from "vitest";
import { REVIEW_SECTIONS, parseReview } from "./review";

const GOOD = JSON.stringify({
  summary: "Le falta medida en dos criterios.",
  findings: [
    { section: "criteria", severity: "blocker", finding: "R2 no es medible", why: "«rápido» sin número" },
    { section: "outOfScope", severity: "note", finding: "No dice qué queda fuera", why: "" }
  ]
});

describe("parseReview", () => {
  it("reads a bare JSON object", () => {
    const parsed = parseReview(GOOD);
    expect(parsed?.dropped).toBe(0);
    expect(parsed?.review.summary).toBe("Le falta medida en dos criterios.");
    expect(parsed?.review.findings.map((f) => f.section)).toEqual(["criteria", "outOfScope"]);
    expect(parsed?.review.findings[0].severity).toBe("blocker");
  });

  it("R6/R8: fenced and bare produce the very same review", () => {
    const fenced = parseReview("```json\n" + GOOD + "\n```");
    expect(fenced).toEqual(parseReview(GOOD));
  });

  it("accepts a bare array of findings", () => {
    const parsed = parseReview('[{"section":"story","finding":"Sin persona"}]');
    expect(parsed?.review.findings).toHaveLength(1);
    // Por defecto no inventamos gravedad.
    expect(parsed?.review.findings[0].severity).toBe("note");
  });

  it("R7: drops findings whose anchor is not one of the 7 sections, and counts them", () => {
    const parsed = parseReview(
      JSON.stringify({
        findings: [
          { section: "criteria", finding: "vale" },
          { section: "presupuesto", finding: "no existe esa seccion" },
          { section: "", finding: "sin ancla" }
        ]
      })
    );
    expect(parsed?.review.findings.map((f) => f.section)).toEqual(["criteria"]);
    expect(parsed?.dropped).toBe(2);
  });

  it("tolerates case and the Spanish names the prompt might leak", () => {
    const parsed = parseReview(
      JSON.stringify({
        findings: [
          { section: "Criterios", finding: "a" },
          { section: "HISTORIA", finding: "b" }
        ]
      })
    );
    expect(parsed?.review.findings.map((f) => f.section)).toEqual(["criteria", "story"]);
  });

  it("drops findings with no text, which are noise, not findings", () => {
    const parsed = parseReview(JSON.stringify({ findings: [{ section: "criteria", finding: "   " }] }));
    expect(parsed?.review.findings).toEqual([]);
    expect(parsed?.dropped).toBe(1);
  });

  it("a clean review is a valid review, not an error", () => {
    const parsed = parseReview(JSON.stringify({ findings: [] }));
    expect(parsed).not.toBeNull();
    expect(parsed?.review.findings).toEqual([]);
  });

  it("R8: returns null for anything it cannot read as a review", () => {
    expect(parseReview("")).toBeNull();
    expect(parseReview("lo he mirado y esta bien")).toBeNull();
    expect(parseReview('{"hallazgos": []}')).toBeNull();
    expect(parseReview("null")).toBeNull();
  });

  it("never throws, whatever it is handed", () => {
    for (const junk of ["{", "[[[", '{"findings": 3}', "undefined", " "]) {
      expect(() => parseReview(junk)).not.toThrow();
    }
  });

  it("the 7 sections are the ones the editor mounts", () => {
    expect([...REVIEW_SECTIONS]).toEqual([
      "story",
      "scenarios",
      "criteria",
      "requirements",
      "properties",
      "successCriteria",
      "outOfScope"
    ]);
  });
});
