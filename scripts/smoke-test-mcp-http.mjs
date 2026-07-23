// Smoke test for the Streamable HTTP transport.
//
// Beyond the protocol surface (tools/resources/prompts) this asserts the
// hardening of packages/sdd-mcp/src/security.ts, http-utils.ts and
// transport.ts. Every guard below fails on the pre-hardening server:
//   - C3 bind host: the server used to listen on 0.0.0.0 while printing
//     127.0.0.1, so the whole board was readable from the LAN.
//   - C3 CSRF: any page could POST /api/spec and /api/spec/:id/approve.
//   - C4 body cap: one unauthenticated oversized POST killed the process.
//   - I15 sessions: MCP sessions were never reclaimed.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawn } from "node:child_process";
import { promises as fs } from "node:fs";
import http from "node:http";
import os from "node:os";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };

/**
 * Ports are reserved from the OS, not hardcoded.
 *
 * They used to be 3334-3337. Since spec 023 R2 the server falls back to the
 * next free port instead of failing, so a developer with their own `sdd-mcp
 * --http` already on 3334 no longer got a crash here — they got a server on
 * 3335 and an assertion about a banner that named the port the test wanted
 * rather than the one it had. The environment is not the test's to own.
 */
async function reservePort() {
  const probe = http.createServer();
  try {
    await new Promise((resolve, reject) => {
      probe.once("error", reject);
      probe.listen(0, "127.0.0.1", resolve);
    });
    return probe.address().port;
  } finally {
    await new Promise((resolve) => probe.close(resolve));
  }
}

const port = await reservePort();
/** Short-lived server used only for the session-reclamation asserts. */
const sessionPort = await reservePort();
/** Short-lived control server, proves the LAN probe below is not vacuous. */
const exposedPort = await reservePort();
/** Short-lived server pointed at a throwaway SDD workspace (REST routes). */
const restPort = await reservePort();

const children = new Set();

function startServer(serverPort, extraEnv = {}) {
  const child = spawn("node", ["packages/sdd-mcp/dist/http.js"], {
    cwd: process.cwd(),
    env: { ...process.env, SDD_MCP_HTTP_PORT: String(serverPort), ...extraEnv },
    stdio: ["ignore", "pipe", "pipe"]
  });
  children.add(child);

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  // Readiness is "the port answers", not "stderr contains a sentence".
  //
  // This used to poll for "SDD MCP Streamable HTTP server listening" — a string
  // the server stopped printing when spec 020 rewrote the banner, and which
  // `git grep` now finds only here. The test did not fail loudly at that point;
  // it timed out after 15s, every run, on a green-looking refactor. A readiness
  // check coupled to human-facing prose is a check that expires silently the
  // first time somebody improves the wording.
  const ready = new Promise((resolve, reject) => {
    const deadline = Date.now() + 15000;
    let settled = false;
    const finish = (fn, value) => {
      if (settled) return;
      settled = true;
      clearInterval(poll);
      fn(value);
    };

    const poll = setInterval(() => {
      if (Date.now() > deadline) {
        finish(reject, new Error(`Timed out waiting for HTTP MCP server on ${serverPort}\n${stderr}`));
        return;
      }
      const probe = http.request(
        { host: "127.0.0.1", port: serverPort, path: "/api/gate", method: "GET", timeout: 500 },
        (res) => {
          res.resume();
          finish(resolve, undefined);
        }
      );
      probe.on("timeout", () => probe.destroy());
      // Connection refused while it is still binding: keep polling.
      probe.on("error", () => {});
      probe.end();
    }, 100);

    child.on("exit", (code) => {
      finish(reject, new Error(`HTTP MCP server on ${serverPort} exited early with code ${code}\n${stderr}`));
    });
  });

  return {
    child,
    ready,
    get stderr() {
      return stderr;
    },
    alive: () => child.exitCode === null && !child.killed,
    stop: () => {
      child.kill();
      children.delete(child);
    }
  };
}

function killAll() {
  for (const child of children) child.kill();
  children.clear();
}

function assert(condition, message) {
  if (!condition) throw new Error(`Assertion failed: ${message}`);
}

/** Raw request so we can set headers (content-length) that fetch forbids. */
function rawRequest({ host = "127.0.0.1", port: targetPort, path, method = "GET", headers = {}, body, writeBytes, timeout = 10000 }) {
  return new Promise((resolve) => {
    const req = http.request({ host, port: targetPort, path, method, headers, timeout }, (res) => {
      let text = "";
      res.setEncoding("utf8");
      res.on("data", (chunk) => {
        text += chunk;
      });
      res.on("end", () => resolve({ status: res.statusCode, body: text, headers: res.headers }));
    });
    req.on("error", (error) => resolve({ status: 0, error: error.code ?? error.message, body: "" }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, error: "ETIMEDOUT", body: "" });
    });

    if (writeBytes) {
      const chunk = Buffer.alloc(1024 * 1024, 0x61);
      let written = 0;
      const pump = () => {
        while (written < writeBytes) {
          written += chunk.length;
          if (!req.write(chunk)) {
            req.once("drain", pump);
            return;
          }
        }
        req.end();
      };
      pump();
      return;
    }

    if (body !== undefined) req.write(body);
    req.end();
  });
}

function firstNonLoopbackIpv4() {
  for (const addresses of Object.values(os.networkInterfaces())) {
    for (const address of addresses ?? []) {
      if (address.family === "IPv4" && !address.internal) return address.address;
    }
  }
  return null;
}

async function initMcpSession(targetPort) {
  const res = await rawRequest({
    port: targetPort,
    path: "/mcp",
    method: "POST",
    headers: { "content-type": "application/json", accept: "application/json, text/event-stream" },
    body: JSON.stringify({
      jsonrpc: "2.0",
      id: 1,
      method: "initialize",
      params: { protocolVersion: "2025-06-18", capabilities: {}, clientInfo: { name: "sdd-session-probe", version: "1" } }
    })
  });
  return res.headers?.["mcp-session-id"];
}

async function callToolsList(targetPort, sessionId) {
  const res = await rawRequest({
    port: targetPort,
    path: "/mcp",
    method: "POST",
    headers: {
      "content-type": "application/json",
      accept: "application/json, text/event-stream",
      "mcp-session-id": sessionId
    },
    body: JSON.stringify({ jsonrpc: "2.0", id: 2, method: "tools/list" })
  });
  return res.status;
}

// --- Protocol surface -------------------------------------------------------

async function checkProtocolSurface() {
  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
  const client = new Client({ name: "sdd-mcp-http-smoke-test", version: packageJson.version }, { capabilities: {} });

  await client.connect(transport);

  const tools = await client.listTools();
  const templates = await client.listResourceTemplates();
  const prompts = await client.listPrompts();

  const toolNames = tools.tools.map((item) => item.name);
  const templateNames = templates.resourceTemplates.map((item) => item.name);
  const promptNames = prompts.prompts.map((item) => item.name);

  assert(toolNames.includes("sdd_generate_status"), "missing HTTP MCP tool sdd_generate_status");
  assert(
    tools.tools.find((item) => item.name === "sdd_validate")?.outputSchema,
    "expected HTTP MCP tool sdd_validate to expose outputSchema"
  );
  for (const templateName of [
    "sdd-project-index",
    "sdd-project-log",
    "sdd-project-latest-handoff",
    "sdd-project-idea",
    "sdd-spec-document"
  ]) {
    assert(templateNames.includes(templateName), `missing HTTP MCP resource template: ${templateName}`);
  }
  assert(promptNames.includes("close_sdd_session"), "missing HTTP MCP prompt close_sdd_session");

  await transport.terminateSession().catch(() => {});
  await transport.close();

  return { toolNames, templateNames, promptNames };
}

// --- C3: bind host ----------------------------------------------------------

async function checkBindHost(server) {
  assert(
    server.stderr.includes(`http://127.0.0.1:${port}/mcp`),
    `startup banner must print the address actually bound; got:\n${server.stderr}`
  );

  const lanIp = firstNonLoopbackIpv4();
  if (!lanIp) {
    console.log("  (no non-loopback IPv4 on this host; LAN reachability probe skipped)");
    return;
  }

  const probe = await rawRequest({ host: lanIp, port, path: "/api/board", timeout: 4000 });
  assert(
    probe.status === 0,
    `server must NOT be reachable on the non-loopback address ${lanIp}:${port} (got HTTP ${probe.status})`
  );

  // Control: the same probe must succeed when the operator opts in, otherwise
  // the assertion above could pass for the wrong reason (e.g. a firewall).
  const exposed = startServer(exposedPort, { SDD_MCP_HTTP_HOST: "0.0.0.0" });
  try {
    await exposed.ready;
    assert(
      exposed.stderr.includes("WARNING: bound to a non-loopback address"),
      "a non-loopback bind must print the no-authentication warning"
    );
    const control = await rawRequest({ host: lanIp, port: exposedPort, path: "/api/board", timeout: 4000 });
    assert(
      control.status !== 0,
      `control probe failed: SDD_MCP_HTTP_HOST=0.0.0.0 should be reachable on ${lanIp}:${exposedPort}`
    );
  } finally {
    exposed.stop();
  }
  console.log(`  loopback-only bind verified against ${lanIp} (control server on 0.0.0.0 was reachable)`);
}

// --- C3: cross-origin / content-type guard ----------------------------------

async function checkOriginGuard() {
  const crossOrigin = await rawRequest({
    port,
    path: "/api/spec",
    method: "POST",
    headers: { "content-type": "text/plain", origin: "https://evil.example" },
    body: JSON.stringify({ name: "csrf-should-never-be-created", owner: "attacker" })
  });
  assert(crossOrigin.status === 403, `cross-origin POST /api/spec must be 403, got ${crossOrigin.status}`);

  const crossOriginApprove = await rawRequest({
    port,
    path: "/api/spec/001-anything/approve",
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://evil.example" },
    body: JSON.stringify({ approver: "attacker" })
  });
  assert(
    crossOriginApprove.status === 403,
    `cross-origin POST /api/spec/:id/approve must be 403, got ${crossOriginApprove.status}`
  );

  const crossOriginIssues = await rawRequest({
    port,
    path: "/api/spec/001-anything/issues",
    method: "POST",
    headers: { origin: "https://evil.example" }
  });
  assert(
    crossOriginIssues.status === 403,
    `cross-origin POST /api/spec/:id/issues must be 403, got ${crossOriginIssues.status}`
  );

  const formContentType = await rawRequest({
    port,
    path: "/api/spec",
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded", origin: `http://127.0.0.1:${port}` },
    body: "name=x"
  });
  assert(formContentType.status === 415, `non-JSON mutating request must be 415, got ${formContentType.status}`);

  // Local-first UX must survive the guard: same-origin and CLI clients pass it.
  // 403/415 would mean the guard rejected them; anything else means it did not.
  const sameOrigin = await rawRequest({
    port,
    path: "/api/spec",
    method: "POST",
    headers: { "content-type": "application/json", origin: `http://127.0.0.1:${port}` },
    body: JSON.stringify({})
  });
  assert(
    sameOrigin.status !== 403 && sameOrigin.status !== 415,
    `same-origin builder request must pass the guard, got ${sameOrigin.status}`
  );

  const viteDevOrigin = await rawRequest({
    port,
    path: "/api/spec",
    method: "POST",
    headers: { "content-type": "application/json", origin: "http://localhost:5173" },
    body: JSON.stringify({})
  });
  assert(
    viteDevOrigin.status !== 403,
    `loopback dev-server origin must pass the guard, got ${viteDevOrigin.status}`
  );

  const noOrigin = await rawRequest({
    port,
    path: "/api/spec",
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({})
  });
  assert(noOrigin.status !== 403, `CLI request without Origin must pass the guard, got ${noOrigin.status}`);

  const readOnly = await rawRequest({ port, path: "/dashboard" });
  assert(readOnly.status === 200, `GET /dashboard must keep working, got ${readOnly.status}`);
}

// --- C4: body cap -----------------------------------------------------------

async function checkBodyCap(server) {
  // Declared oversize: refused before a byte is read, so the client gets 413.
  // Pre-fix this hung forever waiting for 600 MB that never arrived.
  const declared = await rawRequest({
    port,
    path: "/api/board",
    method: "PUT",
    headers: { "content-type": "application/json", "content-length": String(600 * 1024 * 1024) },
    body: "{}"
  });
  assert(declared.status === 413, `declared oversize body must be 413, got ${declared.status} ${declared.error ?? ""}`);

  // Undeclared (chunked) oversize: the socket is destroyed past the cap. Any
  // normal HTTP status here means the body was accepted whole.
  const chunked = await rawRequest({
    port,
    path: "/mcp",
    method: "POST",
    headers: { "content-type": "application/json" },
    writeBytes: 8 * 1024 * 1024
  });
  assert(
    chunked.status === 0 || chunked.status === 413,
    `chunked oversize body must be refused, got HTTP ${chunked.status}`
  );

  assert(server.alive(), "server must survive an oversized request");
  const stillServing = await rawRequest({ port, path: "/dashboard" });
  assert(stillServing.status === 200, `server must keep serving after an oversized request, got ${stillServing.status}`);
}

// --- I14: the REST routes, functionally -------------------------------------
//
// Everything above only ever probed /api/* to see it REJECTED (403/415/413) or
// to prove the port is unreachable. api.ts owns three kinds of logic and none
// of it was covered: the route regexes, the status codes (201 for a created
// spec vs 200 everywhere else) and the body-validation branches (400 before
// any SDD call). The template root answers 422 by design, so this needs a real
// throwaway workspace: resolveSddRoot (packages/sdd-core/src/workspace.ts)
// requires all four of sdd.policy.yaml, specs/, idea/ and bitacora/.

async function makeFixtureWorkspace() {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-http-rest-"));
  for (const dir of ["specs", "idea", "bitacora"]) {
    await fs.mkdir(path.join(root, dir), { recursive: true });
  }
  await fs.cp(path.join(process.cwd(), "specs", "_template"), path.join(root, "specs", "_template"), {
    recursive: true
  });
  await fs.cp(path.join(process.cwd(), "specs", "INDEX.md"), path.join(root, "specs", "INDEX.md"));
  await fs.cp(path.join(process.cwd(), "sdd.policy.yaml"), path.join(root, "sdd.policy.yaml"));
  return root;
}

/** rawRequest + JSON body parsing, aimed at the REST fixture server. */
async function restRequest(path, { method = "GET", body, headers } = {}) {
  const res = await rawRequest({
    port: restPort,
    path,
    method,
    headers: { "content-type": "application/json", ...headers },
    ...(body === undefined ? {} : { body })
  });
  let parsed;
  try {
    parsed = JSON.parse(res.body);
  } catch {
    parsed = undefined;
  }
  return { ...res, json: parsed };
}

/** SSE never ends: resolve on the response head and hang up. */
function headOnlyRequest(targetPort, requestPath) {
  return new Promise((resolve) => {
    const req = http.request({ host: "127.0.0.1", port: targetPort, path: requestPath, timeout: 5000 }, (res) => {
      resolve({ status: res.statusCode, headers: res.headers });
      req.destroy();
    });
    req.on("error", (error) => resolve({ status: 0, error: error.code ?? error.message, headers: {} }));
    req.on("timeout", () => {
      req.destroy();
      resolve({ status: 0, error: "ETIMEDOUT", headers: {} });
    });
    req.end();
  });
}

async function checkRestRoutes() {
  const root = await makeFixtureWorkspace();
  const server = startServer(restPort, { SDD_PROJECT_ROOT: root });
  try {
    await server.ready;

    const board = await restRequest("/api/board");
    assert(board.status === 200, `GET /api/board must be 200, got ${board.status}`);
    assert(board.json?.projectRoot === root, "GET /api/board must report the workspace it was pointed at");
    assert(Array.isArray(board.json?.specs) && board.json.specs.length === 0, "a fresh workspace has no specs");

    const gate = await restRequest("/api/gate");
    assert(gate.status === 200, `GET /api/gate must be 200, got ${gate.status}`);
    assert(typeof gate.json?.ok === "boolean", "GET /api/gate must return a gate summary");

    // Body validation runs BEFORE any SDD call: 400, not 422 and not a crash.
    const noName = await restRequest("/api/spec", { method: "POST", body: "{}" });
    assert(noName.status === 400, `POST /api/spec without a name must be 400, got ${noName.status}`);
    assert(/name/.test(noName.json?.error ?? ""), "the 400 must say which field is missing");

    // 201 is the only "created" status in the API and the builder relies on it.
    const created = await restRequest("/api/spec", {
      method: "POST",
      body: JSON.stringify({ name: "probe feature", owner: "Probe" })
    });
    assert(created.status === 201, `POST /api/spec must be 201 Created, got ${created.status}`);
    const specId = created.json?.specId;
    assert(specId === "001-probe-feature", `unexpected spec id: ${specId}`);

    const detail = await restRequest(`/api/spec/${specId}`);
    assert(detail.status === 200, `GET /api/spec/:id must be 200, got ${detail.status}`);
    assert(detail.json?.id === specId, "GET /api/spec/:id must echo the id");
    assert(/Estado \/ Status/.test(detail.json?.docs?.spec ?? ""), "the spec document must come back whole");
    assert(Array.isArray(detail.json?.tasks) && detail.json.tasks.length > 0, "the scaffolded tasks must parse");

    const badSections = await restRequest(`/api/spec/${specId}/sections`, { method: "PUT", body: '"nope"' });
    assert(badSections.status === 400, `PUT sections with a non-object body must be 400, got ${badSections.status}`);

    const sections = await restRequest(`/api/spec/${specId}/sections`, {
      method: "PUT",
      body: JSON.stringify({ story: "Como probe quiero rutas REST verificadas" })
    });
    assert(sections.status === 200, `PUT sections must be 200, got ${sections.status}`);
    assert(sections.json?.updated?.includes("story"), "PUT sections must report what it wrote");

    const badTask = await restRequest(`/api/spec/${specId}/tasks`, { method: "PUT", body: JSON.stringify({ line: 1 }) });
    assert(badTask.status === 400, `PUT tasks without { line, done } must be 400, got ${badTask.status}`);

    // A well-formed request that breaks an SDD rule is 422, not 400.
    const notATask = await restRequest(`/api/spec/${specId}/tasks`, {
      method: "PUT",
      body: JSON.stringify({ line: 0, done: true })
    });
    assert(notATask.status === 422, `PUT tasks on a non-task line must be 422, got ${notATask.status}`);
    assert(/task checkbox/i.test(notATask.json?.error ?? ""), "the 422 must explain the line is not a task");

    const taskLine = detail.json.tasks[0].line;
    const ticked = await restRequest(`/api/spec/${specId}/tasks`, {
      method: "PUT",
      body: JSON.stringify({ line: taskLine, done: true })
    });
    assert(ticked.status === 200, `PUT tasks on a real task must be 200, got ${ticked.status}`);
    assert(
      ticked.json?.tasks?.find((task) => task.line === taskLine)?.done === true,
      "PUT tasks must return the updated task list"
    );

    const noApprover = await restRequest(`/api/spec/${specId}/approve`, { method: "POST", body: "{}" });
    assert(noApprover.status === 400, `POST approve without an approver must be 400, got ${noApprover.status}`);

    const approved = await restRequest(`/api/spec/${specId}/approve`, {
      method: "POST",
      body: JSON.stringify({ approver: "Probe", evidence: "http smoke test" })
    });
    assert(approved.status === 200, `POST approve must be 200, got ${approved.status}`);
    assert(approved.json?.specId === specId && approved.json?.approver === "Probe", "approve must echo what it wrote");

    // I16: precondition failures carry a machine CODE. The temp workspace is
    // not a git repo, so this is the GH_NO_REPO branch. Before the fix the
    // body was only { error } with a bilingual "es / en" message that the
    // builder printed verbatim — spec 010, R1 forbids double labels in errors.
    const issues = await restRequest(`/api/spec/${specId}/issues`, { method: "POST", body: "{}" });
    assert(issues.status === 422, `POST issues outside a git repo must be 422, got ${issues.status}`);
    assert(
      issues.json?.code === "GH_NO_REPO",
      `POST issues must return a machine error code, got ${JSON.stringify(issues.json)}`
    );

    const savedBoard = await restRequest("/api/board", {
      method: "PUT",
      body: JSON.stringify({ nodes: [], edges: [] })
    });
    assert(savedBoard.status === 200, `PUT /api/board must be 200, got ${savedBoard.status}`);
    assert(savedBoard.json?.ok === true, "PUT /api/board must acknowledge the write");

    const events = await headOnlyRequest(restPort, "/api/events");
    assert(events.status === 200, `GET /api/events must be 200, got ${events.status}`);
    assert(
      String(events.headers["content-type"] ?? "").includes("text/event-stream"),
      `GET /api/events must be an SSE stream, got ${events.headers["content-type"]}`
    );

    const unknown = await restRequest("/api/definitely-not-a-route");
    assert(unknown.status === 404, `an unknown /api/* route must be 404, got ${unknown.status}`);
  } finally {
    server.stop();
    await fs.rm(root, { recursive: true, force: true });
  }
}

// --- m13: static.ts (the /builder mount + its traversal guard) --------------
//
// serveBuilder had no test at all. Its guard rests entirely on URL
// normalisation plus one `startsWith(BUILDER_DIST)` check, and it serves from
// disk — exactly the shape that turns into a file-read primitive when it
// breaks. builder/dist may or may not exist (it is checkout-only and not built
// by `npm run build`), so both outcomes are accepted for the happy path; the
// traversal asserts hold either way.

async function checkBuilderStatic() {
  const index = await rawRequest({ port, path: "/builder" });
  if (index.status === 503) {
    assert(
      /npm run build/.test(index.body),
      "a missing builder/dist must answer 503 with the build/checkout hint, not an empty error"
    );
  } else {
    assert(index.status === 200, `GET /builder must be 200 or 503, got ${index.status}`);
    assert(/<div id="root"|<!doctype html/i.test(index.body), "GET /builder must serve the built index.html");
  }

  // Neither traversal form may ever serve a file from outside builder/dist.
  // "mcp:pack:smoke" only exists in the repo's package.json.
  for (const traversal of [
    "/builder/../../package.json",
    "/builder/%2e%2e/%2e%2e/package.json",
    "/builder/..%2f..%2fpackage.json"
  ]) {
    const escaped = await rawRequest({ port, path: traversal });
    assert(
      !escaped.body.includes("mcp:pack:smoke"),
      `${traversal} escaped builder/dist and served the repo package.json`
    );
    assert(
      escaped.status !== 200 || !String(escaped.headers?.["content-type"] ?? "").includes("application/json"),
      `${traversal} served a JSON file from outside builder/dist`
    );
  }
}

// --- I15: session reclamation ----------------------------------------------

async function checkSessionReclamation() {
  const server = startServer(sessionPort, {
    SDD_MCP_SESSION_TTL_MS: "1200",
    SDD_MCP_MAX_SESSIONS: "3"
  });
  try {
    await server.ready;

    const idle = await initMcpSession(sessionPort);
    assert(idle, "expected an mcp-session-id from initialize");
    assert((await callToolsList(sessionPort, idle)) === 200, "a fresh session must answer tools/list");
    await new Promise((resolve) => setTimeout(resolve, 2600));
    assert(
      (await callToolsList(sessionPort, idle)) === 400,
      "an idle session past its TTL must be reclaimed (enableJsonResponse means onclose never fires for it)"
    );

    // Cap: with MAX_SESSIONS=3, the least-recently-used session is evicted.
    const oldest = await initMcpSession(sessionPort);
    for (let i = 0; i < 5; i++) await initMcpSession(sessionPort);
    assert(
      (await callToolsList(sessionPort, oldest)) === 400,
      "the session map must be capped: the least-recently-used session should have been evicted"
    );

    assert(server.alive(), "server must survive session churn");
  } finally {
    server.stop();
  }
}

// --- 023 R2: port fallback --------------------------------------------------

/**
 * An occupied port must move the server, not kill it — and the banner must name
 * where it actually landed.
 *
 * The interesting failure this guards against is not "it crashes": it is "it
 * quietly serves on another port while telling the user to open the first one".
 * So the assert is on the announced URL, verified against a live response from
 * the port that was announced.
 */
async function checkPortFallback() {
  const taken = await reservePort();

  // A squatter that answers differently from the SDD server, so "something
  // replied on this port" cannot be mistaken for "the SDD server is here".
  const squatter = http.createServer((_req, res) => {
    res.writeHead(418, { "content-type": "text/plain" }).end("squatter");
  });
  await new Promise((resolve) => squatter.listen(taken, "127.0.0.1", resolve));

  const child = spawn("node", ["packages/sdd-mcp/dist/http.js"], {
    cwd: process.cwd(),
    env: { ...process.env, SDD_MCP_HTTP_PORT: String(taken) },
    stdio: ["ignore", "pipe", "pipe"]
  });
  children.add(child);

  let stderr = "";
  child.stderr.setEncoding("utf8");
  child.stderr.on("data", (chunk) => {
    stderr += chunk;
  });

  try {
    const deadline = Date.now() + 15000;
    let announced;
    while (Date.now() < deadline) {
      // The banner is the contract under test here, so reading it is the point,
      // not a shortcut around a readiness signal.
      const match = /http:\/\/127\.0\.0\.1:(\d+)\/builder/.exec(stderr);
      if (match) {
        announced = Number(match[1]);
        break;
      }
      if (child.exitCode !== null) break;
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    assert(announced !== undefined, `server never announced a URL after the port was taken:\n${stderr}`);
    assert(
      announced !== taken,
      `server announced the occupied port ${taken}; the fallback did not move it:\n${stderr}`
    );
    assert(
      stderr.includes(`${taken}`) && /usando|using/.test(stderr),
      `the port change must be announced, not silent:\n${stderr}`
    );

    // /dashboard, not /api/gate: the gate answers 4xx when a workspace has open
    // findings, which is a property of this repo's specs rather than of the
    // server being up. The dashboard is 200 whenever the server is really there.
    const squatted = await rawRequest({ port: taken, path: "/dashboard" });
    assert(squatted.status === 418, `the squatter must still own ${taken} (got HTTP ${squatted.status})`);

    const moved = await rawRequest({ port: announced, path: "/dashboard" });
    assert(
      moved.status === 200 && moved.body.includes("<html"),
      `the SDD server must answer on the announced port ${announced} (got HTTP ${moved.status})`
    );

    console.log(`  port ${taken} was taken; server moved to ${announced} and said so`);
  } finally {
    child.kill();
    children.delete(child);
    await new Promise((resolve) => squatter.close(resolve));
  }
}

async function main() {
  const server = startServer(port);
  await server.ready;

  const surface = await checkProtocolSurface();
  console.log("MCP HTTP smoke test: protocol surface OK");

  await checkBindHost(server);
  console.log("MCP HTTP smoke test: loopback-only bind OK (C3)");

  await checkOriginGuard();
  console.log("MCP HTTP smoke test: origin + content-type guard OK (C3)");

  await checkBodyCap(server);
  console.log("MCP HTTP smoke test: request body cap OK (C4)");

  await checkBuilderStatic();
  console.log("MCP HTTP smoke test: /builder mount + traversal guard OK (m13)");

  await checkRestRoutes();
  console.log("MCP HTTP smoke test: REST routes OK (I14, I16)");

  await checkSessionReclamation();
  console.log("MCP HTTP smoke test: session reclamation OK (I15)");

  await checkPortFallback();
  console.log("MCP HTTP smoke test: port fallback OK (023 R2)");

  console.log("MCP HTTP smoke test passed");
  console.log(`Tools: ${surface.toolNames.length}`);
  console.log(`Resource templates: ${surface.templateNames.join(", ")}`);
  console.log(`Prompts: ${surface.promptNames.join(", ")}`);

  killAll();
}

main().catch((error) => {
  console.error(error);
  killAll();
  process.exitCode = 1;
});
