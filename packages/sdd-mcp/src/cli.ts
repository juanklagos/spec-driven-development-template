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
