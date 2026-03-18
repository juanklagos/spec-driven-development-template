import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
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
    name: "sdd-mcp-integration-test",
    version: "1.1.0"
  },
  {
    capabilities: {}
  }
);

function asObject(result) {
  return result.structuredContent ?? {};
}

async function writeApprovedSpecBundle(projectRoot, specId) {
  const specDir = path.join(projectRoot, "specs", specId);

  await fs.writeFile(
    path.join(specDir, "spec.md"),
    `# Spec ${specId}

## Summary

Fixture integration test for MCP.

## Scope

- Create one approved spec
- Open gate cleanly
- Read project resources through MCP

## Acceptance criteria

- Validation passes
- Gate passes
- Status and roadmap can be generated

## Estado / Status

- Current state / Estado actual: Approved / Aprobada
- Approved by / Aprobada por: MCP Integration Test
- Approval date / Fecha de aprobación: 2026-03-18
- Approval evidence / Evidencia de aprobación: Automated integration test fixture.
`,
    "utf8"
  );

  await fs.writeFile(
    path.join(specDir, "plan.md"),
    `# Plan ${specId}

## Risks

- low risk for fixture flow

## Dependencies

- local MCP server
- workspace generation

## Milestones

1. Create workspace
2. Create and approve spec
3. Generate status and roadmap
`,
    "utf8"
  );

  await fs.writeFile(
    path.join(specDir, "tasks.md"),
    `# Tasks ${specId}

- [x] Create workspace
- [x] Create first spec
- [x] Approve spec and align plan
- [ ] Implement only after explicit consent
`,
    "utf8"
  );

  await fs.writeFile(
    path.join(specDir, "research.md"),
    `# Research ${specId}

- Fixture test uses the template structure as the base artifact.
`,
    "utf8"
  );

  await fs.writeFile(
    path.join(specDir, "history.md"),
    `# History ${specId}

## 2026-03-18

- Created by MCP integration test.
`,
    "utf8"
  );

  const indexPath = path.join(projectRoot, "specs", "INDEX.md");
  await fs.writeFile(
    indexPath,
    `# Specs Index / Índice de specs

| Number | Name | Status | Priority | Owner | Updated |
|---|---|---|---|---|---|
| 001 | fixture-landing | Approved / Aprobada | High / Alta | MCP Integration Test | 2026-03-18 |
`,
    "utf8"
  );
}

async function main() {
  const projectName = `mcp-fixture-${Date.now()}`;
  let projectRoot = "";

  try {
    await client.connect(transport);

    const createWorkspaceResult = await client.callTool({
      name: "sdd_create_workspace",
      arguments: {
        projectName,
        assistant: "codex",
        profile: "recommended",
        useSpecKit: false
      }
    });

    const workspaceData = asObject(createWorkspaceResult);
    projectRoot = String(workspaceData.projectRoot);
    assert.ok(projectRoot.includes(path.join("www", projectName)));

    const createSpecResult = await client.callTool({
      name: "sdd_create_spec",
      arguments: {
        projectRoot,
        featureName: "Fixture landing",
        owner: "MCP Integration Test"
      }
    });

    const specData = asObject(createSpecResult);
    const specId = String(specData.specId);
    assert.equal(specId, "001-fixture-landing");

    await writeApprovedSpecBundle(projectRoot, specId);

    const validateResult = await client.callTool({
      name: "sdd_validate",
      arguments: { projectRoot }
    });
    assert.equal(asObject(validateResult).ok, true);

    await client.callTool({
      name: "sdd_record_user_consent",
      arguments: {
        projectRoot,
        summary: "Integration test approved implementation gate precondition"
      }
    });

    const gateResult = await client.callTool({
      name: "sdd_check_gate",
      arguments: { projectRoot }
    });
    assert.equal(asObject(gateResult).ok, true);

    await client.callTool({
      name: "sdd_generate_status",
      arguments: { projectRoot }
    });
    await client.callTool({
      name: "sdd_generate_roadmap",
      arguments: { projectRoot }
    });
    await client.callTool({
      name: "sdd_append_project_log",
      arguments: {
        projectRoot,
        entry: "- Integration test appended project log entry."
      }
    });
    await client.callTool({
      name: "sdd_write_daily_log",
      arguments: {
        projectRoot,
        date: "2026-03-18",
        content: "# Daily Log\n\n- Integration fixture daily entry."
      }
    });
    await client.callTool({
      name: "sdd_write_handoff",
      arguments: {
        projectRoot,
        fileName: "2026-03-18-handoff.md",
        content: "# Handoff\n\n- Integration fixture handoff."
      }
    });
    await client.callTool({
      name: "sdd_write_decision",
      arguments: {
        projectRoot,
        fileName: "2026-03-18-decision.md",
        content: "# Decision\n\n- Integration fixture decision."
      }
    });

    const indexResource = await client.readResource({
      uri: `sdd://project/${projectName}/index`
    });
    const ideaResource = await client.readResource({
      uri: `sdd://project/${projectName}/idea`
    });
    const logResource = await client.readResource({
      uri: `sdd://project/${projectName}/project-log`
    });
    const handoffResource = await client.readResource({
      uri: `sdd://project/${projectName}/latest-handoff`
    });
    const specResource = await client.readResource({
      uri: `sdd://project/${projectName}/specs/${specId}/spec.md`
    });

    assert.match(String(indexResource.contents[0].text), /fixture-landing/);
    assert.match(String(ideaResource.contents[0].text), /General Idea|Idea general/);
    assert.match(String(logResource.contents[0].text), /Integration test appended project log entry/);
    assert.match(String(handoffResource.contents[0].text), /Integration fixture handoff/);
    assert.match(String(specResource.contents[0].text), /Approved \/ Aprobada/);

    console.log("MCP integration test passed");
    console.log(`Project: ${projectName}`);
    console.log(`Spec: ${specId}`);
  } finally {
    if (projectRoot) {
      await fs.rm(projectRoot, { recursive: true, force: true });
    }
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
