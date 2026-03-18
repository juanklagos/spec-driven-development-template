import { promises as fs } from "node:fs";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };
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
  .describe("Absolute target project path. Recommended default inside this template: ./www/<project-name>.");

function toStructuredContent<T>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function createSddMcpServer(): McpServer {
  const server = new McpServer({
    name: "sdd-mcp",
    version: packageJson.version
  });

  const validationMessageSchema = z.object({
    level: z.enum(["error", "warning", "info"]),
    code: z.string(),
    message: z.string(),
    path: z.string().optional()
  });

  server.registerTool(
    "sdd_create_workspace",
    {
      title: "Create SDD workspace",
      description: "Create a runnable SDD workspace inside the recommended default folder ./www/<project-name>.",
      inputSchema: {
        projectName: z.string().min(1),
        assistant: z.string().default("codex"),
        profile: z.enum(["minimal", "recommended", "full"]).default("recommended"),
        useSpecKit: z.boolean().default(true)
      },
      outputSchema: {
        projectRoot: z.string(),
        profile: z.enum(["minimal", "recommended", "full"]),
        assistant: z.string(),
        usedSpecKit: z.boolean()
      }
    },
    async ({ projectName, assistant, profile, useSpecKit }) => {
      const result = await createWorkspace({
        frameworkRoot,
        projectName,
        assistant,
        profile,
        useSpecKit
      });
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_create_spec",
    {
      title: "Create numbered spec",
      description: "Create the next numbered spec folder from the template.",
      inputSchema: {
        projectRoot: projectRootSchema,
        featureName: z.string().min(1),
        owner: z.string().optional()
      },
      outputSchema: {
        specId: z.string(),
        specDir: z.string(),
        indexUpdated: z.boolean()
      }
    },
    async ({ projectRoot, featureName, owner }) => {
      const result = await createSpec({ projectRoot, featureName, owner });
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_validate",
    {
      title: "Validate SDD project",
      description: "Validate the SDD structure and required files of a project.",
      inputSchema: {
        projectRoot: projectRootSchema
      },
      outputSchema: {
        ok: z.boolean(),
        errors: z.number(),
        warnings: z.number(),
        messages: z.array(validationMessageSchema)
      }
    },
    async ({ projectRoot }) => {
      const result = await validateProject(projectRoot);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.ok
      };
    }
  );

  server.registerTool(
    "sdd_check_gate",
    {
      title: "Check SDD gate",
      description: "Verify whether implementation can proceed under SDD rules.",
      inputSchema: {
        projectRoot: projectRootSchema
      },
      outputSchema: {
        ok: z.boolean(),
        errors: z.number(),
        warnings: z.number(),
        approvedSpecs: z.number(),
        totalSpecs: z.number(),
        messages: z.array(validationMessageSchema)
      }
    },
    async ({ projectRoot }) => {
      const result = await checkGate(projectRoot);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.ok
      };
    }
  );

  server.registerTool(
    "sdd_record_user_consent",
    {
      title: "Record user consent",
      description: "Record explicit user consent before implementation starts.",
      inputSchema: {
        projectRoot: projectRootSchema,
        summary: z.string().min(1)
      },
      outputSchema: {
        logFile: z.string(),
        summary: z.string(),
        timestamp: z.string()
      }
    },
    async ({ projectRoot, summary }) => {
      const result = await recordUserConsent(projectRoot, summary);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_list_specs",
    {
      title: "List SDD specs",
      description: "List numbered specs and their approval status.",
      inputSchema: {
        projectRoot: projectRootSchema
      },
      outputSchema: {
        specs: z.array(
          z.object({
            id: z.string(),
            dir: z.string(),
            status: z.string()
          })
        )
      }
    },
    async ({ projectRoot }) => {
      const specs = await listSpecs(projectRoot);
      return {
        structuredContent: toStructuredContent({ specs }),
        content: [{ type: "text", text: JSON.stringify(specs, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_generate_status",
    {
      title: "Generate status dashboard",
      description: "Generate STATUS.md from the current project specs and logbook.",
      inputSchema: { projectRoot: projectRootSchema },
      outputSchema: {
        path: z.string(),
        content: z.string()
      }
    },
    async ({ projectRoot }) => {
      const result = await generateStatus(projectRoot);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_generate_roadmap",
    {
      title: "Generate roadmap",
      description: "Generate docs/roadmap.mmd and docs/roadmap.md from specs/INDEX.md.",
      inputSchema: { projectRoot: projectRootSchema },
      outputSchema: {
        mermaidPath: z.string(),
        markdownPath: z.string(),
        mermaid: z.string(),
        markdown: z.string()
      }
    },
    async ({ projectRoot }) => {
      const result = await generateRoadmap(projectRoot);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_append_project_log",
    {
      title: "Append project log entry",
      description: "Append content to bitacora/global/PROJECT_LOG.md.",
      inputSchema: {
        projectRoot: projectRootSchema,
        entry: z.string().min(1)
      },
      outputSchema: {
        path: z.string(),
        content: z.string()
      }
    },
    async ({ projectRoot, entry }) => {
      const result = await appendProjectLogEntry(projectRoot, entry);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_write_daily_log",
    {
      title: "Write daily log",
      description: "Create or replace a daily log entry in bitacora/diaria.",
      inputSchema: {
        projectRoot: projectRootSchema,
        date: z.string().min(1).describe("Use YYYY-MM-DD."),
        content: z.string().min(1)
      },
      outputSchema: {
        path: z.string(),
        content: z.string()
      }
    },
    async ({ projectRoot, date, content }) => {
      const result = await writeDailyLog(projectRoot, date, content);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_write_handoff",
    {
      title: "Write handoff",
      description: "Create or replace a handoff file in bitacora/handoffs.",
      inputSchema: {
        projectRoot: projectRootSchema,
        fileName: z.string().min(1).describe("Use a markdown filename such as 2026-03-18-handoff.md."),
        content: z.string().min(1)
      },
      outputSchema: {
        path: z.string(),
        content: z.string()
      }
    },
    async ({ projectRoot, fileName, content }) => {
      const result = await writeHandoff(projectRoot, fileName, content);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_write_decision",
    {
      title: "Write decision",
      description: "Create or replace a decision file in bitacora/decisiones.",
      inputSchema: {
        projectRoot: projectRootSchema,
        fileName: z.string().min(1).describe("Use a markdown filename such as 2026-03-18-decision.md."),
        content: z.string().min(1)
      },
      outputSchema: {
        path: z.string(),
        content: z.string()
      }
    },
    async ({ projectRoot, fileName, content }) => {
      const result = await writeDecision(projectRoot, fileName, content);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
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
    "sdd-project-index",
    new ResourceTemplate("sdd://project/{projectName}/index", { list: undefined }),
    { mimeType: "text/markdown" },
    async (uri, { projectName }) => ({
      contents: [
        {
          uri: uri.href,
          text: await fs.readFile(path.join(getManagedWorkspaceProjectRoot(projectName), "specs/INDEX.md"), "utf8")
        }
      ]
    })
  );

  server.resource(
    "sdd-project-log",
    new ResourceTemplate("sdd://project/{projectName}/project-log", { list: undefined }),
    { mimeType: "text/markdown" },
    async (uri, { projectName }) => ({
      contents: [
        {
          uri: uri.href,
          text: await fs.readFile(
            path.join(getManagedWorkspaceProjectRoot(projectName), "bitacora/global/PROJECT_LOG.md"),
            "utf8"
          )
        }
      ]
    })
  );

  server.resource(
    "sdd-project-latest-handoff",
    new ResourceTemplate("sdd://project/{projectName}/latest-handoff", { list: undefined }),
    { mimeType: "text/markdown" },
    async (uri, { projectName }) => {
      const handoffDir = path.join(getManagedWorkspaceProjectRoot(projectName), "bitacora/handoffs");
      const entries = await fs.readdir(handoffDir, { withFileTypes: true });
      const latest = entries
        .filter((entry) => entry.isFile())
        .map((entry) => entry.name)
        .sort()
        .at(-1);

      return {
        contents: [
          {
            uri: uri.href,
            text: latest ? await fs.readFile(path.join(handoffDir, latest), "utf8") : "No handoff files found."
          }
        ]
      };
    }
  );

  server.resource(
    "sdd-project-idea",
    new ResourceTemplate("sdd://project/{projectName}/idea", { list: undefined }),
    { mimeType: "text/markdown" },
    async (uri, { projectName }) => ({
      contents: [
        {
          uri: uri.href,
          text: await fs.readFile(path.join(getManagedWorkspaceProjectRoot(projectName), "idea/IDEA_GENERAL.md"), "utf8")
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
                getManagedWorkspaceProjectRoot(projectName),
                "specs",
                normalizeSpecId(specId),
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
              "Prefer ./www/<project-name>/ as the recommended default workspace unless the user chooses another target path.",
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

function getManagedWorkspaceProjectRoot(projectNameInput: string | string[]): string {
  const projectName = normalizeWorkspaceProjectName(projectNameInput);
  const wwwRoot = path.join(frameworkRoot, "www");
  const projectRoot = path.join(wwwRoot, projectName);

  if (projectRoot === wwwRoot || !projectRoot.startsWith(wwwRoot + path.sep)) {
    throw new Error("Managed workspace project must resolve inside ./www");
  }

  return projectRoot;
}

function normalizeWorkspaceProjectName(value: string | string[]): string {
  const name = normalizeParam(value);
  if (!/^[a-z0-9][a-z0-9-]*$/.test(name)) {
    throw new Error("Project name must be a workspace slug such as my-project");
  }
  return name;
}

function normalizeSpecId(value: string | string[]): string {
  const specId = normalizeParam(value);
  if (!/^\d{3}-[a-z0-9-]+$/.test(specId)) {
    throw new Error("Spec id must look like 001-my-feature");
  }
  return specId;
}
