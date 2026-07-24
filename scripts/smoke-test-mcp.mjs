import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import packageJson from "../package.json" with { type: "json" };

const transport = new StdioClientTransport({
  command: "node",
  args: ["packages/sdd-mcp/dist/index.js"],
  cwd: process.cwd(),
  stderr: "inherit"
});

const client = new Client(
  {
    name: "sdd-mcp-smoke-test",
    version: packageJson.version
  },
  {
    capabilities: {}
  }
);

async function main() {
  await client.connect(transport);

  const tools = await client.listTools();
  const resources = await client.listResources();
  const templates = await client.listResourceTemplates();
  const prompts = await client.listPrompts();

  const toolNames = tools.tools.map((item) => item.name);
  const resourceNames = resources.resources.map((item) => item.name);
  const templateNames = templates.resourceTemplates.map((item) => item.name);
  const promptNames = prompts.prompts.map((item) => item.name);

  // The COMPLETE registered tool surface (server.ts + app.ts). This list used
  // to name only the first 12 tools, so deleting any of the board / tasks /
  // gate / approval registrations broke no test at all. It is asserted in both
  // directions on purpose: a removed tool fails the first loop, and a tool
  // added without declaring it here fails the second — the list is the
  // published contract, not a sample of it.
  const expectedTools = [
    "sdd_create_workspace",
    "sdd_create_spec",
    "sdd_validate",
    "sdd_check_gate",
    "sdd_record_user_consent",
    "sdd_list_specs",
    "sdd_generate_status",
    "sdd_generate_roadmap",
    "sdd_append_project_log",
    "sdd_write_daily_log",
    "sdd_write_handoff",
    "sdd_write_decision",
    "sdd_board_read",
    "sdd_board_write",
    "sdd_board_connect",
    "sdd_read_tasks",
    "sdd_set_task_done",
    "sdd_gate_summary",
    "sdd_approve_spec",
    "sdd_update_spec_sections",
    "sdd_read_spec_document",
    "sdd_read_bitacora",
    "sdd_check_drift",
    "sdd_add_task",
    "sdd_lint_ears",
    "sdd_score_spec",
    "sdd_install_sidecar",
    "sdd_board_app"
  ];

  for (const toolName of expectedTools) {
    if (!toolNames.includes(toolName)) {
      throw new Error(`Missing MCP tool: ${toolName}`);
    }
  }
  for (const toolName of toolNames) {
    if (!expectedTools.includes(toolName)) {
      throw new Error(
        `Undeclared MCP tool: ${toolName} — add it to expectedTools in scripts/smoke-test-mcp.mjs (the tool surface is a contract)`
      );
    }
  }

  const structuredTool = tools.tools.find((item) => item.name === "sdd_validate");
  if (!structuredTool?.outputSchema) {
    throw new Error("Expected sdd_validate to expose outputSchema");
  }

  if (resourceNames.length < 4) {
    throw new Error(`Expected at least 4 MCP resources, got ${resourceNames.length}`);
  }

  for (const templateName of ["sdd-project-index", "sdd-project-log", "sdd-project-latest-handoff", "sdd-project-idea", "sdd-spec-document"]) {
    if (!templateNames.includes(templateName)) {
      throw new Error(`Missing MCP resource template: ${templateName}`);
    }
  }

  if (promptNames.length < 3) {
    throw new Error(`Expected at least 3 MCP prompts, got ${promptNames.length}`);
  }

  console.log("MCP smoke test passed");
  console.log(`Tools: ${toolNames.join(", ")}`);
  console.log(`Resources: ${resourceNames.join(", ")}`);
  console.log(`Resource templates: ${templateNames.join(", ")}`);
  console.log(`Prompts: ${promptNames.join(", ")}`);

  await transport.close();
}

main().catch(async (error) => {
  console.error(error);
  await transport.close().catch(() => {});
  process.exitCode = 1;
});
