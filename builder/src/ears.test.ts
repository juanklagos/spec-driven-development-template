// Spec 024, R4. The live EARS lint of the guided editor. Advisory, never blocks
// saving — the tests fix the skeleton detection (CUANDO/WHEN … DEBERÁ/SHALL) and
// the vague-word-without-a-number warning, in ES and EN.

import { describe, expect, it } from "vitest";

import { lintEarsCriterion } from "./ears";

describe("lintEarsCriterion — EARS skeleton", () => {
  it("accepts a well-formed ES criterion", () => {
    const r = lintEarsCriterion("CUANDO el puerto esté ocupado, EL SISTEMA DEBERÁ elegir otro.");
    expect(r.matchesPattern).toBe(true);
    expect(r.level).toBe("ok");
    expect(r.hints).toHaveLength(0);
  });

  it("accepts a well-formed EN criterion (WHEN … SHALL)", () => {
    const r = lintEarsCriterion("WHEN the port is busy, THE SYSTEM SHALL pick another one.");
    expect(r.matchesPattern).toBe(true);
    expect(r.level).toBe("ok");
  });

  it("accepts SI/IF and MIENTRAS/WHILE triggers", () => {
    expect(lintEarsCriterion("SI hay un error, EL SISTEMA DEBERÁ registrarlo.").matchesPattern).toBe(true);
    expect(lintEarsCriterion("IF an error occurs, THE SYSTEM SHALL log it.").matchesPattern).toBe(true);
    expect(lintEarsCriterion("MIENTRAS esté activo, EL SISTEMA DEBERÁ refrescar.").matchesPattern).toBe(true);
    expect(lintEarsCriterion("WHILE running, THE SYSTEM SHALL refresh.").matchesPattern).toBe(true);
  });

  it("tolerates a leading bullet, plural DEBERÁN and unaccented DEBERA", () => {
    expect(lintEarsCriterion("- CUANDO pase X, EL SISTEMA DEBERÁN hacer Y.").matchesPattern).toBe(true);
    expect(lintEarsCriterion("CUANDO pase X, EL SISTEMA DEBERA hacer Y.").matchesPattern).toBe(true);
  });

  it("flags a criterion with no EARS skeleton", () => {
    const r = lintEarsCriterion("El sistema es rápido y bonito.");
    expect(r.matchesPattern).toBe(false);
    expect(r.level).toBe("warning");
    expect(r.hints.join(" ")).toMatch(/EARS/);
  });

  it("lints empty input clean (no false alarms while typing)", () => {
    const r = lintEarsCriterion("   ");
    expect(r).toEqual({ level: "ok", matchesPattern: false, vagueWords: [], hints: [] });
  });
});

describe("lintEarsCriterion — vague words without a measurable number", () => {
  it("warns on a vague word when no number is present", () => {
    const r = lintEarsCriterion("CUANDO el usuario entre, EL SISTEMA DEBERÁ responder rápido.");
    expect(r.vagueWords).toContain("rápido");
    expect(r.level).toBe("warning");
  });

  it("does not warn about vague words once a number anchors them", () => {
    const r = lintEarsCriterion("CUANDO el usuario entre, EL SISTEMA DEBERÁ responder en menos de 2 s.");
    expect(r.vagueWords).toHaveLength(0);
    expect(r.level).toBe("ok");
  });

  it("catches EN vague words too", () => {
    const r = lintEarsCriterion("WHEN asked, THE SYSTEM SHALL be fast and user-friendly.");
    expect(r.vagueWords).toEqual(expect.arrayContaining(["fast", "user-friendly"]));
  });
});
