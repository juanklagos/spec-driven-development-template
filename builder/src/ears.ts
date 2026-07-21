// Live EARS lint for the guided editor (spec 008, R3). Local on purpose:
// the frontend does not import sdd-core, so this module duplicates the
// minimal rules of `validateEarsCriterion` in
// packages/sdd-core/src/spec-actions.ts (the copy agents use over MCP).
// KEEP THE REGEXES IN SYNC with that file — mcp:test asserts the core copy.
// The lint is advisory only: it never blocks saving.

export type EarsLintLevel = "ok" | "warning";

export interface EarsLintResult {
  level: EarsLintLevel;
  /** True when the CUANDO/WHEN/SI/IF/MIENTRAS/WHILE … DEBERÁ/SHALL skeleton is present. */
  matchesPattern: boolean;
  /** Vague words found while the criterion carries no measurable number. */
  vagueWords: string[];
  /** Short bilingual hints; empty when the criterion lints clean. */
  hints: string[];
}

/**
 * EARS skeleton: a trigger keyword up front and an obligation keyword later.
 * Case-insensitive; tolerates a leading list bullet, plural "DEBERÁN" and the
 * unaccented "DEBERA". Accepts "EL SISTEMA DEBERÁ …" / "THE SYSTEM SHALL …".
 * Note: the obligation ends with a (?!\w) lookahead instead of \b because
 * "Á" is not an ASCII word character in JS regexes (a trailing \b would
 * silently reject the accented "DEBERÁ").
 */
const EARS_PATTERN_RE = /^\s*(?:[-*]\s*)?(?:CUANDO|WHEN|SI|IF|MIENTRAS|WHILE)\b.*\b(?:DEBER[ÁA]N?|SHALL)(?!\w)/i;

/** Vague adjectives that need a number to be testable (ES/EN + variants). */
const VAGUE_WORDS_RE = /\b(r[áa]pid[oa]s?|f[áa]cil(?:es)?|intuitiv[oa]s?|fast|easy|user[- ]?friendly)\b/gi;

const HAS_NUMBER_RE = /\d/;

/** Same contract as sdd-core validateEarsCriterion. Empty input lints clean. */
export function lintEarsCriterion(text: string): EarsLintResult {
  const value = text.trim();
  if (value === "") {
    return { level: "ok", matchesPattern: false, vagueWords: [], hints: [] };
  }

  const hints: string[] = [];
  const matchesPattern = EARS_PATTERN_RE.test(value);
  if (!matchesPattern) {
    hints.push(
      "Patrón EARS: CUANDO/SI/MIENTRAS … EL SISTEMA DEBERÁ … / " +
        "EARS pattern: WHEN/IF/WHILE … THE SYSTEM SHALL …"
    );
  }

  const vagueWords = HAS_NUMBER_RE.test(value)
    ? []
    : [...new Set((value.match(VAGUE_WORDS_RE) ?? []).map((word) => word.toLowerCase()))];
  if (vagueWords.length > 0) {
    hints.push(
      `Palabra vaga sin número medible: ${vagueWords.join(", ")} / ` +
        `Vague word without a measurable number: ${vagueWords.join(", ")}`
    );
  }

  return { level: hints.length > 0 ? "warning" : "ok", matchesPattern, vagueWords, hints };
}
