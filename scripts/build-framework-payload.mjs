#!/usr/bin/env node
// Build the framework payload shipped inside the @juanklagos/sdd-core tarball.
//
// Why: the MCP tools shell out to ./scripts/*.sh and read framework documents
// (policy, quickstart, guides, spec template). In a checkout those live at the
// repo root. Installed from npm there is no repo root, so the tarball carries a
// faithful mirror of the assets under packages/sdd-core/framework/ and
// resolveFrameworkRoot() (packages/sdd-core/src/workspace.ts) points there.
//
// The payload is a verbatim mirror: an npm install must behave like a checkout.
// Run by the `prepack` script of @juanklagos/sdd-core; the output is gitignored.

import { constants, promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const repoRoot = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const payloadRoot = path.join(repoRoot, "packages", "sdd-core", "framework");

// Every entry is required: a rename in the repo must break the build here
// instead of silently shipping a package that cannot scaffold anything.
const ENTRIES = [
  // Policy and agent entry points (also the source of the sdd:// resources).
  "sdd.policy.yaml",
  "QUICKSTART.md",
  "AI_START_HERE.md",
  "AGENTS.md",
  "INSTRUCTIONS.md",
  "START_HERE_NON_TECH.md",
  "CLAUDE.md",
  "GEMINI.md",
  "WINDSURF.md",
  "AIDER.md",
  "ROO.md",
  ".cursorrules",
  ".clauderules",
  ".sdd.README.template.md",
  ".github/copilot-instructions.md",
  // Scripts the tools shell out to (create-www-project.sh and everything it calls).
  "scripts",
  // Scaffolding sources.
  "templates",
  "template-context",
  "specs/README.md",
  "specs/INDEX.md",
  "specs/_template",
  "idea/IDEA_GENERAL.md",
  "bitacora/README.md",
  "bitacora/global/PROJECT_LOG.md",
  "bitacora/templates",
  "playbooks",
  "quality",
  "legal",
  // Guides copied by the full profile; docs/en/43-easy-mcp-guide.md also backs
  // the sdd://docs/easy-mcp resource.
  "docs/README.md",
  "docs/roadmap.md",
  "docs/roadmap.mmd",
  "docs/en",
  "docs/es"
];

// Never ship build output, dependencies or OS noise inside the payload.
const EXCLUDED_NAMES = new Set(["node_modules", "dist", ".DS_Store", "Thumbs.db", ".git"]);

async function copyEntry(relative) {
  const source = path.join(repoRoot, relative);
  const target = path.join(payloadRoot, relative);

  let stats;
  try {
    stats = await fs.stat(source);
  } catch {
    throw new Error(`Framework payload source is missing: ${relative} (expected at ${source})`);
  }

  await fs.mkdir(path.dirname(target), { recursive: true });
  await fs.cp(source, target, {
    recursive: stats.isDirectory(),
    preserveTimestamps: true,
    filter: (from) => !EXCLUDED_NAMES.has(path.basename(from))
  });
}

async function countFiles(dir) {
  const entries = await fs.readdir(dir, { withFileTypes: true });
  let total = 0;
  for (const entry of entries) {
    total += entry.isDirectory() ? await countFiles(path.join(dir, entry.name)) : 1;
  }
  return total;
}

async function main() {
  await fs.rm(payloadRoot, { recursive: true, force: true });
  await fs.mkdir(payloadRoot, { recursive: true });

  for (const relative of ENTRIES) {
    await copyEntry(relative);
  }

  // The scaffolding scripts are executed with `bash <path>`, but keep the exec
  // bit so a user can also run them straight out of node_modules.
  const scriptsDir = path.join(payloadRoot, "scripts");
  for (const entry of await fs.readdir(scriptsDir, { withFileTypes: true })) {
    if (entry.isFile() && entry.name.endsWith(".sh")) {
      await fs.chmod(path.join(scriptsDir, entry.name), 0o755);
    }
  }

  // Marker files resolveFrameworkRoot() looks for. Fail here rather than at runtime.
  for (const marker of ["sdd.policy.yaml", "specs/_template/spec.md", "scripts/create-www-project.sh"]) {
    await fs.access(path.join(payloadRoot, marker), constants.R_OK);
  }

  console.log(`Framework payload built at ${payloadRoot} (${await countFiles(payloadRoot)} files)`);
}

main().catch((error) => {
  console.error(error.message ?? error);
  process.exitCode = 1;
});
