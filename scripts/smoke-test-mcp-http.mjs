import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";
import { spawn } from "node:child_process";

const port = 3334;
const child = spawn("node", ["packages/sdd-mcp/dist/http.js"], {
  cwd: process.cwd(),
  env: {
    ...process.env,
    SDD_MCP_HTTP_PORT: String(port)
  },
  stdio: ["ignore", "pipe", "pipe"]
});

function waitForReady() {
  return new Promise((resolve, reject) => {
    const timer = setTimeout(() => {
      reject(new Error("Timed out waiting for HTTP MCP server"));
    }, 10000);

    const onChunk = (chunk) => {
      const text = String(chunk);
      if (text.includes("SDD MCP Streamable HTTP server listening")) {
        clearTimeout(timer);
        child.stderr.off("data", onChunk);
        resolve(undefined);
      }
    };

    child.stderr.setEncoding("utf8");
    child.stderr.on("data", onChunk);
    child.on("exit", (code) => {
      clearTimeout(timer);
      reject(new Error(`HTTP MCP server exited early with code ${code}`));
    });
  });
}

async function main() {
  await waitForReady();

  const transport = new StreamableHTTPClientTransport(new URL(`http://127.0.0.1:${port}/mcp`));
  const client = new Client(
    {
      name: "sdd-mcp-http-smoke-test",
      version: "0.1.0"
    },
    {
      capabilities: {}
    }
  );

  await client.connect(transport);

  const tools = await client.listTools();
  const templates = await client.listResourceTemplates();
  const prompts = await client.listPrompts();

  const toolNames = tools.tools.map((item) => item.name);
  const templateNames = templates.resourceTemplates.map((item) => item.name);
  const promptNames = prompts.prompts.map((item) => item.name);

  if (!toolNames.includes("sdd_generate_status")) {
    throw new Error("Missing HTTP MCP tool: sdd_generate_status");
  }

  const validateTool = tools.tools.find((item) => item.name === "sdd_validate");
  if (!validateTool?.outputSchema) {
    throw new Error("Expected HTTP MCP tool sdd_validate to expose outputSchema");
  }

  for (const templateName of ["sdd-project-index", "sdd-project-log", "sdd-project-latest-handoff", "sdd-project-idea", "sdd-spec-document"]) {
    if (!templateNames.includes(templateName)) {
      throw new Error(`Missing HTTP MCP resource template: ${templateName}`);
    }
  }

  if (!promptNames.includes("close_sdd_session")) {
    throw new Error("Missing HTTP MCP prompt: close_sdd_session");
  }

  console.log("MCP HTTP smoke test passed");
  console.log(`Tools: ${toolNames.length}`);
  console.log(`Resource templates: ${templateNames.join(", ")}`);
  console.log(`Prompts: ${promptNames.join(", ")}`);

  await transport.terminateSession().catch(() => {});
  await transport.close();
  child.kill();
}

main().catch(async (error) => {
  console.error(error);
  child.kill();
  process.exitCode = 1;
});
