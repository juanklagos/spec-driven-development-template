#!/usr/bin/env node
// Protocol-level probe of a packaged .mcpb server, over stdio.
//
// Spec 011 R7. This answers everything that can be answered WITHOUT a host:
// does the packaged server start, is ui://sdd/board.html listed and readable,
// is the ext-apps bridge inlined (ui:// resources must be self-contained), and
// does sdd_board_app carry _meta.ui.resourceUri so the host knows to render it.
//
// What it deliberately does NOT answer: whether the host actually renders the
// iframe. That is the open question (modelcontextprotocol/ext-apps#165 reports
// the ui:// handshake never completing over stdio in Claude Desktop, while the
// same pattern works over HTTP) and it can only be settled by installing the
// bundle and looking. A green run here is a precondition, not a verdict.
//
// Sonda a nivel de protocolo del servidor empaquetado. Verde aquí NO significa
// que la vista renderice en el host: eso solo se comprueba instalando y mirando.
//
// Usage / Uso:
//   node scripts/probe-mcpb-stdio.mjs <entry.js> <projectRoot>

import { spawn } from "node:child_process";

const [entry, projectRoot] = process.argv.slice(2);
if (!entry || !projectRoot) {
  console.error("Usage: node scripts/probe-mcpb-stdio.mjs <entry.js> <projectRoot>");
  process.exit(2);
}

const REQUEST_TIMEOUT_MS = 15_000;
const BOARD_URI = "ui://sdd/board.html";

const child = spawn("node", [entry], { stdio: ["pipe", "pipe", "pipe"] });
const pending = new Map();
let buffer = "";

child.stdout.on("data", (chunk) => {
  buffer += chunk.toString();
  let newline;
  while ((newline = buffer.indexOf("\n")) >= 0) {
    const line = buffer.slice(0, newline).trim();
    buffer = buffer.slice(newline + 1);
    if (!line) continue;
    let message;
    try {
      message = JSON.parse(line);
    } catch {
      continue; // not a JSON-RPC frame; the server logs on stderr, not here
    }
    const settle = pending.get(message.id);
    if (settle) {
      pending.delete(message.id);
      settle(message);
    }
  }
});
child.stderr.on("data", (data) => process.stderr.write(`[server] ${data}`));

let nextId = 1;
function send(method, params) {
  const id = nextId++;
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      pending.delete(id);
      reject(new Error(`timeout after ${REQUEST_TIMEOUT_MS}ms on ${method}`));
    }, REQUEST_TIMEOUT_MS);
    pending.set(id, (message) => {
      clearTimeout(timer);
      if (message.error) reject(new Error(`${method}: ${JSON.stringify(message.error)}`));
      else resolve(message.result);
    });
    child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", id, method, params })}\n`);
  });
}

const checks = [];
function check(label, ok, detail = "") {
  checks.push(ok);
  console.log(`${ok ? "PASS" : "FAIL"}  ${label}${detail ? ` — ${detail}` : ""}`);
}

try {
  const init = await send("initialize", {
    protocolVersion: "2026-01-26",
    capabilities: {},
    clientInfo: { name: "sdd-mcpb-probe", version: "1" }
  });
  child.stdin.write(`${JSON.stringify({ jsonrpc: "2.0", method: "notifications/initialized", params: {} })}\n`);
  check("server initializes over stdio", true, `${init.serverInfo?.name} ${init.serverInfo?.version}`);

  const { resources } = await send("resources/list", {});
  const listed = resources.find((resource) => resource.uri === BOARD_URI);
  check(`${BOARD_URI} is listed`, Boolean(listed), listed?.mimeType ?? "not found");

  const read = await send("resources/read", { uri: BOARD_URI });
  const html = read.contents?.[0]?.text ?? "";
  check("ui:// resource reads", html.length > 0, `${html.length} bytes, mime ${read.contents?.[0]?.mimeType}`);
  // A CDN reference would break inside the host's sandboxed iframe.
  check("ext-apps bridge is inlined", html.includes("__MCP_EXT_APPS__"));
  check("view is self-contained", !/src=["']https?:/i.test(html), "no external script src");

  const { tools } = await send("tools/list", {});
  const boardTool = tools.find((tool) => tool.name === "sdd_board_app");
  check("sdd_board_app exists", Boolean(boardTool));
  check(
    "tool links the view via _meta.ui.resourceUri",
    boardTool?._meta?.ui?.resourceUri === BOARD_URI,
    boardTool?._meta?.ui?.resourceUri ?? "missing"
  );

  const call = await send("tools/call", { name: "sdd_board_app", arguments: { projectRoot } });
  const board = call.structuredContent?.board;
  check("tool returns real board data", Boolean(board), board ? `gate ${call.structuredContent?.gate?.status ?? "?"}` : "no board");
} catch (error) {
  check("probe completed", false, error.message ?? String(error));
} finally {
  child.kill();
}

const failed = checks.filter((ok) => !ok).length;
console.log(`\n${checks.length - failed}/${checks.length} checks passed`);
console.log("Host rendering of the view is NOT covered here — install the bundle and look.");
process.exit(failed ? 1 : 0);
