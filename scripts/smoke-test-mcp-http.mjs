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
import http from "node:http";
import os from "node:os";
import packageJson from "../package.json" with { type: "json" };

const port = 3334;
/** Short-lived server used only for the session-reclamation asserts. */
const sessionPort = 3335;
/** Short-lived control server, proves the LAN probe below is not vacuous. */
const exposedPort = 3336;

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

  const ready = new Promise((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`Timed out waiting for HTTP MCP server on ${serverPort}`)), 15000);
    const poll = setInterval(() => {
      if (stderr.includes("SDD MCP Streamable HTTP server listening")) {
        clearTimeout(timer);
        clearInterval(poll);
        resolve(undefined);
      }
    }, 50);
    child.on("exit", (code) => {
      clearTimeout(timer);
      clearInterval(poll);
      reject(new Error(`HTTP MCP server on ${serverPort} exited early with code ${code}\n${stderr}`));
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

  await checkSessionReclamation();
  console.log("MCP HTTP smoke test: session reclamation OK (I15)");

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
