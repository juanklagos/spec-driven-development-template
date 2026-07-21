import assert from "node:assert/strict";
import { promises as fs } from "node:fs";
import path from "node:path";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { validateEarsCriterion } from "../packages/sdd-core/dist/index.js";
import { buildIssueBody, buildIssueTitle } from "../packages/sdd-mcp/dist/github.js";
import packageJson from "../package.json" with { type: "json" };

const transport = new StdioClientTransport({
  command: "node",
  args: ["packages/sdd-mcp/dist/index.js"],
  cwd: process.cwd(),
  stderr: "inherit"
});

const client = new Client(
  {
    name: "sdd-mcp-integration-test",
    version: packageJson.version
  },
  {
    capabilities: {}
  }
);

function asObject(result) {
  return result.structuredContent ?? {};
}

async function writeApprovedSpecBundle(projectRoot, specId) {
  const sddRoot = path.join(projectRoot, "spec");
  const specDir = path.join(sddRoot, "specs", specId);

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

  const indexPath = path.join(sddRoot, "specs", "INDEX.md");
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
    const sddRoot = String(workspaceData.sddRoot);
    assert.ok(projectRoot.includes(path.join("www", projectName)));
    assert.equal(sddRoot, path.join(projectRoot, "spec"));
    assert.equal(String(workspaceData.layout), "sidecar");

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
    assert.equal(String(specData.specDir), path.join(sddRoot, "specs", specId));

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

    // --- SDD Builder board tools (same sdd-core layer as the REST API) ---

    const boardRead = asObject(
      await client.callTool({ name: "sdd_board_read", arguments: { projectRoot } })
    );
    assert.ok(Array.isArray(boardRead.canvas.nodes));
    const specNode = boardRead.canvas.nodes.find((node) => node.id === specId);
    assert.ok(specNode, "board should contain a node for the fixture spec");
    const specCard = boardRead.specs.find((spec) => spec.id === specId);
    assert.equal(specCard.tasks.total, 4);
    assert.equal(specCard.tasks.done, 3);

    const tasksRead = asObject(
      await client.callTool({ name: "sdd_read_tasks", arguments: { projectRoot, specId } })
    );
    const pendingTask = tasksRead.tasks.find((task) => !task.done);
    assert.ok(pendingTask, "fixture should have one pending task");

    const toggled = asObject(
      await client.callTool({
        name: "sdd_set_task_done",
        arguments: { projectRoot, specId, line: pendingTask.line, done: true }
      })
    );
    assert.equal(toggled.tasks.filter((task) => task.done).length, 4);
    const tasksOnDisk = await fs.readFile(
      path.join(projectRoot, "spec", "specs", specId, "tasks.md"),
      "utf8"
    );
    assert.doesNotMatch(tasksOnDisk, /^- \[ \]/m, "tasks.md should have no pending checkbox left");

    await client.callTool({
      name: "sdd_board_write",
      arguments: {
        projectRoot,
        canvas: {
          nodes: [
            ...boardRead.canvas.nodes,
            { id: "note-1", type: "text", text: "Fixture note", x: 400, y: 0, width: 200, height: 100 }
          ],
          edges: []
        }
      }
    });

    const connected = asObject(
      await client.callTool({
        name: "sdd_board_connect",
        arguments: { projectRoot, fromNode: specId, toNode: "note-1", label: "depends on" }
      })
    );
    assert.equal(connected.canvas.edges.length, 1);
    assert.equal(connected.canvas.edges[0].fromNode, specId);
    assert.equal(connected.canvas.edges[0].toNode, "note-1");
    // Typed edges (spec 009, R2): canonical labels get a JSON Canvas color.
    assert.equal(connected.canvas.edges[0].color, "3", "'depends on' edges carry the amber preset color");

    const boardAfter = asObject(
      await client.callTool({ name: "sdd_board_read", arguments: { projectRoot } })
    );
    assert.equal(boardAfter.canvas.edges.length, 1, "edge should persist in specs/board.canvas");

    // --- Builder v2 tools (spec 007): gate summary + surgical spec edits ---

    const secondSpec = asObject(
      await client.callTool({
        name: "sdd_create_spec",
        arguments: { projectRoot, featureName: "Guided editor fixture", owner: "MCP Integration Test" }
      })
    );
    const secondSpecId = String(secondSpec.specId);
    assert.equal(secondSpecId, "002-guided-editor-fixture");
    const secondSpecPath = path.join(projectRoot, "spec", "specs", secondSpecId, "spec.md");

    // Before approving 002: the fixture 001 uses a free-form approval block
    // (no backticked "Estado / Status:" line) so neither spec counts as
    // approved yet; the fresh 002 must carry a grouped not-approved issue.
    const preSummary = asObject(
      await client.callTool({ name: "sdd_gate_summary", arguments: { projectRoot } })
    );
    assert.equal(preSummary.totalSpecs, 2);
    assert.equal(preSummary.approvedSpecs, 0);
    assert.ok(
      (preSummary.specIssues[secondSpecId] ?? []).some((m) => m.code === "spec-not-approved"),
      "gate summary should group the not-approved issue under the new spec id"
    );
    for (const messages of Object.values(preSummary.specIssues)) {
      for (const message of messages) {
        assert.match(String(message.path), /^specs[/\\]\d{3}-/, "spec issues must point into specs/NNN-...");
      }
    }

    const approved = asObject(
      await client.callTool({
        name: "sdd_approve_spec",
        arguments: { projectRoot, specId: secondSpecId, approver: "MCP Integration Test" }
      })
    );
    assert.equal(approved.status, "Aprobado");
    assert.equal(approved.approver, "MCP Integration Test");
    const approvedOnDisk = await fs.readFile(secondSpecPath, "utf8");
    assert.match(approvedOnDisk, /Estado \/ Status: `Aprobado`/);
    assert.match(approvedOnDisk, /Aprobado por \/ Approved by: `MCP Integration Test`/);
    assert.doesNotMatch(approvedOnDisk, /YYYY-MM-DD/);
    assert.match(approvedOnDisk, /Aprobado desde SDD Builder/);

    const sectionsResult = asObject(
      await client.callTool({
        name: "sdd_update_spec_sections",
        arguments: {
          projectRoot,
          specId: secondSpecId,
          story: "Como tester, quiero secciones quirúrgicas, para no romper el resto del spec.",
          scenarios: ["Dado un spec de plantilla, cuando guardo secciones, entonces la aprobación no cambia."],
          criteria: ["CUANDO se guarden secciones, EL SISTEMA DEBERÁ preservar el bloque de aprobación."],
          outOfScope: "Editor de texto libre completo."
        }
      })
    );
    assert.ok(Array.isArray(sectionsResult.updated));
    const editedOnDisk = await fs.readFile(secondSpecPath, "utf8");
    assert.match(editedOnDisk, /Como tester, quiero secciones quirúrgicas/);
    assert.match(editedOnDisk, /1\. Dado un spec de plantilla/);
    assert.match(editedOnDisk, /- CUANDO se guarden secciones/);
    assert.match(editedOnDisk, /## Fuera de alcance/);
    // Surgical guarantee: the approval block written above is untouched.
    assert.match(editedOnDisk, /Estado \/ Status: `Aprobado`/);
    assert.match(editedOnDisk, /Aprobado por \/ Approved by: `MCP Integration Test`/);
    // And unrelated sections (Requisitos) survive too.
    assert.match(editedOnDisk, /## Requisitos/);

    const postSummary = asObject(
      await client.callTool({ name: "sdd_gate_summary", arguments: { projectRoot } })
    );
    assert.equal(postSummary.approvedSpecs, 1, "002 should now count as approved");
    assert.equal(postSummary.ok, true, "gate should stay open after the surgical edits");
    assert.deepEqual(
      postSummary.dependencyWarnings,
      [],
      "the spec->note 'depends on' edge must NOT warn (notes are not specs)"
    );

    // --- Builder v4 (spec 009, R2): typed edges + dependency warnings ------
    // Put 002 on the canvas and draw 002 --"depende de"--> 001. 002 is
    // approved (block above) while the fixture 001 reads as `Pendiente`
    // (its free-form approval block has no backticked "Estado / Status"
    // line), so the summary must carry exactly one dependency warning.
    const boardBeforeDep = asObject(
      await client.callTool({ name: "sdd_board_read", arguments: { projectRoot } })
    );
    await client.callTool({
      name: "sdd_board_write",
      arguments: {
        projectRoot,
        canvas: {
          nodes: [
            ...boardBeforeDep.canvas.nodes.filter((node) => node.id !== secondSpecId),
            {
              id: secondSpecId,
              type: "file",
              file: `specs/${secondSpecId}/spec.md`,
              x: 0,
              y: 320,
              width: 300,
              height: 180
            }
          ],
          edges: boardBeforeDep.canvas.edges
        }
      }
    });

    const depConnect = asObject(
      await client.callTool({
        name: "sdd_board_connect",
        arguments: { projectRoot, fromNode: secondSpecId, toNode: specId, label: "depende de" }
      })
    );
    const depEdge = depConnect.canvas.edges.find(
      (edge) => edge.fromNode === secondSpecId && edge.toNode === specId
    );
    assert.ok(depEdge, "the typed edge should be persisted");
    assert.equal(depEdge.color, "3", "'depende de' edges carry the amber preset color");

    const depSummary = asObject(
      await client.callTool({ name: "sdd_gate_summary", arguments: { projectRoot } })
    );
    assert.equal(depSummary.ok, true, "dependency warnings are advisory and must not close the gate");
    assert.equal(depSummary.dependencyWarnings.length, 1);
    assert.equal(depSummary.dependencyWarnings[0].dependent, secondSpecId);
    assert.equal(depSummary.dependencyWarnings[0].dependency, specId);
    assert.equal(depSummary.dependencyWarnings[0].edgeId, depEdge.id);
    assert.match(depSummary.dependencyWarnings[0].message, /aprobada .* is approved/s);

    // --- Builder v4 (spec 009, R3): gh issue argument construction ---------
    // The gh CLI itself is never invoked here (no network, no real repos);
    // these pure helpers are what POST /api/spec/:id/issues feeds to
    // `gh issue create --title ... --body ...`.
    assert.equal(
      buildIssueTitle("009-builder-v4-teams", "  T1  (R1):   vista Kanban.  "),
      "[009-builder-v4-teams] T1 (R1): vista Kanban."
    );
    const longTitle = buildIssueTitle("009-builder-v4-teams", "x".repeat(500));
    assert.ok(longTitle.length <= 240, "issue titles are length-capped");
    assert.ok(longTitle.endsWith("…"));
    const issueBody = buildIssueBody("009-builder-v4-teams", "T1: vista Kanban", "https://example.test/blob/HEAD/spec/specs/009-builder-v4-teams/tasks.md");
    assert.match(issueBody, /Tarea \/ Task: T1: vista Kanban/);
    assert.match(issueBody, /Bundle: https:\/\/example\.test\/blob\/HEAD\/spec\/specs\/009-builder-v4-teams\/tasks\.md/);
    assert.match(issueBody, /Pending task from spec/);

    // --- Builder v3 (spec 008, R3): shared EARS lint exported by sdd-core ---
    // The builder frontend duplicates these rules in builder/src/ears.ts
    // ("keep in sync" contract); this block keeps the core copy honest.
    assert.equal(
      validateEarsCriterion("CUANDO el usuario pulse pagar, EL SISTEMA DEBERÁ crear el pedido.").level,
      "ok"
    );
    assert.equal(
      validateEarsCriterion("WHEN the user clicks pay, THE SYSTEM SHALL create the order.").level,
      "ok"
    );
    assert.equal(
      validateEarsCriterion("while offline, the system shall queue writes").level,
      "ok",
      "the EARS pattern must be case-insensitive"
    );
    assert.equal(
      validateEarsCriterion("- SI el pago falla, EL SISTEMA DEBERA reintentar 3 veces.").level,
      "ok",
      "leading bullets and unaccented DEBERA are tolerated"
    );
    const missingShall = validateEarsCriterion("El checkout debe funcionar bien");
    assert.equal(missingShall.level, "warning");
    assert.equal(missingShall.matchesPattern, false);
    const vague = validateEarsCriterion("CUANDO cargue el panel, EL SISTEMA DEBERÁ ser rápido.");
    assert.equal(vague.level, "warning");
    assert.deepEqual(vague.vagueWords, ["rápido"]);
    assert.equal(
      validateEarsCriterion("CUANDO cargue el panel, EL SISTEMA DEBERÁ responder en menos de 2 segundos.").level,
      "ok",
      "a measurable number silences the vague-word warning"
    );
    assert.equal(validateEarsCriterion("   ").level, "ok", "empty criteria lint clean");

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
