#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSddMcpServer } from "./server.js";

async function main() {
  // `npx @juanklagos/sdd-mcp --http` reaches the board through the bin that carries the
  // package name, so getting there no longer depends on npx resolving a second bin.
  // The `sdd-mcp-http` bin stays: it is documented and sits in people's MCP configs.
  // http.js starts the server as an import side effect, so there is nothing to call.
  if (process.argv.slice(2).includes("--http")) {
    await import("./http.js");
    return;
  }

  const server = createSddMcpServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);

  process.stdin.on("close", () => {
    void server.close();
  });
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
