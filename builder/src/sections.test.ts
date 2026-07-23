// Spec 024, R5. The builder bundle keeps a private mirror of sdd-core's
// isApprovedStatus (sections.ts `isApprovedStatusText`) because the approval tab
// reads raw, not-yet-saved spec.md text with no server tone. The comment there
// says "KEEP IN SYNC"; this test makes that mechanical. Both copies are asserted
// against the SAME shared truth table that packages/sdd-core/src/board.test.ts
// uses for the original — identical inputs, identical expected booleans, so the
// two can never diverge without a red test in one suite or the other.

import { describe, expect, it } from "vitest";

import { APPROVAL_CASES } from "../../packages/sdd-core/src/approval-cases.fixture";
import { isApprovedStatusText } from "./sections";

describe("isApprovedStatusText — mirror of sdd-core, shared truth table (R5)", () => {
  for (const { status, approved, note } of APPROVAL_CASES) {
    it(`${JSON.stringify(status)} → ${approved} (${note})`, () => {
      expect(isApprovedStatusText(status)).toBe(approved);
    });
  }
});
