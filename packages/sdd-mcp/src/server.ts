import { promises as fs } from "node:fs";
import path from "node:path";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  appendProjectLogEntry,
  checkGate,
  createSpec,
  createWorkspace,
  generateRoadmap,
  generateStatus,
  getFrameworkRoot,
  listSpecs,
  recordUserConsent,
  validateProject,
  writeDailyLog,
  writeDecision,
  writeHandoff
} from "@sdd/sdd-core";

const frameworkRoot = getFrameworkRoot();
const projectRootSchema = z
  .string()
  .describe("Absolute project path inside ./www/<project-name> under the current workspace.");

export function createSddMcpServer(): McpServer {
  const server = new McpServer({
    name: "sdd-mcp",
    version: "0.1.0"
  });

  server.tool(
    "sdd_create_workspace",
    {
      projectName: z.string().min(1),
      assistant: z.string().default("codex"),
      profile: z.enum(["minimal", "recommended", "full"]).default("recommended"),
      useSpecKit: z.boolean().default(true)
    },
    async ({ projectName, assistant, profile, useSpecKit }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(
            await createWorkspace({
              frameworkRoot,
              projectName,
              assistant,
              profile,
              useSpecKit
            }),
            null,
            2
          )
        }
      ]
    })
  );

  server.tool(
    "sdd_create_spec",
    {
      projectRoot: projectRootSchema,
      featureName: z.string().min(1),
      owner: z.string().optional()
    },
    async ({ projectRoot, featureName, owner }) => ({
      content: [
        {
          type: "text",
          text: JSON.stringify(await createSpec({ projectRoot, featureName, owner }), null, 2)
        }
      ]
    })
  );

  server.tool(
    "sdd_validate",
    {
      projectRoot: projectRootSchema
    },
    async ({ projectRoot }) => {
      const result = await validateProject(projectRoot);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.ok
      };
    }
  );

  server.tool(
    "sdd_check_gate",
    {
      projectRoot: projectRootSchema
    },
    async ({ projectRoot }) => {
      const result = await checkGate(projectRoot);
      return {
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.ok
      };
    }
  );

  server.tool(
    "sdd_record_user_consent",
    {
      projectRoot: projectRootSchema,
      summary: z.string().min(1)
    },
    async ({ projectRoot, summary }) => ({
      content: [{ type: "text", text: JSON.stringify(await recordUserConsent(projectRoot, summary), null, 2) }]
    })
  );

  server.tool(
    "sdd_list_specs",
    {
      projectRoot: projectRootSchema
    },
    async ({ projectRoot }) => ({
      content: [{ type: "text", text: JSON.stringify(await listSpecs(projectRoot), null, 2) }]
    })
  );

  server.tool(
    "sdd_generate_status",
    { projectRoot: projectRootSchema },
    async ({ projectRoot }) => ({
      content: [{ type: "text", text: JSON.stringify(await generateStatus(projectRoot), null, 2) }]
    })
  );

  server.tool(
    "sdd_generate_roadmap",
    { projectRoot: projectRootSchema },
    async ({ projectRoot }) => ({
      content: [{ type: "text", text: JSON.stringify(await generateRoadmap(projectRoot), null, 2) }]
    })
  );

  server.tool(
    "sdd_append_project_log",
    {
      projectRoot: projectRootSchema,
      entry: z.string().min(1)
    },
    async ({ projectRoot, entry }) => ({
      content: [{ type: "text", text: JSON.stringify(await appendProjectLogEntry(projectRoot, entry), null, 2) }]
    })
  );

  server.tool(
    "sdd_write_daily_log",
    {
      projectRoot: projectRootSchema,
      date: z.string().min(1).describe("Use YYYY-MM-DD."),
      content: z.string().min(1)
    },
    async ({ projectRoot, date, content }) => ({
      content: [{ type: "text", text: JSON.stringify(await writeDailyLog(projectRoot, date, content), null, 2) }]
    })
  );

  server.tool(
    "sdd_write_handoff",
    {
      projectRoot: projectRootSchema,
      fileName: z.string().min(1).describe("Use a markdown filename such as 2026-03-18-handoff.md."),
      content: z.string().min(1)
    },
    async ({ projectRoot, fileName, content }) => ({
      content: [{ type: "text", text: JSON.stringify(await writeHandoff(projectRoot, fileName, content), null, 2) }]
    })
  );

  server.tool(
    "sdd_write_decision",
    {
      projectRoot: projectRootSchema,
      fileName: z.string().min(1).describe("Use a markdown filename such as 2026-03-18-decision.md."),
      content: z.string().min(1)
    },
    async ({ projectRoot, fileName, content }) => ({
      content: [{ type: "text", text: JSON.stringify(await writeDecision(projectRoot, fileName, content), null, 2) }]
    })
  );

  server.resource("sdd-policy", "sdd://policy/current", { mimeType: "text/plain" }, async (uri) => ({
    contents: [{ uri: uri.href, text: await readFrameworkFile("sdd.policy.yaml") }]
  }));

  server.resource("sdd-ai-start", "sdd://docs/ai-start", { mimeType: "text/markdown" }, async (uri) => ({
    contents: [{ uri: uri.href, text: await readFrameworkFile("AI_START_HERE.md") }]
  }));

  server.resource("sdd-quickstart", "sdd://docs/quickstart", { mimeType: "text/markdown" }, async (uri) => ({
    contents: [{ uri: uri.href, text: await readFrameworkFile("QUICKSTART.md") }]
  }));

  server.resource("sdd-spec-template", "sdd://templates/spec", { mimeType: "text/markdown" }, async (uri) => ({
    contents: [{ uri: uri.href, text: await readFrameworkFile("specs/_template/spec.md") }]
  }));

  server.resource(
    "sdd-project-idea",
    new ResourceTemplate("sdd://project/{projectName}/idea", { list: undefined }),
    { mimeType: "text/markdown" },
    async (uri, { projectName }) => ({
      contents: [
        {
          uri: uri.href,
          text: await fs.readFile(path.join(frameworkRoot, "www", normalizeParam(projectName), "idea/IDEA_GENERAL.md"), "utf8")
        }
      ]
    })
  );

  server.resource(
    "sdd-spec-document",
    new ResourceTemplate("sdd://project/{projectName}/specs/{specId}/{document}", { list: undefined }),
    { mimeType: "text/markdown" },
    async (uri, { projectName, specId, document }) => {
      const normalizedDocument = normalizeDocument(normalizeParam(document));
      return {
        contents: [
          {
            uri: uri.href,
            text: await fs.readFile(
              path.join(
                frameworkRoot,
                "www",
                normalizeParam(projectName),
                "specs",
                normalizeParam(specId),
                normalizedDocument
              ),
              "utf8"
            )
          }
        ]
      };
    }
  );

  server.prompt(
    "start_new_sdd_project",
    {
      projectName: z.string(),
      projectDescription: z.string()
    },
    ({ projectName, projectDescription }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Using this SDD framework, create everything needed to execute the project "${projectName}".`,
              `Project description: ${projectDescription}`,
              "Create the SDD base first.",
              "Use ./www/<project-name>/ as execution root.",
              "Do not implement code before approved spec and consistent plan.",
              "Ask for explicit user consent only when implementation is about to start."
            ].join("\n")
          }
        }
      ]
    })
  );

  server.prompt(
    "adapt_existing_project_to_sdd",
    {
      projectPath: z.string(),
      projectDescription: z.string()
    },
    ({ projectPath, projectDescription }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Adapt the existing project at ${projectPath} to this SDD framework.`,
              `Project description: ${projectDescription}`,
              "Do not break current behavior.",
              "Integrate idea, specs, bitacora, validation, and traceability.",
              "Do not implement new code before approved spec and consistent plan."
            ].join("\n")
          }
        }
      ]
    })
  );

  server.prompt(
    "close_sdd_session",
    {
      activeSpec: z.string()
    },
    ({ activeSpec }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Close the current SDD session for spec ${activeSpec}.`,
              "Run validation and summarize:",
              "- objective",
              "- changes",
              "- validation",
              "- risks",
              "- next exact step"
            ].join("\n")
          }
        }
      ]
    })
  );

  return server;
}

async function readFrameworkFile(relativePath: string): Promise<string> {
  return fs.readFile(path.join(frameworkRoot, relativePath), "utf8");
}

function normalizeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

function normalizeDocument(value: string): string {
  const allowed = new Set(["spec.md", "plan.md", "tasks.md", "research.md", "history.md"]);
  if (!allowed.has(value)) {
    throw new Error(`Unsupported spec document: ${value}`);
  }
  return value;
}
