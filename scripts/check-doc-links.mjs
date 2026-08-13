// Spec 033, R6 — every relative link in the documentation must resolve.
//
// Three surfaces, because a link can be fine in one and dead in another:
//   1. docs/ in the repository,
//   2. the framework payload shipped on npm (which deliberately does not carry
//      docs/assets or legal/, so its copies get rewritten to GitHub URLs),
//   3. the built site, if it has been generated.
//
// The payload shipped 43 dead links to real users before this check existed.

import { existsSync, readFileSync, readdirSync, statSync } from "node:fs";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const repoRoot = join(here, "..");

const LINK = /\]\((\.[^)\s#]+)(#[^)]*)?\)/g;

function markdownFilesIn(dir) {
  const out = [];
  for (const entry of readdirSync(dir, { withFileTypes: true })) {
    const full = join(dir, entry.name);
    if (entry.isDirectory()) out.push(...markdownFilesIn(full));
    else if (entry.name.endsWith(".md")) out.push(full);
  }
  return out;
}

function brokenLinksIn(root) {
  if (!existsSync(root)) return null; // surface not generated in this checkout
  const broken = [];
  for (const file of markdownFilesIn(root)) {
    const source = readFileSync(file, "utf8");
    for (const match of source.matchAll(LINK)) {
      const target = resolve(dirname(file), match[1]);
      if (!existsSync(target)) {
        broken.push(`${file.replace(repoRoot + "/", "")} -> ${match[1]}`);
      }
    }
  }
  return broken;
}

const SURFACES = [
  ["docs/", join(repoRoot, "docs")],
  ["npm payload", join(repoRoot, "packages/sdd-core/framework/docs")]
];

/**
 * The built site is checked differently: its pages link by URL, not by file
 * path (scripts/sync-docs.mjs rewrites them on the way in), so resolving them
 * against the filesystem would report every single one as broken. What matters
 * here is whether the URL has a page behind it.
 */
function brokenSiteLinks() {
  const dist = join(repoRoot, "site/dist");
  if (!existsSync(dist)) return null;

  const pages = new Set();
  const htmlFiles = [];
  (function walk(dir) {
    for (const entry of readdirSync(dir, { withFileTypes: true })) {
      const full = join(dir, entry.name);
      if (entry.isDirectory()) walk(full);
      else if (entry.name === "index.html") {
        htmlFiles.push(full);
        // /spec-driven-development-template/en/guides/00-introduction/
        pages.add(dirname(full).replace(dist, "").replace(/^$/, "/") + "/");
      }
    }
  })(dist);

  const broken = new Set();
  const HREF = /href="(\/spec-driven-development-template\/[^"#?]*)/g;
  for (const file of htmlFiles) {
    for (const match of readFileSync(file, "utf8").matchAll(HREF)) {
      let url = match[1].replace("/spec-driven-development-template", "");
      if (!url.endsWith("/")) {
        // Asset or file URL: check it exists on disk instead.
        if (existsSync(join(dist, url))) continue;
        url += "/";
      }
      if (!pages.has(url)) broken.add(`${file.replace(dist, "site/dist")} -> ${match[1]}`);
    }
  }
  return [...broken];
}

let failed = false;
for (const [label, root] of SURFACES) {
  const broken = brokenLinksIn(root);
  if (broken === null) {
    console.log(`${label}: not present, skipped`);
    continue;
  }
  if (broken.length > 0) {
    failed = true;
    console.error(`${label}: ${broken.length} broken link(s)`);
    for (const entry of broken) console.error(`  - ${entry}`);
  } else {
    console.log(`${label}: ok`);
  }
}

const siteBroken = brokenSiteLinks();
if (siteBroken === null) {
  console.log("built site: not built, skipped (run `npm run build` in site/)");
} else if (siteBroken.length > 0) {
  failed = true;
  console.error(`built site: ${siteBroken.length} broken link(s)`);
  for (const entry of siteBroken.slice(0, 20)) console.error(`  - ${entry}`);
} else {
  console.log("built site: ok");
}

if (failed) process.exitCode = 1;
