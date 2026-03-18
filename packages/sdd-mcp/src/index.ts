import { promises as fs } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { McpServer, ResourceTemplate } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import { z } from "zod";
import {
  checkGate,
  createSpec,
  createWorkspace,
  getFrameworkRoot,
  listSpecs,
  recordUserConsent,
  validateProject
} from "@sdd/sdd-core";

const frameworkRoot = getFrameworkRoot();
const server = new McpServer({
  name: "sdd-mcp",
  version: "0.1.0"
});

const projectRootSchema = z
  .string()
  .describe("Absolute project path inside ./www/<project-name> under the current workspace.");

server.tool(
  "sdd_create_workspace",
  {
    projectName: z.string().min(1),
    assistant: z.string().default("codex"),
    profile: z.enum(["minimal", "recommended", "full"]).default("recommended"),
    useSpecKit: z.boolean().default(true)
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
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  "sdd_create_spec",
  {
    projectRoot: projectRootSchema,
    featureName: z.string().min(1),
    owner: z.string().optional()
  },
  async ({ projectRoot, featureName, owner }) => {
    const result = await createSpec({
      projectRoot,
      featureName,
      owner
    });

    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  "sdd_validate",
  {
    projectRoot: projectRootSchema
  },
  async ({ projectRoot }) => {
    const result = await validateProject(projectRoot);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ],
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
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ],
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
  async ({ projectRoot, summary }) => {
    const result = await recordUserConsent(projectRoot, summary);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(result, null, 2)
        }
      ]
    };
  }
);

server.tool(
  "sdd_list_specs",
  {
    projectRoot: projectRootSchema
  },
  async ({ projectRoot }) => {
    const specs = await listSpecs(projectRoot);
    return {
      content: [
        {
          type: "text",
          text: JSON.stringify(specs, null, 2)
        }
      ]
    };
  }
);

server.resource(
  "sdd-policy",
  "sdd://policy/current",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: await readFrameworkFile("sdd.policy.yaml")
      }
    ]
  })
);

server.resource(
  "sdd-ai-start",
  "sdd://docs/ai-start",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: await readFrameworkFile("AI_START_HERE.md")
      }
    ]
  })
);

server.resource(
  "sdd-quickstart",
  "sdd://docs/quickstart",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: await readFrameworkFile("QUICKSTART.md")
      }
    ]
  })
);

server.resource(
  "sdd-spec-template",
  "sdd://templates/spec",
  async (uri) => ({
    contents: [
      {
        uri: uri.href,
        text: await readFrameworkFile("specs/_template/spec.md")
      }
    ]
  })
);

server.resource(
  "sdd-project-idea",
  new ResourceTemplate("sdd://project/{projectName}/idea", { list: undefined }),
  async (uri, { projectName }) => ({
    contents: [
      {
        uri: uri.href,
        text: await fs.readFile(
          path.join(frameworkRoot, "www", normalizeParam(projectName), "idea/IDEA_GENERAL.md"),
          "utf8"
        )
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

async function readFrameworkFile(relativePath: string): Promise<string> {
  return fs.readFile(path.join(frameworkRoot, relativePath), "utf8");
}

function normalizeParam(value: string | string[]): string {
  return Array.isArray(value) ? value[0] : value;
}

async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

process.stdin.on("close", () => {
  void server.close();
});
