// Spec 032 — connect an agent client to this workspace in one command.
//
// Three things stood between a user and a working agent: finding where their
// client keeps its MCP config (seven different files, four different root
// keys, two formats), registering the server there by hand, and then typing
// the queue-serving prompt every session. This module owns the first two and
// emits the third as a skill/command the client can invoke by name.
//
// Two rules govern every write here, because we are editing files we did not
// create:
//   1. MERGE, never template. We parse, place our one entry, re-serialise.
//      Everything else in the file survives byte-for-byte where the format
//      allows it.
//   2. What we cannot parse, we do not touch. A broken config is reported and
//      skipped — never overwritten with a "clean" one.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { resolveSddRoot } from "./workspace.js";

/** The npm spec used in every generated config. One place to bump it. */
const MCP_PACKAGE = "@juanklagos/sdd-mcp@latest";
const SERVER_KEY = "sdd";
const SKILL_NAME = "sdd-serve";

// --- The loop instructions: ONE source for every surface --------------------
//
// The skill, both native commands and the MCP prompt (packages/sdd-mcp) all
// render from here, so the contract cannot drift between the way a user
// happens to invoke it.

const SKILL_DESCRIPTION =
  "Serve the SDD Builder's AI request queue: claim requests with sdd_next_request, draft the proposal, answer with sdd_respond_request. Never writes spec files — the user accepts each proposal in the builder. Use when the user asks to attend, serve or listen to the SDD board queue. / Atiende la cola de peticiones del SDD Builder.";

export const SERVE_QUEUE_INSTRUCTIONS = {
  es: [
    "Atiende la cola de peticiones de IA del SDD Builder.",
    "",
    "Bucle:",
    "1. Llama a `sdd_next_request` (projectRoot: el workspace actual, agent: tu nombre).",
    "2. Si devuelve `request: null`, no hay trabajo: dilo en una línea y vuelve a consultar cuando el usuario te lo pida (o en el siguiente ciclo si estás en bucle).",
    "3. Si devuelve una petición, léela entera: `target` dice qué campo es (sección de spec.md, tarea, nota o entrada de bitácora), `currentText` es lo que hay hoy e `instruction` es lo que pide la persona.",
    "4. Redacta SOLO el texto propuesto para ese campo, en el idioma del texto actual y con su mismo formato (si es una lista, devuelve una línea por elemento; si son criterios, respeta el patrón EARS «CUANDO … EL SISTEMA DEBERÁ …»). Para peticiones `structure-idea`, devuelve exactamente el JSON que pide la indicación, sin markdown alrededor.",
    "5. Responde con `sdd_respond_request` (id de la petición, proposal: tu texto).",
    "6. Repite desde el paso 1.",
    "",
    "Reglas duras:",
    "- NO escribas ningún archivo bajo `specs/` ni uses las tools de escritura de specs. Tu propuesta no se aplica: la persona la revisa como diff en el builder y solo su aceptación escribe.",
    "- No inventes contexto que no esté en la petición ni en el workspace; si algo es ambiguo, propón la mejor versión y dilo en una frase al final de la propuesta.",
    "- No pidas permiso entre peticiones: el permiso ya es el botón Aceptar del builder."
  ].join("\n"),
  en: [
    "Serve the SDD Builder's AI request queue.",
    "",
    "Loop:",
    "1. Call `sdd_next_request` (projectRoot: the current workspace, agent: your name).",
    "2. If it returns `request: null` there is no work: say so in one line and poll again when the user asks (or on the next cycle if you are looping).",
    "3. If it returns a request, read all of it: `target` says which field it is (spec.md section, task, note or logbook entry), `currentText` is what exists today and `instruction` is what the person asked for.",
    "4. Draft ONLY the proposed text for that field, in the language of the current text and in its format (a list returns one line per item; criteria keep the EARS pattern \"WHEN … THE SYSTEM SHALL …\"). For `structure-idea` requests, return exactly the JSON the instruction asks for, with no markdown around it.",
    "5. Answer with `sdd_respond_request` (the request id, proposal: your text).",
    "6. Repeat from step 1.",
    "",
    "Hard rules:",
    "- Do NOT write any file under `specs/` and do not use the spec-writing tools. Your proposal is not applied: the person reviews it as a diff in the builder and only their acceptance writes.",
    "- Do not invent context that is not in the request or the workspace; if something is ambiguous, propose the best version and say so in one sentence at the end.",
    "- Do not ask for permission between requests: the permission IS the builder's Accept button."
  ].join("\n")
};

/** The portable SKILL.md (open standard: `name` + `description` frontmatter). */
export function renderSkillFile(): string {
  return [
    "---",
    `name: ${SKILL_NAME}`,
    `description: ${SKILL_DESCRIPTION}`,
    "---",
    "",
    "# Serve the SDD queue / Atiende la cola SDD",
    "",
    SERVE_QUEUE_INSTRUCTIONS.en,
    "",
    "---",
    "",
    SERVE_QUEUE_INSTRUCTIONS.es,
    ""
  ].join("\n");
}

/** Gemini CLI custom command: TOML with `description` + `prompt`. */
function renderGeminiCommand(): string {
  const escaped = `${SERVE_QUEUE_INSTRUCTIONS.en}\n\n---\n\n${SERVE_QUEUE_INSTRUCTIONS.es}`;
  return [
    'description = "Serve the SDD Builder queue / Atiende la cola del SDD Builder"',
    'prompt = """',
    escaped,
    '"""',
    ""
  ].join("\n");
}

/** opencode custom command: markdown with frontmatter, body is the template. */
function renderOpencodeCommand(): string {
  return [
    "---",
    "description: Serve the SDD Builder queue / Atiende la cola del SDD Builder",
    "---",
    "",
    SERVE_QUEUE_INSTRUCTIONS.en,
    "",
    "---",
    "",
    SERVE_QUEUE_INSTRUCTIONS.es,
    ""
  ].join("\n");
}

// --- Client catalogue -------------------------------------------------------

export type ConfigFormat = "json" | "toml";

export interface AgentClient {
  id: string;
  label: string;
  /** Project-relative config file. */
  configFile: string;
  /** Home-relative config file for --global; absent when the client has none. */
  globalConfigFile?: string;
  format: ConfigFormat;
  /** Key path of the server entry inside the config document. */
  keyPath: string[];
  /** Shape of the entry value (clients disagree on more than the key). */
  entryShape: "stdio" | "opencode";
  /** Project-relative marker whose existence means "this client is here". */
  detectPath: string;
  /** Project-relative skills dir when the client reads the SKILL.md standard. */
  skillsDir?: string;
  /** Native command file for clients that do not read SKILL.md. */
  nativeCommand?: { file: string; render: () => string };
  /** The one-liner shown in docs and in the builder's connect panel. */
  serveHint: string;
}

export const AGENT_CLIENTS: AgentClient[] = [
  {
    id: "claude-code",
    label: "Claude Code",
    configFile: ".mcp.json",
    globalConfigFile: ".claude.json",
    format: "json",
    keyPath: ["mcpServers", SERVER_KEY],
    entryShape: "stdio",
    detectPath: ".claude",
    skillsDir: ".claude/skills",
    serveHint: "/sdd-serve"
  },
  {
    id: "codex",
    label: "Codex",
    configFile: ".codex/config.toml",
    globalConfigFile: ".codex/config.toml",
    format: "toml",
    keyPath: ["mcp_servers", SERVER_KEY],
    entryShape: "stdio",
    detectPath: ".codex",
    skillsDir: ".codex/skills",
    serveHint: "/sdd-serve"
  },
  {
    id: "cursor",
    label: "Cursor",
    configFile: ".cursor/mcp.json",
    globalConfigFile: ".cursor/mcp.json",
    format: "json",
    keyPath: ["mcpServers", SERVER_KEY],
    entryShape: "stdio",
    detectPath: ".cursor",
    skillsDir: ".cursor/skills",
    serveHint: "/sdd-serve"
  },
  {
    id: "vscode",
    label: "VS Code",
    // VS Code reads MCP config per workspace only, and its root key is
    // `servers` — the single most common reason a hand-written config there
    // silently does nothing.
    configFile: ".vscode/mcp.json",
    format: "json",
    keyPath: ["servers", SERVER_KEY],
    entryShape: "stdio",
    detectPath: ".vscode",
    serveHint: "/mcp.sdd.sdd_serve_requests"
  },
  {
    id: "windsurf",
    label: "Windsurf",
    configFile: ".windsurf/mcp_config.json",
    globalConfigFile: ".codeium/windsurf/mcp_config.json",
    format: "json",
    keyPath: ["mcpServers", SERVER_KEY],
    entryShape: "stdio",
    detectPath: ".windsurf",
    serveHint: "sdd_serve_requests"
  },
  {
    id: "gemini",
    label: "Gemini CLI",
    configFile: ".gemini/settings.json",
    globalConfigFile: ".gemini/settings.json",
    format: "json",
    keyPath: ["mcpServers", SERVER_KEY],
    entryShape: "stdio",
    detectPath: ".gemini",
    nativeCommand: { file: ".gemini/commands/sdd/serve.toml", render: renderGeminiCommand },
    serveHint: "/sdd:serve"
  },
  {
    id: "opencode",
    label: "opencode",
    configFile: "opencode.json",
    globalConfigFile: ".config/opencode/opencode.json",
    format: "json",
    keyPath: ["mcp", SERVER_KEY],
    entryShape: "opencode",
    detectPath: ".opencode",
    nativeCommand: { file: ".opencode/command/sdd-serve.md", render: renderOpencodeCommand },
    serveHint: "/sdd-serve"
  }
];

/** Repo-standard skills location, read by Codex and the open standard. */
const STANDARD_SKILLS_DIR = ".agents/skills";

// --- Entry values -----------------------------------------------------------

function mcpEntry(client: AgentClient, projectRoot: string): Record<string, unknown> {
  const env = { SDD_PROJECT_ROOT: projectRoot };
  if (client.entryShape === "opencode") {
    // opencode takes one `command` array and calls the transport `type`.
    return { type: "local", command: ["npx", "-y", MCP_PACKAGE], enabled: true, environment: env };
  }
  return { command: "npx", args: ["-y", MCP_PACKAGE], env };
}

// --- Results ----------------------------------------------------------------

export type ConnectStatus = "created" | "updated" | "unchanged" | "planned" | "error";
export type ConnectKind = "mcp" | "skill" | "command";

export interface ConnectResult {
  clientId: string;
  clientLabel: string;
  kind: ConnectKind;
  /** Absolute path of the file this result is about. */
  file: string;
  status: ConnectStatus;
  /** Error message when status is "error"; short note otherwise. */
  detail?: string;
}

export interface ConnectOptions {
  /** Explicit client ids; when omitted, detection decides. */
  clients?: string[];
  /** Write user-level config instead of project-level. */
  global?: boolean;
}

// --- File helpers -----------------------------------------------------------

async function readIfExists(file: string): Promise<string | null> {
  try {
    return await fs.readFile(file, "utf8");
  } catch {
    return null;
  }
}

async function atomicWrite(file: string, content: string): Promise<void> {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const tmp = `${file}.tmp-${process.pid}-${Date.now()}`;
  try {
    await fs.writeFile(tmp, content, "utf8");
    await fs.rename(tmp, file);
  } finally {
    await fs.rm(tmp, { force: true }).catch(() => {});
  }
}

function setDeep(doc: Record<string, unknown>, keyPath: string[], value: unknown): void {
  let cursor = doc;
  for (const key of keyPath.slice(0, -1)) {
    const next = cursor[key];
    if (typeof next !== "object" || next === null || Array.isArray(next)) {
      cursor[key] = {};
    }
    cursor = cursor[key] as Record<string, unknown>;
  }
  cursor[keyPath[keyPath.length - 1]] = value;
}

function getDeep(doc: Record<string, unknown>, keyPath: string[]): unknown {
  let cursor: unknown = doc;
  for (const key of keyPath) {
    if (typeof cursor !== "object" || cursor === null) return undefined;
    cursor = (cursor as Record<string, unknown>)[key];
  }
  return cursor;
}

/** Detect the file's indent so a merged file keeps looking like the user's. */
function detectIndent(raw: string): number {
  const match = /\n(\s+)"/.exec(raw);
  return match ? match[1].replace(/\n/g, "").length || 2 : 2;
}

// --- TOML: one flat table, written and replaced by hand ---------------------
//
// We emit exactly one table with scalar/array values, so a dependency for this
// would not pay for itself. We never re-serialise the rest of the document:
// foreign tables are copied through as the literal text the user wrote.

function renderTomlTable(header: string, entry: Record<string, unknown>): string {
  const lines = [`[${header}]`];
  for (const [key, value] of Object.entries(entry)) {
    if (typeof value === "string") {
      lines.push(`${key} = ${JSON.stringify(value)}`);
    } else if (Array.isArray(value)) {
      lines.push(`${key} = [${value.map((v) => JSON.stringify(v)).join(", ")}]`);
    } else if (value && typeof value === "object") {
      const inline = Object.entries(value as Record<string, string>)
        .map(([k, v]) => `${k} = ${JSON.stringify(v)}`)
        .join(", ");
      lines.push(`${key} = { ${inline} }`);
    }
  }
  return lines.join("\n");
}

/** Replace `[header]`'s body, or append the table when it is not there yet. */
function mergeToml(raw: string, header: string, entry: Record<string, unknown>): string {
  const table = renderTomlTable(header, entry);
  const escaped = header.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  // The table runs from its header to the next header at line start, or to the
  // true end of the document. `\Z` does not exist in JS regex (it matched a
  // literal "Z"), so end-of-string is `$` guarded by a lookahead — without it,
  // a table sitting last in the file was never found and got duplicated.
  const existing = new RegExp(`^\\[${escaped}\\]\\s*$[\\s\\S]*?(?=^\\[|$(?![\\s\\S]))`, "m");
  if (existing.test(raw)) {
    // Exactly one trailing newline, or re-running would keep appending blank
    // lines and every run would report "updated" instead of "unchanged".
    return raw.replace(existing, `${table}\n\n`).replace(/\s*$/, "\n");
  }
  const separator = raw.length === 0 || raw.endsWith("\n\n") ? "" : raw.endsWith("\n") ? "\n" : "\n\n";
  return `${raw}${separator}${table}\n`;
}

// --- Planning ---------------------------------------------------------------

interface PlannedWrite {
  result: Omit<ConnectResult, "status">;
  /** Absent when the file must not be written (unchanged or error). */
  content?: string;
  status: ConnectStatus;
}

function planFile(file: string, existing: string | null, next: string, base: Omit<ConnectResult, "status">): PlannedWrite {
  if (existing === next) return { result: base, status: "unchanged" };
  return { result: base, content: next, status: existing === null ? "created" : "updated" };
}

async function planClient(
  client: AgentClient,
  projectRoot: string,
  targetRoot: string,
  options: ConnectOptions
): Promise<PlannedWrite[]> {
  const writes: PlannedWrite[] = [];
  const relConfig = options.global ? (client.globalConfigFile ?? client.configFile) : client.configFile;
  const configPath = path.join(targetRoot, relConfig);
  const base = { clientId: client.id, clientLabel: client.label, kind: "mcp" as const, file: configPath };

  const raw = await readIfExists(configPath);
  const entry = mcpEntry(client, projectRoot);

  if (client.format === "json") {
    let doc: Record<string, unknown> = {};
    if (raw !== null && raw.trim() !== "") {
      try {
        const parsed = JSON.parse(raw) as unknown;
        if (typeof parsed !== "object" || parsed === null || Array.isArray(parsed)) {
          throw new Error("expected a JSON object at the root");
        }
        doc = parsed as Record<string, unknown>;
      } catch (error) {
        writes.push({
          result: { ...base, detail: error instanceof Error ? error.message : String(error) },
          status: "error"
        });
        doc = {};
        // Fall through to the skill/command writes: one broken file must not
        // cost the user the rest of the setup.
        return [...writes, ...planAssets(client, targetRoot)];
      }
    }
    const current = getDeep(doc, client.keyPath);
    if (JSON.stringify(current) === JSON.stringify(entry)) {
      writes.push({ result: base, status: "unchanged" });
    } else {
      setDeep(doc, client.keyPath, entry);
      const indent = raw ? detectIndent(raw) : 2;
      writes.push(planFile(configPath, raw, `${JSON.stringify(doc, null, indent)}\n`, base));
    }
  } else {
    const header = client.keyPath.join(".");
    const next = mergeToml(raw ?? "", header, entry);
    writes.push(planFile(configPath, raw, next, base));
  }

  return [...writes, ...planAssets(client, targetRoot)];
}

/** Skill + native command writes for one client (never format-dependent). */
function planAssets(client: AgentClient, targetRoot: string): PlannedWrite[] {
  const writes: PlannedWrite[] = [];
  if (client.skillsDir) {
    const file = path.join(targetRoot, client.skillsDir, SKILL_NAME, "SKILL.md");
    writes.push({
      result: { clientId: client.id, clientLabel: client.label, kind: "skill", file },
      content: renderSkillFile(),
      status: "created"
    });
  }
  if (client.nativeCommand) {
    const file = path.join(targetRoot, client.nativeCommand.file);
    writes.push({
      result: { clientId: client.id, clientLabel: client.label, kind: "command", file },
      content: client.nativeCommand.render(),
      status: "created"
    });
  }
  return writes;
}

async function settleStatus(write: PlannedWrite): Promise<PlannedWrite> {
  if (write.content === undefined) return write;
  const existing = await readIfExists(write.result.file);
  if (existing === write.content) return { ...write, content: undefined, status: "unchanged" };
  return { ...write, status: existing === null ? "created" : "updated" };
}

async function isPresent(targetRoot: string, client: AgentClient): Promise<boolean> {
  return fs
    .access(path.join(targetRoot, client.detectPath))
    .then(() => true)
    .catch(() => false);
}

async function selectClients(targetRoot: string, options: ConnectOptions): Promise<AgentClient[]> {
  if (options.clients && options.clients.length > 0) {
    const wanted = new Set(options.clients);
    const known = AGENT_CLIENTS.filter((c) => wanted.has(c.id));
    const unknown = [...wanted].filter((id) => !AGENT_CLIENTS.some((c) => c.id === id));
    if (unknown.length > 0) {
      throw new Error(
        `Unknown client(s): ${unknown.join(", ")}. Known: ${AGENT_CLIENTS.map((c) => c.id).join(", ")}.`
      );
    }
    return known;
  }
  const present = await Promise.all(AGENT_CLIENTS.map(async (c) => ((await isPresent(targetRoot, c)) ? c : null)));
  return present.filter((c): c is AgentClient => c !== null);
}

async function buildPlan(projectRoot: string, options: ConnectOptions): Promise<PlannedWrite[]> {
  // resolveSddRoot only VALIDATES that this is a real SDD workspace. It must
  // not become the target: in a sidecar project it returns `<project>/spec`,
  // and both the client configs (.cursor/, .codex/ …) and SDD_PROJECT_ROOT
  // belong at the project root — the MCP server finds the sidecar by itself.
  await resolveSddRoot(projectRoot);
  const registeredRoot = path.resolve(projectRoot);
  const targetRoot = options.global ? os.homedir() : registeredRoot;
  const clients = await selectClients(targetRoot, options);
  if (clients.length === 0) return [];

  const perClient = await Promise.all(clients.map((c) => planClient(c, registeredRoot, targetRoot, options)));
  const writes = perClient.flat();

  // The repo-standard skills location, written once when any skill-capable
  // client is in play (Codex reads it, and it is where the open standard says
  // team skills live).
  if (clients.some((c) => c.skillsDir)) {
    writes.push({
      result: {
        clientId: "standard",
        clientLabel: "Agent Skills (standard)",
        kind: "skill",
        file: path.join(targetRoot, STANDARD_SKILLS_DIR, SKILL_NAME, "SKILL.md")
      },
      content: renderSkillFile(),
      status: "created"
    });
  }

  return Promise.all(writes.map(settleStatus));
}

// --- Public API -------------------------------------------------------------

/** What `connect` WOULD do. Writes nothing (R8). */
export async function planConnect(projectRoot: string, options: ConnectOptions = {}): Promise<ConnectResult[]> {
  const plan = await buildPlan(projectRoot, options);
  return plan.map((write) => ({
    ...write.result,
    // A dry run reports intent, not outcome: "planned" for anything that would
    // be written, and the real status for what is already in place.
    status: write.content === undefined && write.status === "unchanged" ? "unchanged" : "planned"
  }));
}

/** Apply the plan. Returns one result per file touched or skipped (R11). */
export async function applyConnect(projectRoot: string, options: ConnectOptions = {}): Promise<ConnectResult[]> {
  const plan = await buildPlan(projectRoot, options);
  const results: ConnectResult[] = [];
  for (const write of plan) {
    if (write.content === undefined) {
      results.push({ ...write.result, status: write.status });
      continue;
    }
    try {
      await atomicWrite(write.result.file, write.content);
      results.push({ ...write.result, status: write.status });
    } catch (error) {
      results.push({
        ...write.result,
        status: "error",
        detail: error instanceof Error ? error.message : String(error)
      });
    }
  }
  return results;
}

/** Manual instructions, for the "no client detected" path (R9) and the docs. */
export function manualInstructions(projectRoot: string): Array<{ client: AgentClient; file: string; snippet: string }> {
  return AGENT_CLIENTS.map((client) => {
    const entry = mcpEntry(client, projectRoot);
    const snippet =
      client.format === "toml"
        ? renderTomlTable(client.keyPath.join("."), entry)
        : JSON.stringify(
            client.keyPath.reduceRight<unknown>((acc, key) => ({ [key]: acc }), entry),
            null,
            2
          );
    return { client, file: client.configFile, snippet };
  });
}
