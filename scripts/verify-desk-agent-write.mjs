// H4: an external agent, connected to the DESKTOP APP's MCP endpoint, writes —
// and the window learns about it through SSE without a reload.
//
// The SSE subscription is opened FIRST and the write happens after, so a change
// event arriving late cannot be mistaken for one that was already queued.

import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { existsSync } from "node:fs";
import path from "node:path";

const [base, projectRoot] = process.argv.slice(2);
const events = [];

// 1. Listen the way the window listens.
const sse = await fetch(`${base}/api/events`, { headers: { accept: "text/event-stream" } });
const reader = sse.body.getReader();
const decoder = new TextDecoder();
void (async () => {
  let buffer = "";
  for (;;) {
    const { done, value } = await reader.read();
    if (done) return;
    buffer += decoder.decode(value, { stream: true });
    for (const frame of buffer.split("\n\n")) {
      const match = /^event: (\w+)/m.exec(frame);
      if (match) events.push(match[1]);
    }
    buffer = buffer.slice(buffer.lastIndexOf("\n\n") + 2);
  }
})();

await new Promise((r) => setTimeout(r, 1500));
console.log(`  SSE conectado; eventos hasta ahora: ${events.join(", ") || "(ninguno)"}`);

// 2. Connect as an agent would, to the URL the app shows in its dialog.
const client = new Client({ name: "h4-external-agent", version: "1" }, { capabilities: {} });
await client.connect(new StreamableHTTPClientTransport(new URL(`${base}/mcp`)));
console.log("  agente conectado al endpoint MCP de la app");

const before = events.length;

// 3. Write.
const result = await client.callTool({
  name: "sdd_create_spec",
  arguments: { projectRoot, featureName: "escrita-por-el-agente", owner: "Agente externo" }
});
const specId = JSON.parse(result.content[0].text).specId;
console.log(`  el agente creó la spec: ${specId}`);

// 4. Did it reach the disk, and did the window get told?
await new Promise((r) => setTimeout(r, 3000));

const onDisk = existsSync(path.join(projectRoot, "spec", "specs", specId, "spec.md"));
const newEvents = events.slice(before);
const gotChange = newEvents.includes("change");

console.log(`  en disco: ${onDisk ? "SI" : "NO"}`);
console.log(`  eventos tras la escritura: ${newEvents.join(", ") || "(ninguno)"}`);

const board = await (await fetch(`${base}/api/board`)).json();
const inBoard = board.specs.some((s) => s.id === specId);
console.log(`  visible en /api/board de la app: ${inBoard ? "SI" : "NO"}`);

await client.close();
reader.cancel().catch(() => {});

const ok = onDisk && gotChange && inBoard;
console.log(`\n  H4: ${ok ? "PASA" : "FALLA"}`);
process.exit(ok ? 0 : 1);
