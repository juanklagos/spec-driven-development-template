import { promises as fs } from "node:fs";
import path from "node:path";
import packageJson from "../package.json" with { type: "json" };
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import {
  appendProjectLogEntry,
  approveSpec,
  checkGate,
  connectBoardCards,
  createSpec,
  createWorkspace,
  generateRoadmap,
  generateStatus,
  getBoardView,
  getFrameworkRoot,
  getGateSummary,
  listSpecs,
  readSpecTasks,
  recordUserConsent,
  resolveSddRoot,
  setSpecTaskDone,
  updateSpecSections,
  validateProject,
  writeBoard,
  writeDailyLog,
  writeDecision,
  writeHandoff,
  type BoardCanvas
} from "@juanklagos/sdd-core";
import { registerSddBoardApp } from "./app.js";
import {
  boardSpecCardSchema,
  canvasSchema,
  gateSummaryShape,
  projectRootSchema,
  specIdSchema,
  taskItemSchema,
  validationMessageSchema
} from "./schemas.js";

const frameworkRoot = getFrameworkRoot();

function toStructuredContent<T>(value: T): Record<string, unknown> {
  return JSON.parse(JSON.stringify(value)) as Record<string, unknown>;
}

export function createSddMcpServer(): McpServer {
  const server = new McpServer({
    name: "sdd-mcp",
    version: packageJson.version
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
        sddRoot: z.string(),
        profile: z.enum(["minimal", "recommended", "full"]),
        assistant: z.string(),
        usedSpecKit: z.boolean(),
        layout: z.enum(["full", "sidecar"])
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

  // --- SDD Builder board tools -------------------------------------------
  // Same shared layer as the builder's REST API (@juanklagos/sdd-core board
  // module): agents connected over MCP see exactly what /builder shows.
  // Shapes live in schemas.ts, shared with the MCP App tool (app.ts).

  server.registerTool(
    "sdd_board_read",
    {
      title: "Read SDD board",
      description:
        "Read the visual SDD Builder board: the specs/board.canvas layout (JSON Canvas) plus every spec with its approval status and task progress.",
      inputSchema: {
        projectRoot: projectRootSchema
      },
      outputSchema: {
        canvas: canvasSchema,
        specs: z.array(boardSpecCardSchema)
      }
    },
    async ({ projectRoot }) => {
      const result = await getBoardView(projectRoot);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_board_write",
    {
      title: "Write SDD board",
      description:
        "Replace the specs/board.canvas layout (JSON Canvas: nodes + edges). Only layout is stored; markdown files are never touched by this tool.",
      inputSchema: {
        projectRoot: projectRootSchema,
        canvas: canvasSchema
      },
      outputSchema: {
        ok: z.boolean(),
        nodes: z.number(),
        edges: z.number()
      }
    },
    async ({ projectRoot, canvas }) => {
      await writeBoard(projectRoot, canvas as BoardCanvas);
      const result = { ok: true, nodes: canvas.nodes.length, edges: canvas.edges.length };
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_board_connect",
    {
      title: "Connect board cards",
      description:
        "Connect two existing board cards with an optional labeled edge and persist specs/board.canvas. Idempotent for identical edges.",
      inputSchema: {
        projectRoot: projectRootSchema,
        fromNode: z.string().min(1).describe("Source node id, e.g. a spec id like 001-my-feature."),
        toNode: z.string().min(1).describe("Target node id."),
        label: z.string().optional()
      },
      outputSchema: {
        canvas: canvasSchema
      }
    },
    async ({ projectRoot, fromNode, toNode, label }) => {
      const canvas = await connectBoardCards(projectRoot, fromNode, toNode, label);
      const result = { canvas };
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_read_tasks",
    {
      title: "Read spec tasks",
      description: "Read the checkbox tasks of a spec's tasks.md with their line numbers and done state.",
      inputSchema: {
        projectRoot: projectRootSchema,
        specId: specIdSchema
      },
      outputSchema: {
        specId: z.string(),
        tasks: z.array(taskItemSchema)
      }
    },
    async ({ projectRoot, specId }) => {
      const tasks = await readSpecTasks(projectRoot, specId);
      const result = { specId, tasks };
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_set_task_done",
    {
      title: "Set spec task done",
      description:
        "Toggle one checkbox line in a spec's tasks.md (surgical edit, atomic write) and return the updated tasks.",
      inputSchema: {
        projectRoot: projectRootSchema,
        specId: specIdSchema,
        line: z.number().int().min(0).describe("Zero-based line number of the task, as returned by sdd_read_tasks."),
        done: z.boolean()
      },
      outputSchema: {
        specId: z.string(),
        tasks: z.array(taskItemSchema)
      }
    },
    async ({ projectRoot, specId, line, done }) => {
      const tasks = await setSpecTaskDone(projectRoot, specId, line, done);
      const result = { specId, tasks };
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // --- SDD Builder v2 tools (spec 007) -----------------------------------
  // Gate semaphore and surgical spec.md edits; same sdd-core layer as the
  // /api/gate, /api/spec/:id/approve and /api/spec/:id/sections REST routes.

  server.registerTool(
    "sdd_gate_summary",
    {
      title: "Gate semaphore summary",
      description:
        "One-call gate semaphore: runs the SDD gate check plus the structural validation and groups every message by the spec it belongs to (the same data the SDD Builder chip and per-card badges show). Includes advisory dependencyWarnings from the board's typed edges (approved spec depending on a not-approved one).",
      inputSchema: {
        projectRoot: projectRootSchema
      },
      outputSchema: gateSummaryShape
    },
    async ({ projectRoot }) => {
      const result = await getGateSummary(projectRoot);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }],
        isError: !result.ok
      };
    }
  );

  server.registerTool(
    "sdd_approve_spec",
    {
      title: "Approve spec",
      description:
        "Surgically fill the existing approval block of a spec.md: Estado -> Aprobado, approval date -> today, approver -> given name, evidence when empty. Fails clearly when the block is missing.",
      inputSchema: {
        projectRoot: projectRootSchema,
        specId: specIdSchema,
        approver: z.string().min(1).describe("Person or role approving the spec.")
      },
      outputSchema: {
        specId: z.string(),
        status: z.string(),
        approvalDate: z.string(),
        approver: z.string(),
        evidenceUpdated: z.boolean(),
        fieldsUpdated: z.array(z.string())
      }
    },
    async ({ projectRoot, specId, approver }) => {
      const result = await approveSpec(projectRoot, specId, approver);
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  server.registerTool(
    "sdd_update_spec_sections",
    {
      title: "Update spec sections",
      description:
        "Replace ONLY the content under the guided-editor headings of a spec.md (user story, acceptance scenarios, EARS criteria, out of scope) preserving everything else. Tolerant to the EN/ES headings of both repo templates.",
      inputSchema: {
        projectRoot: projectRootSchema,
        specId: specIdSchema,
        story: z.string().optional().describe("Main user story (free text)."),
        scenarios: z.array(z.string()).optional().describe("Acceptance scenarios (numbered list)."),
        criteria: z.array(z.string()).optional().describe("EARS acceptance criteria (bullet list)."),
        outOfScope: z.string().optional().describe("Out of scope (free text).")
      },
      outputSchema: {
        specId: z.string(),
        updated: z.array(z.string()),
        created: z.array(z.string())
      }
    },
    async ({ projectRoot, specId, story, scenarios, criteria, outOfScope }) => {
      const result = await updateSpecSections(projectRoot, specId, { story, scenarios, criteria, outOfScope });
      return {
        structuredContent: toStructuredContent(result),
        content: [{ type: "text", text: JSON.stringify(result, null, 2) }]
      };
    }
  );

  // --- MCP App (spec 006, R5): board view inside compatible clients -------
  // ui://sdd/board.html resource + sdd_board_app tool (SEP-1865, ext-apps).
  registerSddBoardApp(server);

  server.resource("sdd-policy", "sdd://policy/current", { mimeType: "text/plain" }, async (uri) => ({
    contents: [{ uri: uri.href, text: await readFrameworkFile("sdd.policy.yaml") }]
  }));

  server.resource("sdd-ai-start", "sdd://docs/ai-start", { mimeType: "text/markdown" }, async (uri) => ({
    contents: [{ uri: uri.href, text: await readFrameworkFile("AI_START_HERE.md") }]
  }));

  server.resource("sdd-easy-mcp-guide", "sdd://docs/easy-mcp", { mimeType: "text/markdown" }, async (uri) => ({
    contents: [{ uri: uri.href, text: await readFrameworkFile("docs/en/43-easy-mcp-guide.md") }]
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
          text: await fs.readFile(path.join(await getManagedWorkspaceSddRoot(projectName), "specs/INDEX.md"), "utf8")
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
            path.join(await getManagedWorkspaceSddRoot(projectName), "bitacora/global/PROJECT_LOG.md"),
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
      const handoffDir = path.join(await getManagedWorkspaceSddRoot(projectName), "bitacora/handoffs");
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
          text: await fs.readFile(path.join(await getManagedWorkspaceSddRoot(projectName), "idea/IDEA_GENERAL.md"), "utf8")
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
                await getManagedWorkspaceSddRoot(projectName),
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
    "easy_start_project",
    {
      projectName: z.string(),
      projectDescription: z.string(),
      targetPath: z.string().optional()
    },
    ({ projectName, projectDescription, targetPath }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Help me start the project "${projectName}" using the SDD MCP in easy mode.`,
              `Project description: ${projectDescription}`,
              targetPath
                ? `Use this target path if it is valid and desired by the user: ${targetPath}`
                : "Prefer the recommended default workspace under ./www/<project-name> unless the user chooses another target path.",
              "Explain the action in 4 simple blocks:",
              "1. what you are going to do",
              "2. which files you will create or update",
              "3. what the user will have at the end",
              "4. what the next step is",
              "Create the SDD base first. Do not implement code yet."
            ].join("\n")
          }
        }
      ]
    })
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
    "easy_create_spec",
    {
      projectRoot: z.string(),
      featureName: z.string()
    },
    ({ projectRoot, featureName }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Use the SDD MCP in easy mode to create a new spec called "${featureName}".`,
              `Target project: ${projectRoot}`,
              "Before and after the action, explain in 4 simple blocks:",
              "1. what you are going to do",
              "2. which files you will create or update",
              "3. what the user will have at the end",
              "4. what the next step is",
              "Do not implement code. Only prepare the spec package and explain it clearly."
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
    "easy_show_structure",
    {
      projectRoot: z.string().optional()
    },
    ({ projectRoot }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              "Explain the SDD project structure in easy mode, like a simple house map for a beginner.",
              projectRoot ? `If useful, relate the explanation to this target project: ${projectRoot}` : "Use the framework structure and the standard SDD folders.",
              "Explain what idea/, specs/, bitacora/, docs/, and one numbered spec folder are for.",
              "Use simple language and tell the user which folder is usually touched next."
            ].join("\n")
          }
        }
      ]
    })
  );

  server.prompt(
    "easy_validate_project",
    {
      projectRoot: z.string()
    },
    ({ projectRoot }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Validate this SDD project in easy mode: ${projectRoot}`,
              "Run project validation and the SDD gate check.",
              "Explain the result in simple language.",
              "Always end with one exact next step."
            ].join("\n")
          }
        }
      ]
    })
  );

  server.prompt(
    "easy_show_next_step",
    {
      projectRoot: z.string()
    },
    ({ projectRoot }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Inspect this SDD project and tell me the next safe step: ${projectRoot}`,
              "Read the current specs and the gate state.",
              "Return only one next step, why it comes next, and what files will probably be touched."
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

  server.prompt(
    "easy_close_session",
    {
      activeSpec: z.string(),
      projectRoot: z.string().optional()
    },
    ({ activeSpec, projectRoot }) => ({
      messages: [
        {
          role: "user",
          content: {
            type: "text",
            text: [
              `Close the current SDD session for spec ${activeSpec} in easy mode.`,
              projectRoot ? `Target project: ${projectRoot}` : "Use the active target project.",
              "Summarize what was done, what changed, risks, validation, and the next exact step.",
              "Use simple language and keep the summary easy to scan."
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

async function getManagedWorkspaceSddRoot(projectNameInput: string | string[]): Promise<string> {
  return resolveSddRoot(getManagedWorkspaceProjectRoot(projectNameInput));
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
