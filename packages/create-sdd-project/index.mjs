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
  npx @juanklagos/create-sdd-project <target-dir> [--mode sidecar|full] [--profile recommended|minimal|full] [--yes]

Modes:
  sidecar (default)  SDD artifacts in <target>/spec/, your code stays in the target root
  full               Copy the full standalone template workspace

Examples:
  npx @juanklagos/create-sdd-project my-app
  npx @juanklagos/create-sdd-project . --mode sidecar --yes
  npx @juanklagos/create-sdd-project my-workspace --mode full
`);
  process.exit(0);
}

const rl = createInterface({ input: process.stdin, output: process.stdout });

// Nobody can answer a prompt when stdin is not a terminal, and the primary caller of
// this command is an AI agent: START_HERE_NON_TECH tells it to run exactly this. Asking
// anyway left `rl.question` pending forever and node exited with "Detected unsettled
// top-level await", naming an internal file and line, having created nothing.
// isTTY is `undefined` rather than `false` off a terminal, so this is written as a
// negation on purpose.
const interactive = Boolean(process.stdin.isTTY) && !flags.has("yes");
const ask = async (q, fallback) =>
  interactive ? ((await rl.question(`${q} [${fallback}]: `)).trim() || fallback) : fallback;

try {
  let target = positional[0];
  if (!target) target = await ask("Target directory / Directorio destino", "my-sdd-project");
  const targetAbs = resolve(process.cwd(), target);

  let mode = flags.get("mode") ?? (await ask("Mode: sidecar (recommended) or full / Modo", "sidecar"));
  if (!["sidecar", "full"].includes(mode)) throw new Error(`Unknown mode: ${mode}`);
  const profile = flags.get("profile") ?? "recommended";

  // Defaults chosen without asking are announced, not applied silently: the person
  // reading the agent's transcript has to be able to see what was decided for them.
  if (!interactive) {
    console.log(
      `Non-interactive: using target=${target}, mode=${mode}, profile=${profile} / ` +
        `Sin terminal interactiva: usando destino=${target}, modo=${mode}, perfil=${profile}`
    );
  }

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
