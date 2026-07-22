#!/usr/bin/env node
// Puts the built SDD Builder frontend inside the sdd-mcp tarball.
//
// Spec 011 R1. Until now `builder/dist` (768K, built) never left the checkout:
// packages/sdd-mcp declared `files: ["dist"]` and the frontend lives outside it,
// so `npm pack` produced ~70 kB with no UI and using the builder required
// cloning the repository. Two releases shipped after that was identified.
//
// Destination is `dist/builder-ui`, a sibling of the compiled server inside the
// existing `files` entry. That is deliberate: it needs no change to `files`, and
// it avoids routing through scripts/build-framework-payload.mjs, whose
// EXCLUDED_NAMES contains "dist" and filters on `path.basename` — copying
// `builder/dist` through there silently copies nothing and throws nothing.
//
// This script fails LOUDLY when the result is unusable. Both mechanisms it
// replaces failed silently, which is how an empty frontend would ship green.

import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { cp, mkdir, readdir, rm } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const HERE = path.dirname(fileURLToPath(import.meta.url));
const REPO_ROOT = path.resolve(HERE, "..");
const BUILDER_ROOT = path.join(REPO_ROOT, "builder");
const BUILDER_DIST = path.join(BUILDER_ROOT, "dist");
const TARGET = path.join(REPO_ROOT, "packages/sdd-mcp/dist/builder-ui");

function run(command, args, cwd) {
  execFileSync(command, args, { cwd, stdio: "inherit" });
}

/** index.html plus at least one hashed asset. An empty or partial copy is a bug. */
async function assertUsable(dir, label) {
  if (!existsSync(path.join(dir, "index.html"))) {
    throw new Error(`${label}: index.html is missing at ${dir}`);
  }
  const assetsDir = path.join(dir, "assets");
  const assets = existsSync(assetsDir) ? await readdir(assetsDir) : [];
  const js = assets.filter((f) => f.endsWith(".js"));
  if (js.length === 0) {
    throw new Error(`${label}: no JavaScript bundle under ${assetsDir}. A shell with no app would ship green.`);
  }
  return { assets: assets.length, js: js.length };
}

async function main() {
  // Installed from npm there is no builder source, and the UI is already in the
  // tarball. Nothing to do — and nothing to fail about.
  if (!existsSync(BUILDER_ROOT)) {
    console.log("builder/ not present (installed package): skipping builder UI step.");
    return;
  }

  if (!existsSync(BUILDER_DIST)) {
    // `builder` is not in the root `workspaces` glob, so a root `npm install`
    // never reaches it and `npm run build` never builds it.
    if (!existsSync(path.join(BUILDER_ROOT, "node_modules"))) {
      console.log("Installing builder dependencies...");
      run("npm", ["install", "--no-audit", "--no-fund"], BUILDER_ROOT);
    }
    console.log("Building the SDD Builder...");
    run("npm", ["run", "build"], BUILDER_ROOT);
  }

  const source = await assertUsable(BUILDER_DIST, "builder/dist");

  await rm(TARGET, { recursive: true, force: true });
  await mkdir(path.dirname(TARGET), { recursive: true });
  await cp(BUILDER_DIST, TARGET, { recursive: true });

  const copied = await assertUsable(TARGET, "packages/sdd-mcp/dist/builder-ui");
  if (copied.js !== source.js) {
    throw new Error(`Copy is incomplete: ${source.js} JS bundle(s) in builder/dist, ${copied.js} at the destination.`);
  }

  console.log(`SDD Builder UI staged at packages/sdd-mcp/dist/builder-ui (${copied.assets} asset(s)).`);
}

main().catch((error) => {
  console.error(`\nBuilder UI packaging failed: ${error.message}`);
  process.exit(1);
});
