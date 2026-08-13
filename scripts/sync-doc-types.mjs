// Spec 033 — writes the "what this document is" header into every guide.
//
// A reader landing on a guide could not tell whether it was a lesson, a
// recipe, a lookup table or an essay, so they read the wrong thing and
// concluded the documentation was confusing. It was: 54 guides mixing all
// four. This states the type on the page, from the same source the site menu
// uses (site/src/guides.mjs), so the page and the menu cannot disagree.
//
// The block sits between markers on purpose: it has to be rewritable without
// touching the body. Without them, a second run would stack a second header.

import { readFileSync, readdirSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { GUIDE_TYPES, LOCALES } from "../site/src/guides.mjs";

const here = dirname(fileURLToPath(import.meta.url));
const docsRoot = join(here, "..", "docs");

const START = "<!-- sdd:doc-type:start -->";
const END = "<!-- sdd:doc-type:end -->";

const numberOf = (file) => file.slice(0, 2);

function typeIndex() {
  const map = new Map();
  for (const type of GUIDE_TYPES) {
    for (const n of type.guides) map.set(n, type);
  }
  return map;
}

/**
 * The rendered block for one guide, in one language.
 *
 * HTML, not a markdown blockquote (spec 034): as a quote it looked like any
 * other aside on the site, and this is the reader's main orientation cue.
 * A <p> with a class is the safest HTML subset — GitHub and the npm payload
 * render it as a plain readable line with no CSS at all, and the site gives
 * it its own treatment.
 */
function renderBlock(type, locale) {
  const badge = locale === "es" ? type.esBadge : type.badge;
  const intent = locale === "es" ? type.esIntent : type.intent;
  return [START, "", `<p class="sdd-doc-type"><strong>${badge}</strong> ${intent}</p>`, "", END].join("\n");
}

/**
 * Insert or replace the block. It goes immediately after the H1 so the reader
 * sees it before deciding whether to keep reading, and so the title still
 * renders first in every viewer.
 */
function applyBlock(source, block) {
  if (source.includes(START) && source.includes(END)) {
    const before = source.slice(0, source.indexOf(START));
    const after = source.slice(source.indexOf(END) + END.length);
    return before + block + after;
  }
  const lines = source.split("\n");
  const h1 = lines.findIndex((line) => line.startsWith("# "));
  if (h1 === -1) return `${block}\n\n${source}`;
  lines.splice(h1 + 1, 0, "", block);
  return lines.join("\n");
}

function main() {
  const types = typeIndex();
  const missing = [];
  let written = 0;
  let unchanged = 0;

  for (const locale of LOCALES) {
    const dir = join(docsRoot, locale);
    for (const file of readdirSync(dir).filter((f) => f.endsWith(".md"))) {
      const type = types.get(numberOf(file));
      if (!type) {
        missing.push(`${locale}/${file}`);
        continue;
      }
      const path = join(dir, file);
      const before = readFileSync(path, "utf8");
      const after = applyBlock(before, renderBlock(type, locale));
      if (after === before) {
        unchanged += 1;
        continue;
      }
      writeFileSync(path, after, "utf8");
      written += 1;
    }
  }

  if (missing.length > 0) {
    // A guide with no type would ship with no header and never appear in the
    // menu — the silent drop this spec exists to prevent.
    console.error(
      `Guides with no type in site/src/guides.mjs (GUIDE_TYPES):\n  - ${missing.join("\n  - ")}`
    );
    process.exitCode = 1;
    return;
  }

  console.log(`doc types: ${written} written, ${unchanged} already current`);
}

main();
