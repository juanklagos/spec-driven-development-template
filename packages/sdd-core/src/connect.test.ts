// Spec 032, T1/T3. The connector plan/apply against a throwaway workspace,
// on the real read/write path. The load-bearing properties: a user's existing
// config always survives (R2), a config we cannot parse is never touched
// (R3), and a second run reports "unchanged" (R2, spec properties).

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  AGENT_CLIENTS,
  SERVE_QUEUE_INSTRUCTIONS,
  applyConnect,
  planConnect,
  type ConnectResult
} from "./connect.js";

let root: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-connect-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  for (const dir of ["idea", "specs", "bitacora"]) {
    await fs.mkdir(path.join(root, dir), { recursive: true });
  }
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

async function read(rel: string): Promise<string> {
  return fs.readFile(path.join(root, rel), "utf8");
}

async function exists(rel: string): Promise<boolean> {
  return fs
    .access(path.join(root, rel))
    .then(() => true)
    .catch(() => false);
}

/** Mark a client as present by creating the marker its detection looks for. */
async function pretendInstalled(clientId: string): Promise<void> {
  const client = AGENT_CLIENTS.find((c) => c.id === clientId);
  if (!client) throw new Error(`unknown client in test: ${clientId}`);
  const marker = path.join(root, client.detectPath);
  await fs.mkdir(path.dirname(marker), { recursive: true });
  if (client.detectPath.endsWith(".json") || client.detectPath.endsWith(".toml")) {
    await fs.writeFile(marker, client.detectPath.endsWith(".json") ? "{}\n" : "\n");
  } else {
    await fs.mkdir(marker, { recursive: true });
  }
}

function byId(results: ConnectResult[], id: string): ConnectResult[] {
  return results.filter((r) => r.clientId === id);
}

describe("client catalogue (R1)", () => {
  it("covers the seven declared clients", () => {
    expect(AGENT_CLIENTS.map((c) => c.id).sort()).toEqual([
      "claude-code",
      "codex",
      "cursor",
      "gemini",
      "opencode",
      "vscode",
      "windsurf"
    ]);
  });
});

describe("planConnect / applyConnect — fresh workspace (R1, R11)", () => {
  it("writes the MCP entry for a detected client and reports 'created'", async () => {
    await pretendInstalled("cursor");
    const results = await applyConnect(root, { clients: ["cursor"] });
    const mcp = byId(results, "cursor").find((r) => r.kind === "mcp");
    expect(mcp?.status).toBe("created");
    expect(path.isAbsolute(mcp?.file ?? "")).toBe(true);

    const config = JSON.parse(await read(".cursor/mcp.json")) as {
      mcpServers: Record<string, { command: string; args: string[]; env: Record<string, string> }>;
    };
    expect(config.mcpServers.sdd.command).toBe("npx");
    expect(config.mcpServers.sdd.args).toContain("@juanklagos/sdd-mcp@latest");
    expect(config.mcpServers.sdd.env.SDD_PROJECT_ROOT).toBe(root);
  });

  it("uses each client's own key and format", async () => {
    await applyConnect(root, { clients: ["vscode", "opencode", "codex", "claude-code"] });

    // VS Code: root key is `servers`, not `mcpServers`.
    expect(JSON.parse(await read(".vscode/mcp.json"))).toHaveProperty("servers.sdd");
    // opencode: `mcp` with an explicit local type and command as an array.
    const opencode = JSON.parse(await read("opencode.json")) as {
      mcp: { sdd: { type: string; command: string[] } };
    };
    expect(opencode.mcp.sdd.type).toBe("local");
    expect(opencode.mcp.sdd.command[0]).toBe("npx");
    // Claude Code: project .mcp.json.
    expect(JSON.parse(await read(".mcp.json"))).toHaveProperty("mcpServers.sdd");
    // Codex: TOML table.
    const toml = await read(".codex/config.toml");
    expect(toml).toContain("[mcp_servers.sdd]");
    expect(toml).toContain('command = "npx"');
  });
});

describe("merge with existing config (R2)", () => {
  it("preserves every other server and key in a JSON config", async () => {
    await fs.mkdir(path.join(root, ".cursor"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".cursor/mcp.json"),
      JSON.stringify({ mcpServers: { otro: { command: "node", args: ["x.js"] } }, misc: 42 }, null, 2)
    );

    await applyConnect(root, { clients: ["cursor"] });

    const config = JSON.parse(await read(".cursor/mcp.json")) as {
      mcpServers: Record<string, unknown>;
      misc: number;
    };
    expect(config.mcpServers.otro).toEqual({ command: "node", args: ["x.js"] });
    expect(config.misc).toBe(42);
    expect(config.mcpServers.sdd).toBeDefined();
  });

  it("preserves other tables in a TOML config and replaces only [mcp_servers.sdd]", async () => {
    await fs.mkdir(path.join(root, ".codex"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".codex/config.toml"),
      ['model = "gpt-5"', "", "[mcp_servers.otro]", 'command = "node"', 'args = ["x.js"]', ""].join("\n")
    );

    await applyConnect(root, { clients: ["codex"] });

    const toml = await read(".codex/config.toml");
    expect(toml).toContain('model = "gpt-5"');
    expect(toml).toContain("[mcp_servers.otro]");
    expect(toml).toContain("[mcp_servers.sdd]");
    // The foreign table keeps its own body.
    expect(toml).toMatch(/\[mcp_servers\.otro\][\s\S]*?args = \["x\.js"\]/);
  });

  it("replaces a stale sdd entry instead of duplicating it", async () => {
    await fs.mkdir(path.join(root, ".codex"), { recursive: true });
    await fs.writeFile(
      path.join(root, ".codex/config.toml"),
      ["[mcp_servers.sdd]", 'command = "node"', 'args = ["viejo.js"]', ""].join("\n")
    );

    await applyConnect(root, { clients: ["codex"] });

    const toml = await read(".codex/config.toml");
    expect(toml.match(/\[mcp_servers\.sdd\]/g)).toHaveLength(1);
    expect(toml).not.toContain("viejo.js");
  });

  it("is idempotent: the second run reports 'unchanged' and leaves the bytes alone", async () => {
    await applyConnect(root, { clients: ["cursor", "codex", "opencode"] });
    const before = await Promise.all(
      [".cursor/mcp.json", ".codex/config.toml", "opencode.json"].map((f) => read(f))
    );

    const second = await applyConnect(root, { clients: ["cursor", "codex", "opencode"] });
    expect(second.filter((r) => r.kind === "mcp").every((r) => r.status === "unchanged")).toBe(true);

    const after = await Promise.all(
      [".cursor/mcp.json", ".codex/config.toml", "opencode.json"].map((f) => read(f))
    );
    expect(after).toEqual(before);
  });
});

describe("unparseable config (R3)", () => {
  it("never touches a broken JSON file and reports the error without aborting", async () => {
    await fs.mkdir(path.join(root, ".cursor"), { recursive: true });
    const broken = "{ esto no es json";
    await fs.writeFile(path.join(root, ".cursor/mcp.json"), broken);

    const results = await applyConnect(root, { clients: ["cursor", "vscode"] });

    expect(await read(".cursor/mcp.json")).toBe(broken);
    const cursorMcp = byId(results, "cursor").find((r) => r.kind === "mcp");
    expect(cursorMcp?.status).toBe("error");
    expect(cursorMcp?.detail).toBeTruthy();
    // The other client still got done: one bad file does not abort the run.
    expect(byId(results, "vscode").find((r) => r.kind === "mcp")?.status).toBe("created");
  });
});

describe("skills and native commands (R4, R5, R6)", () => {
  it("writes the portable SKILL.md for skill-capable clients and to .agents/skills", async () => {
    await applyConnect(root, { clients: ["claude-code", "codex"] });

    for (const file of [
      ".claude/skills/sdd-serve/SKILL.md",
      ".codex/skills/sdd-serve/SKILL.md",
      ".agents/skills/sdd-serve/SKILL.md"
    ]) {
      expect(await exists(file)).toBe(true);
      const content = await read(file);
      expect(content.startsWith("---\n")).toBe(true);
      expect(content).toContain("name: sdd-serve");
      expect(content).toContain("description:");
    }
  });

  it("writes native commands for the clients that do not read SKILL.md", async () => {
    await applyConnect(root, { clients: ["gemini", "opencode"] });

    const toml = await read(".gemini/commands/sdd/serve.toml");
    expect(toml).toContain("description = ");
    expect(toml).toContain("prompt = ");
    expect(toml).toContain("sdd_next_request");

    const md = await read(".opencode/command/sdd-serve.md");
    expect(md.startsWith("---\n")).toBe(true);
    expect(md).toContain("sdd_respond_request");
  });

  it("every invocation surface carries the full loop and the hard stop (R6)", () => {
    for (const text of [SERVE_QUEUE_INSTRUCTIONS.es, SERVE_QUEUE_INSTRUCTIONS.en]) {
      expect(text).toContain("sdd_next_request");
      expect(text).toContain("sdd_respond_request");
      expect(text).toMatch(/specs\//);
    }
  });
});

describe("dry run (R8)", () => {
  it("plans every target and writes absolutely nothing", async () => {
    const planned = await planConnect(root, { clients: ["cursor", "codex", "gemini"] });
    expect(planned.length).toBeGreaterThan(0);
    expect(planned.every((r) => r.status === "planned")).toBe(true);

    for (const file of [".cursor/mcp.json", ".codex/config.toml", ".gemini/commands/sdd/serve.toml"]) {
      expect(await exists(file)).toBe(false);
    }
  });
});

describe("sidecar layout", () => {
  it("registers the PROJECT root and writes configs there, not inside spec/", async () => {
    // A sidecar project: the SDD root is <project>/spec, but the client's
    // config lives at the project root and SDD_PROJECT_ROOT must be the
    // project — the server resolves the sidecar on its own.
    const project = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-sidecar-test-"));
    try {
      const sidecar = path.join(project, "spec");
      await fs.mkdir(sidecar, { recursive: true });
      await fs.writeFile(path.join(sidecar, "sdd.policy.yaml"), "version: 1\n");
      for (const dir of ["idea", "specs", "bitacora"]) {
        await fs.mkdir(path.join(sidecar, dir), { recursive: true });
      }

      await applyConnect(project, { clients: ["cursor"] });

      const config = JSON.parse(await fs.readFile(path.join(project, ".cursor/mcp.json"), "utf8")) as {
        mcpServers: { sdd: { env: Record<string, string> } };
      };
      expect(config.mcpServers.sdd.env.SDD_PROJECT_ROOT).toBe(project);
      await expect(fs.access(path.join(sidecar, ".cursor/mcp.json"))).rejects.toThrow();
    } finally {
      await fs.rm(project, { recursive: true, force: true });
    }
  });
});

describe("detection and empty result (R9)", () => {
  it("auto-detects only the clients whose marker exists", async () => {
    await pretendInstalled("cursor");
    const results = await applyConnect(root, {});
    const ids = new Set(results.map((r) => r.clientId));
    expect(ids.has("cursor")).toBe(true);
    expect(ids.has("windsurf")).toBe(false);
  });

  it("returns an empty list (not an error) when nothing is detected", async () => {
    expect(await applyConnect(root, {})).toEqual([]);
  });

  it("an explicit --client overrides detection", async () => {
    const results = await applyConnect(root, { clients: ["windsurf"] });
    expect(results.some((r) => r.clientId === "windsurf" && r.status === "created")).toBe(true);
    expect(await exists(".windsurf/mcp_config.json")).toBe(true);
  });
});
