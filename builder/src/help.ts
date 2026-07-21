// Deep links from the in-product help to the full guides.
//
// MIRROR — the canonical table is `packages/sdd-core/src/docs.ts` (DOC_GUIDES).
// The builder is a standalone Vite app served as static files, so it cannot
// import the package; scripts/test-mcp-integration.mjs compares this file
// against sdd-core and fails the build if a slug drifts.

import type { Lang } from "./i18n";

export const DOCS_BASE = "https://juanklagos.github.io/spec-driven-development-template";

export const DOC_GUIDES: Record<string, Record<Lang, string>> = {
  builder: { en: "51-sdd-builder-visual-guide", es: "51-guia-visual-sdd-builder" },
  ears: { en: "12-tdd-and-bdd-how-to-write-specs", es: "12-tdd-y-bdd-como-escribir-specs" },
  flow: { en: "02-workflow", es: "02-flujo-de-trabajo" },
  stateOfTheArt: { en: "50-sdd-state-of-the-art-2026", es: "50-estado-del-arte-sdd-2026" }
};

export type DocGuide = keyof typeof DOC_GUIDES;

/** Absolute URL of a guide on the docs site, in the current UI language. */
export function docsUrl(guide: DocGuide, lang: Lang): string {
  return `${DOCS_BASE}/${lang}/guides/${DOC_GUIDES[guide][lang]}/`;
}
