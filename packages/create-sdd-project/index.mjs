#!/usr/bin/env node
// create-sdd-project — scaffold a Spec-Driven Development project.
// Zero-dependency CLI: clones the template (depth 1) and installs the
// compact spec/ sidecar (recommended) or a full standalone workspace.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const REPO = "https://github.com/juanklagos/spec-driven-development-template.git";

const args = process.argv.slice(2);
const flags = new Map();
const positional = [];
for (let i = 0; i < args.length; i++) {
  if (args[i].startsWith("--")) {
    const [k, v] = args[i].slice(2).split("=");
    flags.set(k, v ?? (args[i + 1] && !args[i + 1].startsWith("--") ? args[++i] : "true"));
  } else {
    positional.push(args[i]);
  }
}

if (flags.has("help") || flags.has("h")) {
  console.log(`
create-sdd-project — Spec-Driven Development scaffolder

Usage:
  npx create-sdd-project <target-dir> [--mode sidecar|full] [--profile recommended|minimal|full] [--yes]

Modes:
  sidecar (default)  SDD artifacts in <target>/spec/, your code stays in the target root
  full               Copy the full standalone template workspace

Examples:
  npx create-sdd-project my-app
  npx create-sdd-project . --mode sidecar --yes
  npx create-sdd-project my-workspace --mode full
`);
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });
const ask = async (q, fallback) =>
  flags.has("yes") ? fallback : ((await rl.question(`${q} [${fallback}]: `)).trim() || fallback);

try {
  let target = positional[0];
  if (!target) target = await ask("Target directory / Directorio destino", "my-sdd-project");
  const targetAbs = resolve(process.cwd(), target);

  let mode = flags.get("mode") ?? (await ask("Mode: sidecar (recommended) or full / Modo", "sidecar"));
  if (!["sidecar", "full"].includes(mode)) throw new Error(`Unknown mode: ${mode}`);
  const profile = flags.get("profile") ?? "recommended";

  if (mode === "sidecar" && existsSync(join(targetAbs, "spec"))) {
    throw new Error(`${targetAbs}/spec already exists — aborting to avoid overwriting.`);
  }

  console.log(`\n→ Cloning template (depth 1)...`);
  const tmp = mkdtempSync(join(tmpdir(), "sdd-template-"));
  execFileSync("git", ["clone", "--depth", "1", REPO, tmp], { stdio: "inherit" });

  if (mode === "sidecar") {
    console.log(`→ Installing compact spec/ sidecar into ${targetAbs} (profile: ${profile})...`);
    execFileSync("bash", [join(tmp, "scripts", "install-spec-sidecar.sh"), targetAbs, `--profile=${profile}`], {
      stdio: "inherit",
    });
  } else {
    console.log(`→ Installing full standalone workspace into ${targetAbs}...`);
    execFileSync("bash", [join(tmp, "scripts", "init-project.sh"), targetAbs, "--profile=full"], {
      stdio: "inherit",
    });
  }
  rmSync(tmp, { recursive: true, force: true });

  const scripts = mode === "sidecar" ? "./spec/scripts" : "./scripts";
  console.log(`
✅ Done / Listo: ${targetAbs}

Next steps / Próximos pasos:
  1. cd ${target}
  2. Fill the idea / Completa la idea:  ${mode === "sidecar" ? "spec/idea" : "idea"}/IDEA_GENERAL.md
  3. First spec / Primera spec:         ${scripts}/new-spec.sh "my-feature" "Owner"
  4. Validate / Valida:                 ${scripts}/validate-sdd.sh . --strict

Golden rule / Regla de oro: no code before approved spec and consistent plan.
Docs: https://github.com/juanklagos/spec-driven-development-template
`);
} catch (err) {
  console.error(`\n✖ ${err.message}`);
  process.exitCode = 1;
} finally {
  rl.close();
}
