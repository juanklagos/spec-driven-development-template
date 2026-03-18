import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { createSddMcpServer } from "./server.js";

async function main() {
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
