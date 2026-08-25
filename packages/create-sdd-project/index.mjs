#!/usr/bin/env node
// create-sdd-project — scaffold a Spec-Driven Development project.
// Zero-dependency CLI: clones the template (depth 1) and installs the
// compact spec/ sidecar (recommended) or a full standalone workspace.

import { execFileSync } from "node:child_process";
import { existsSync, mkdtempSync, readFileSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join, resolve } from "node:path";
import { createInterface } from "node:readline/promises";

const REPO = "https://github.com/juanklagos/spec-driven-development-template.git";

// Spec 040. This installer used to clone the default branch while `sdd-mcp upgrade`
// compared the result against the payload embedded in @juanklagos/sdd-core, which is
// built from the tag. Two sources under the same version number: everything committed
// between two releases reached users' projects without existing in any published
// package, and the upgrade diagnostic then reported those files as edited BY THEM.
// Measured on v2.6.0: the window opened 29 minutes after publishing.
// Spec 040. Este instalador clonaba la rama por defecto mientras `sdd-mcp upgrade`
// comparaba contra el payload de @juanklagos/sdd-core, que sale del tag. Dos fuentes
// bajo el mismo número de versión.
//
// Read at runtime, never inlined: a literal here would be a ninth place to bump in
// RELEASING.md §1, and the one that nobody would remember.
// Se lee en tiempo de ejecución, nunca incrustada: un literal aquí sería un noveno
// sitio que subir en RELEASING.md §1, y el que nadie recordaría.
const VERSION = JSON.parse(
  readFileSync(new URL("./package.json", import.meta.url), "utf8")
).version;

// `git ls-remote` exits 0 with empty output when nothing matches, so existence is read
// off the output and never off the exit code. Patterns match the tail of the ref name,
// so "main", "v2.6.0" and "refs/tags/v2.6.0" all work.
// `git ls-remote` sale con código 0 y salida vacía cuando no hay coincidencia: la
// existencia se lee en la salida, nunca en el código de salida.
const remoteHas = (pattern) =>
  execFileSync("git", ["ls-remote", REPO, pattern], { encoding: "utf8" }).trim() !== "";

// Precedence: explicit --ref, then the tag for this package's own version, then the
// default branch. The last one is a fallback and says so out loud — a silent fallback
// would put back exactly the defect spec 040 closes.
// Precedencia: --ref explícito, luego el tag de la propia versión, luego la rama por
// defecto. Esta última es un fallback y se anuncia: uno silencioso reintroduciría el
// defecto que la spec 040 cierra.
function resolveRef() {
  const explicit = flags.get("ref");
  if (explicit !== undefined) {
    if (explicit === "true") {
      throw new Error("--ref needs a git ref / --ref necesita una ref de git: --ref <git-ref>");
    }
    if (!remoteHas(explicit)) {
      throw new Error(
        [
          `--ref ${explicit}: no such ref in ${REPO}`,
          `--ref ${explicit}: no existe esa ref en ${REPO}`,
          "",
          "Nothing was installed. An explicit --ref never falls back to another ref.",
          "No se instaló nada. Un --ref explícito nunca cae a otra ref."
        ].join("\n")
      );
    }
    return { ref: explicit, reason: `--ref ${explicit}` };
  }

  const tag = `v${VERSION}`;
  if (remoteHas(`refs/tags/${tag}`)) {
    return { ref: tag, reason: `tag ${tag} (create-sdd-project ${VERSION})` };
  }
  return {
    ref: null,
    reason: "default branch / rama por defecto",
    warning: [
      `⚠ Tag ${tag} does not exist in the remote: installing from the default branch instead.`,
      `⚠ El tag ${tag} no existe en el remoto: se instala desde la rama por defecto.`,
      "  What you get is whatever the branch holds right now, which may not match any",
      "  published package. Pass --ref <git-ref> to choose deliberately.",
      "  Lo que obtienes es lo que la rama tenga ahora mismo, que puede no coincidir con",
      "  ningún paquete publicado. Usa --ref <git-ref> para elegir a conciencia."
    ].join("\n")
  };
}

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
  npx @juanklagos/create-sdd-project <target-dir> [--mode sidecar|full] [--profile recommended|minimal|full] [--ref <git-ref>] [--yes]

Modes:
  sidecar (default)  SDD artifacts in <target>/spec/, your code stays in the target root
  full               Copy the full standalone template workspace

Options / Opciones:
  --ref <git-ref>    Clone this branch or tag instead of the tag matching this
                     version. Without it, the installer clones v<version> and
                     falls back to the default branch only if that tag is missing,
                     saying so. / Clona esta rama o tag en vez del tag de esta
                     versión.

Examples:
  npx @juanklagos/create-sdd-project my-app
  npx @juanklagos/create-sdd-project . --mode sidecar --yes
  npx @juanklagos/create-sdd-project my-workspace --mode full
  npx @juanklagos/create-sdd-project my-app --ref main
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
    // Spec 029, R6. This used to abort with nothing but "already exists", and
    // since this is the command QUICKSTART and both READMEs teach, the honest
    // conclusion a user drew was that updating is impossible. It is not: it
    // just had another name. Say that name.
    throw new Error(
      [
        `${targetAbs}/spec already exists — not overwriting it.`,
        `${targetAbs}/spec ya existe — no se sobrescribe.`,
        "",
        "To bring an existing install up to date, use the upgrade command:",
        "Para poner al día una instalación existente, usa el comando de actualización:",
        "",
        `  npx @juanklagos/sdd-mcp@latest upgrade --project-root ${targetAbs} --dry-run`,
        "",
        "It reports what it would change first; without --dry-run it repairs the",
        "framework files and never touches yours without --apply.",
        "Primero informa qué cambiaría; sin --dry-run repara los archivos del",
        "framework y nunca toca los tuyos sin --apply."
      ].join("\n")
    );
  }

  const { ref, reason, warning } = resolveRef();
  if (warning) console.log(`\n${warning}`);

  // The ref is printed before any file is copied, always, tag or fallback or --ref:
  // whoever reads this transcript later has to be able to tell where the installed
  // content came from without rerunning anything.
  // La ref se imprime siempre antes de copiar nada: quien lea la transcripción después
  // tiene que poder saber de dónde salió lo instalado sin repetir la instalación.
  console.log(`\n→ Cloning template (depth 1) from ${reason}...`);
  const tmp = mkdtempSync(join(tmpdir(), "sdd-template-"));
  const cloneArgs = ["clone", "--depth", "1"];
  if (ref) cloneArgs.push("--branch", ref);
  execFileSync("git", [...cloneArgs, REPO, tmp], { stdio: "inherit" });

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
