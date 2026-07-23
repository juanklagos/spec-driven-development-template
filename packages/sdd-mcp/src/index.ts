#!/usr/bin/env node
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { helpText, packageVersion, parseCliArgs, unknownArgMessage } from "./cli.js";
import { createSddMcpServer } from "./server.js";

async function main() {
  // One parse decides everything (spec 021). Before this, only `--http` was
  // recognised and every other argument fell through to the stdio transport,
  // which then produced zero bytes and exit 0 — or hung on an open pipe.
  const intent = parseCliArgs(process.argv.slice(2));

  switch (intent.kind) {
    case "help":
      // Not the MCP protocol channel here, so stdout is free; exit 0.
      console.log(helpText(packageVersion()));
      return;

    case "version":
      console.log(packageVersion());
      return;

    case "unknown":
      // Name the argument and the running version on stderr, exit non-zero, and
      // start NO transport. stdout stays clean (it is the protocol channel).
      console.error(unknownArgMessage(intent.arg, packageVersion()));
      process.exitCode = 1;
      return;

    case "http":
      // `npx @juanklagos/sdd-mcp --http` reaches the board through the bin that
      // carries the package name. http.js starts the server as an import side
      // effect (it is a declared bin too), and a startup failure there exits
      // non-zero on its own. The `sdd-mcp-http` bin stays: it is documented and
      // sits in people's MCP configs (spec 020).
      await import("./http.js");
      return;

    case "stdio": {
      const server = createSddMcpServer();
      const transport = new StdioServerTransport();
      await server.connect(transport);
      process.stdin.on("close", () => {
        void server.close();
      });
      return;
    }
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
