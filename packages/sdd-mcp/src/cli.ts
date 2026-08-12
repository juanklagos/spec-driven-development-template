// Spec 021. One place decides what the binary was asked to do. index.ts and
// http.ts share it, so the flag list can never drift between two files. The bug
// this fixes: an unknown flag (a typo, a flag from a newer version reaching an
// older cached one) fell through to the stdio transport, which then produced
// zero bytes and exit 0 — or hung forever on an open pipe. Silence is the worst
// possible answer to "this command does not work".

import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";

export type CliIntent =
  | { kind: "stdio" }
  | { kind: "http" }
  | { kind: "help" }
  | { kind: "version" }
  | { kind: "connect"; clients?: string[]; dryRun: boolean; global: boolean; projectRoot?: string }
  | { kind: "upgrade"; dryRun: boolean; projectRoot?: string; applyPreserved?: string[] }
  | { kind: "unknown"; arg: string };

/**
 * argv (already sliced past node + script) → intent. No arguments keeps today's
 * behaviour exactly: start the stdio transport. `--help`/`-h` and
 * `--version`/`-V` win over everything. `--http` is the only other accepted
 * flag; anything else — including an unknown flag sitting next to `--http` — is
 * reported, never run.
 */
export function parseCliArgs(argv: string[]): CliIntent {
  if (argv.length === 0) return { kind: "stdio" };

  for (const arg of argv) {
    if (arg === "--help" || arg === "-h") return { kind: "help" };
    if (arg === "--version" || arg === "-V") return { kind: "version" };
  }

  if (argv.includes("--http")) {
    const stray = argv.find((arg) => arg !== "--http");
    return stray ? { kind: "unknown", arg: stray } : { kind: "http" };
  }

  // `connect` is a verb, not a flag (spec 032): it writes files instead of
  // starting a transport, so it reads as a command the way `npm install` does.
  if (argv[0] === "connect") {
    let clients: string[] | undefined;
    let dryRun = false;
    let global = false;
    let projectRoot: string | undefined;

    for (let i = 1; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === "--dry-run") {
        dryRun = true;
      } else if (arg === "--global") {
        global = true;
      } else if (arg === "--client" || arg.startsWith("--client=")) {
        const value = arg.startsWith("--client=") ? arg.slice("--client=".length) : argv[++i];
        if (!value) return { kind: "unknown", arg: `${arg} (missing value)` };
        clients = [...(clients ?? []), ...value.split(",").map((c) => c.trim()).filter(Boolean)];
      } else if (arg === "--project-root" || arg.startsWith("--project-root=")) {
        const value = arg.startsWith("--project-root=") ? arg.slice("--project-root=".length) : argv[++i];
        if (!value) return { kind: "unknown", arg: `${arg} (missing value)` };
        projectRoot = value;
      } else {
        return { kind: "unknown", arg };
      }
    }

    return { kind: "connect", clients, dryRun, global, projectRoot };
  }

  // `upgrade` is a verb too (spec 029): the update that used to be an unnamed
  // side effect of reinstalling. Same strict contract as everything else here.
  if (argv[0] === "upgrade") {
    let dryRun = false;
    let projectRoot: string | undefined;
    let applyPreserved: string[] | undefined;

    for (let i = 1; i < argv.length; i++) {
      const arg = argv[i];
      if (arg === "--dry-run") {
        dryRun = true;
      } else if (arg === "--project-root" || arg.startsWith("--project-root=")) {
        const value = arg.startsWith("--project-root=") ? arg.slice("--project-root=".length) : argv[++i];
        if (!value) return { kind: "unknown", arg: `${arg} (missing value)` };
        projectRoot = value;
      } else if (arg === "--apply" || arg.startsWith("--apply=")) {
        const value = arg.startsWith("--apply=") ? arg.slice("--apply=".length) : argv[++i];
        if (!value) return { kind: "unknown", arg: `${arg} (missing value)` };
        applyPreserved = [
          ...(applyPreserved ?? []),
          ...value.split(",").map((item) => item.trim()).filter(Boolean)
        ];
      } else {
        return { kind: "unknown", arg };
      }
    }

    return { kind: "upgrade", dryRun, projectRoot, applyPreserved };
  }

  return { kind: "unknown", arg: argv[0] };
}

/**
 * The package's own version, read from its package.json. Naming the running
 * version in the unknown-flag message is what would have closed the original
 * report in one second instead of a debugging session: the user's npx cache had
 * 2.2.0, `--http` arrived in 2.2.1, and nothing said so.
 */
export function packageVersion(): string {
  try {
    // dist/cli.js → ../package.json is packages/sdd-mcp/package.json.
    const pkgUrl = new URL("../package.json", import.meta.url);
    const pkg = JSON.parse(readFileSync(fileURLToPath(pkgUrl), "utf8")) as { version?: unknown };
    return typeof pkg.version === "string" ? pkg.version : "unknown";
  } catch {
    return "unknown";
  }
}

/** Bilingual usage, including every flag and the env vars that steer startup. */
export function helpText(version: string): string {
  return [
    `sdd-mcp ${version} — SDD MCP server / servidor MCP de SDD`,
    "",
    "USAGE / USO:",
    "  sdd-mcp                 Start the MCP stdio transport (default).",
    "                          Arranca el transporte MCP por stdio (por defecto).",
    "  sdd-mcp --http          Start the HTTP server: builder, dashboard and MCP endpoint.",
    "                          Arranca el servidor HTTP: builder, dashboard y endpoint MCP.",
    "  sdd-mcp connect         Register this workspace in every agent client found",
    "                          (Claude Code, Codex, Cursor, VS Code, Windsurf, Gemini,",
    "                          opencode) and install the /sdd-serve skill.",
    "                          Registra este workspace en cada cliente de agente que",
    "                          encuentre e instala la skill /sdd-serve.",
    "    --client <id[,id]>    Only these clients. / Solo estos clientes.",
    "    --dry-run             Show what it would write, write nothing.",
    "                          Muestra qué escribiría, sin escribir nada.",
    "    --global              User-level config instead of this project.",
    "                          Config de usuario en vez de este proyecto.",
    "    --project-root <path> Workspace to register. / Workspace a registrar.",
    "  sdd-mcp upgrade         Bring this project's SDD sidecar up to this version:",
    "                          repairs framework files, never touches yours without",
    "                          --apply. Actualiza el sidecar SDD de este proyecto.",
    "    --dry-run             Report what would change, write nothing.",
    "                          Informa que cambiaria, sin escribir nada.",
    "    --apply <path[,path]> Overwrite these user-owned files too.",
    "                          Sobrescribe tambien estos archivos propios.",
    "    --project-root <path> Project to upgrade. / Proyecto a actualizar.",
    "  sdd-mcp --help, -h      Show this help and exit. / Muestra esta ayuda y sale.",
    "  sdd-mcp --version, -V   Print the version and exit. / Imprime la versión y sale.",
    "",
    "ENVIRONMENT / ENTORNO:",
    "  SDD_PROJECT_ROOT        Workspace to operate on. / Workspace sobre el que opera.",
    "  SDD_MCP_HTTP_PORT       HTTP port (default 3334). / Puerto HTTP (por defecto 3334).",
    ""
  ].join("\n");
}

/**
 * The message for an argument the binary does not know. Names the argument and
 * the running version — the two facts the original silent failure hid — and how
 * to move forward. Goes to stderr; the caller sets a non-zero exit code.
 */
export function unknownArgMessage(arg: string, version: string): string {
  return [
    `sdd-mcp: unknown argument "${arg}" (running version ${version}).`,
    `sdd-mcp: argumento desconocido «${arg}» (versión en ejecución ${version}).`,
    "",
    "If you expected a newer flag, your npx cache may hold an older version. Pin it:",
    "Si esperabas una bandera más nueva, tu caché de npx puede tener una versión vieja. Fíjala:",
    "  npx @juanklagos/sdd-mcp@latest --http",
    "",
    "Run `sdd-mcp --help` for the full usage. / Ejecuta `sdd-mcp --help` para el uso completo."
  ].join("\n");
}
