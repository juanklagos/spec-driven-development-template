// Canonical deep-dive guides linked from the product UI (teaching layer).
//
// Help that cannot be followed further is a dead end: every in-product
// explanation ends with a link to the guide that covers the concept in full.
// The slugs live here ONCE so /dashboard, the MCP App and the builder can never
// send a beginner to a 404.
//
// The builder is a standalone Vite app served as static files and cannot import
// this package, so `builder/src/help.ts` mirrors DOC_GUIDES verbatim and
// scripts/test-mcp-integration.mjs fails the build when the two drift.

export type DocLang = "es" | "en";

/**
 * The four guides the UI links to:
 * - `builder`  (51) the visual builder itself
 * - `ears`     (12) EARS criteria and how they become tests
 * - `flow`     (02) the SDD workflow and the gate
 * - `stateOfTheArt` (50) where SDD stands in 2026
 */
export type DocGuide = "builder" | "ears" | "flow" | "stateOfTheArt";

/** Published docs site (Starlight, `site/astro.config.mjs`: site + base). */
export const DOCS_BASE = "https://juanklagos.github.io/spec-driven-development-template";

/** Guide slug per language — the file name under docs/<lang>/ without `.md`. */
export const DOC_GUIDES: Record<DocGuide, Record<DocLang, string>> = {
  builder: { en: "51-sdd-builder-visual-guide", es: "51-guia-visual-sdd-builder" },
  ears: { en: "12-tdd-and-bdd-how-to-write-specs", es: "12-tdd-y-bdd-como-escribir-specs" },
  flow: { en: "02-workflow", es: "02-flujo-de-trabajo" },
  stateOfTheArt: { en: "50-sdd-state-of-the-art-2026", es: "50-estado-del-arte-sdd-2026" }
};

/** Absolute URL of a guide on the docs site, in the reader's language. */
export function docsUrl(guide: DocGuide, lang: DocLang): string {
  return `${DOCS_BASE}/${lang}/guides/${DOC_GUIDES[guide][lang]}/`;
}
