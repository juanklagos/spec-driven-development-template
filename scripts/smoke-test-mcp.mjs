import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";

const transport = new StdioClientTransport({
  command: "node",
  args: ["packages/sdd-mcp/dist/index.js"],
  cwd: process.cwd(),
  stderr: "inherit"
});

const client = new Client(
  {
    name: "sdd-mcp-smoke-test",
    version: "0.1.0"
  },
  {
    capabilities: {}
  }
);

async function main() {
  await client.connect(transport);

  const tools = await client.listTools();
  const resources = await client.listResources();
  const prompts = await client.listPrompts();

  const toolNames = tools.tools.map((item) => item.name);
  const resourceNames = resources.resources.map((item) => item.name);
  const promptNames = prompts.prompts.map((item) => item.name);

  const expectedTools = [
    "sdd_create_workspace",
    "sdd_create_spec",
    "sdd_validate",
    "sdd_check_gate",
    "sdd_record_user_consent",
    "sdd_list_specs"
  ];

  for (const toolName of expectedTools) {
    if (!toolNames.includes(toolName)) {
      throw new Error(`Missing MCP tool: ${toolName}`);
    }
  }

  if (resourceNames.length < 4) {
    throw new Error(`Expected at least 4 MCP resources, got ${resourceNames.length}`);
  }

  if (promptNames.length < 3) {
    throw new Error(`Expected at least 3 MCP prompts, got ${promptNames.length}`);
  }

  console.log("MCP smoke test passed");
  console.log(`Tools: ${toolNames.join(", ")}`);
  console.log(`Resources: ${resourceNames.join(", ")}`);
  console.log(`Prompts: ${promptNames.join(", ")}`);

  await transport.close();
}

main().catch(async (error) => {
  console.error(error);
  await transport.close().catch(() => {});
  process.exitCode = 1;
});
