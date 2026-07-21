import assert from "node:assert/strict";
import { APPROVED_STATUS_ERE, DOC_GUIDES, NEGATED_STATUS_ERE, docsUrl, isApprovedStatus, specTone } from "../packages/sdd-core/dist/index.js";
import { renderDashboard } from "../packages/sdd-mcp/dist/dashboard.js";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { validateEarsCriterion } from "../packages/sdd-core/dist/index.js";
import { buildIssueBody, buildIssueTitle } from "../packages/sdd-mcp/dist/github.js";
import packageJson from "../package.json" with { type: "json" };

const execFileAsync = promisify(execFile);
const REPO_ROOT = process.cwd();

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

/**
 * Run one of the shell entry points the way CI and the GitHub Action do.
 * The bash gate is half of the contract: TS and bash must open and close
 * together, and bash cannot import the TypeScript rules.
 */
async function runSddScript(scriptName, ...args) {
  try {
    const { stdout, stderr } = await execFileAsync("bash", [path.join(REPO_ROOT, "scripts", scriptName), ...args]);
    return { code: 0, output: `${stdout}${stderr}` };
  } catch (error) {
    return { code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` };
  }
}

/**
 * Overwrite one spec bundle with a given approval status.
 *
 * `healthy: false` guts exactly what the approval quality checks look at
 * (placeholder date, empty evidence, contentless plan.md, no checklist tasks),
 * so a gate that counts the spec as approved MUST close and a gate that
 * silently reads it as unapproved passes with a cheerful `ok: true`.
 */
async function writeGateGuardSpec(sddRoot, specId, status, { healthy = true, consent = "recorded" } = {}) {
  const specDir = path.join(sddRoot, "specs", specId);

  await fs.writeFile(
    path.join(specDir, "spec.md"),
    `# Spec ${specId}

## Estado / Status

- Estado / Status: \`${status}\`
- Aprobado por / Approved by: \`Gate Guard\`
- Fecha de aprobación / Approval date: ${healthy ? "2026-03-18" : "YYYY-MM-DD"}
- Approval evidence / Evidencia de aprobación: ${healthy ? "gate guard fixture" : ""}
`,
    "utf8"
  );
  await fs.writeFile(
    path.join(specDir, "plan.md"),
    healthy
      ? "# Plan\n\n## Riesgos / Risks\n\n- low\n\n## Dependencias / Dependencies\n\n- none\n\n## Fases / Phases\n\n1. ship\n"
      : "# Plan\n",
    "utf8"
  );
  await fs.writeFile(
    path.join(specDir, "tasks.md"),
    healthy ? "# Tasks\n\n- [ ] implement only after consent\n" : "# Tasks\n",
    "utf8"
  );

  const consentLog = path.join(sddRoot, ".sdd", "user-consent.log");
  await fs.mkdir(path.dirname(consentLog), { recursive: true });
  if (consent === "recorded") {
    await fs.writeFile(consentLog, "[2026-03-18] gate guard consent\n", "utf8");
  } else if (consent === "empty") {
    await fs.writeFile(consentLog, "", "utf8");
  } else {
    await fs.rm(consentLog, { force: true });
  }
}

async function main() {
  const projectName = `mcp-fixture-${Date.now()}`;
  let projectRoot = "";
  let guardRoot = "";
  let gateRoot = "";
  let emptyRoot = "";
  let nonWorkspaceRoot = "";

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
          // Full-template sections (spec 010, R2):
          requirements: ["R1 fixture: requisito escrito por el editor completo."],
          properties: ["Para toda escritura de secciones, EL SISTEMA DEBERÁ preservar el resto del documento."],
          successCriteria: ["El bloque de aprobación sobrevive a todas las ediciones."],
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
    // Full-template sections landed under their headings (spec 010, R2).
    assert.match(editedOnDisk, /## Requisitos\n\n- R1 fixture: requisito escrito por el editor completo\./);
    assert.match(editedOnDisk, /## Propiedades de la spec[^\n]*\n\n- Para toda escritura de secciones/);
    assert.match(editedOnDisk, /## Criterios de éxito\n\n- El bloque de aprobación sobrevive/);
    // The template placeholders of the replaced sections are gone.
    assert.doesNotMatch(editedOnDisk, /- Requisito 1/);
    assert.doesNotMatch(editedOnDisk, /- Criterio 1/);

    // Evidence pass-through (spec 010, R2): re-approving with explicit
    // evidence overwrites the evidence line and nothing else.
    const reApproved = asObject(
      await client.callTool({
        name: "sdd_approve_spec",
        arguments: {
          projectRoot,
          specId: secondSpecId,
          approver: "MCP Integration Test",
          evidence: "Evidencia fixture 010 — aprobado con evidencia explícita."
        }
      })
    );
    assert.equal(reApproved.evidenceUpdated, true);
    assert.ok(reApproved.fieldsUpdated.includes("evidence"));
    const reApprovedOnDisk = await fs.readFile(secondSpecPath, "utf8");
    assert.match(reApprovedOnDisk, /Evidencia fixture 010 — aprobado con evidencia explícita\./);
    assert.doesNotMatch(reApprovedOnDisk, /Aprobado desde SDD Builder/);
    // The surgical sections written above are still intact after re-approving.
    assert.match(reApprovedOnDisk, /## Requisitos\n\n- R1 fixture/);

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

    // "contiene"/"contains" purpose (spec 010, R3): gray hex color persisted,
    // and NEVER a dependency warning (structural, not an approval-order edge).
    const containsConnect = asObject(
      await client.callTool({
        name: "sdd_board_connect",
        arguments: { projectRoot, fromNode: "note-1", toNode: specId, label: "contiene" }
      })
    );
    const containsEdge = containsConnect.canvas.edges.find(
      (edge) => edge.fromNode === "note-1" && edge.toNode === specId
    );
    assert.ok(containsEdge, "the contains edge should be persisted");
    assert.equal(containsEdge.color, "#6b7280", "'contiene' edges carry the gray hex color");

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

    // --- MCP App (spec 006, R5): board view for MCP Apps hosts (SEP-1865) --
    // Tool and ui:// resource registered through @modelcontextprotocol/ext-apps.

    const toolList = await client.listTools();
    const boardAppTool = toolList.tools.find((tool) => tool.name === "sdd_board_app");
    assert.ok(boardAppTool, "sdd_board_app must be listed");
    assert.equal(boardAppTool._meta?.ui?.resourceUri, "ui://sdd/board.html");
    assert.equal(
      boardAppTool._meta?.["ui/resourceUri"],
      "ui://sdd/board.html",
      "legacy meta key must be populated for older MCP Apps hosts"
    );

    const resourceList = await client.listResources();
    const boardAppResource = resourceList.resources.find((entry) => entry.uri === "ui://sdd/board.html");
    assert.ok(boardAppResource, "ui://sdd/board.html must be listed");
    assert.equal(boardAppResource.mimeType, "text/html;profile=mcp-app");

    const uiResource = await client.readResource({ uri: "ui://sdd/board.html" });
    assert.equal(uiResource.contents[0].mimeType, "text/html;profile=mcp-app");
    const appHtml = String(uiResource.contents[0].text);
    assert.match(appHtml, /^<!doctype html>/i);
    for (const id of ["board-app", "gate-chip", "dep-chip", "refresh-btn", "app-message", "dep-warnings", "board-svg", "spec-cards"]) {
      assert.ok(appHtml.includes(`id="${id}"`), `app HTML must contain #${id}`);
    }
    // The official ext-apps App bridge is inlined (self-contained iframe, no
    // CDNs) with its trailing export statement rewritten to a global.
    assert.ok(appHtml.includes("globalThis.__MCP_EXT_APPS__={"), "bridge exports must be rewritten for inlining");
    assert.ok(appHtml.includes("App:"), "the rewritten bridge must expose the App class");
    assert.doesNotMatch(appHtml, /(?:src|href)="https?:/, "app HTML must not reference external resources");
    // Well-formedness: with script bodies collapsed, structural tags balance.
    const appMarkup = appHtml.replace(/<script type="module">[\s\S]*?<\/script>/g, '<script type="module"></script>');
    assert.equal((appMarkup.match(/<script type="module"><\/script>/g) ?? []).length, 2, "bridge + view scripts expected");
    for (const tag of ["html", "head", "body", "main", "header", "section", "svg", "button", "style"]) {
      const opened = (appMarkup.match(new RegExp(`<${tag}[\\s>]`, "g")) ?? []).length;
      const closed = (appMarkup.match(new RegExp(`</${tag}>`, "g")) ?? []).length;
      assert.equal(opened, closed, `unbalanced <${tag}> in app HTML`);
    }

    const boardApp = asObject(await client.callTool({ name: "sdd_board_app", arguments: { projectRoot } }));
    assert.equal(boardApp.projectRoot, projectRoot);
    const boardAppSpecIds = boardApp.board.specs.map((spec) => spec.id);
    assert.ok(boardAppSpecIds.includes(specId), "app payload must include the fixture spec");
    assert.ok(boardAppSpecIds.includes(secondSpecId), "app payload must include the second fixture spec");
    assert.ok(
      boardApp.board.canvas.nodes.some((node) => node.id === specId),
      "app payload canvas must include the fixture spec node"
    );
    assert.equal(boardApp.gate.totalSpecs, 2, "app payload gate must match the workspace");
    assert.equal(
      boardApp.gate.dependencyWarnings.length,
      1,
      "app payload must carry the same dependency warning as sdd_gate_summary"
    );

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

    // Regression: ONE tone rule for canvas, kanban, dashboard and MCP tools.
    // These two cases used to disagree between surfaces (spec 010 follow-up):
    // a feminine "Aprobada" read as pending on the canvas, and an unapproved
    // spec with every task ticked read as "done" on the canvas and kanban.
    assert.equal(specTone("Aprobada", { done: 0, total: 3 }), "ok", "Aprobada must count as approved");

    // Negation must win over the substring rule. Found by the adversarial
    // re-verification of 2026-07-21: `No aprobado` contains an approval word,
    // so the shared rule counted it as APPROVED and painted the spec green with
    // Implement enabled — the same fail-open, in the opposite direction.
    for (const negated of ["No aprobado", "Not approved", "unapproved", "NO APROBADO", "no-aprobada", "Non approved"]) {
      assert.equal(isApprovedStatus(negated), false, `"${negated}" must NOT count as approved`);
      assert.equal(specTone(negated, { done: 3, total: 3 }), "pending", `"${negated}" must never render done`);
    }
    for (const approved of ["Aprobado", "Aprobada", "Approved", " Approved ", "Aprobado / Approved"]) {
      assert.equal(isApprovedStatus(approved), true, `"${approved}" must count as approved`);
    }
    assert.equal(specTone("Aprobado", { done: 0, total: 3 }), "ok");
    assert.equal(specTone("Approved", { done: 3, total: 3 }), "done");
    assert.equal(specTone("Pendiente", { done: 3, total: 3 }), "pending", "no approval, no done");
    assert.equal(specTone(undefined, { done: 0, total: 0 }), "pending");

    // --- Data-integrity guards: concurrent writes and spec numbering --------
    // These three defects silently destroyed the user's work, so each guard is
    // written to FAIL on the pre-fix code:
    //   (a) atomicWrite used one "<file>.tmp-<pid>" scratch path per process
    //       and setSpecTaskDone was an unguarded read-modify-write, so 20
    //       concurrent toggles left 1 fulfilled + 19 rejected with
    //       "ENOENT ... rename <file>.tmp-<pid>" and 1/20 ticks on disk.
    //   (b) createSpec numbered by directory COUNT, so a workspace holding
    //       001 and 003 produced a SECOND 003.
    //   (c) concurrent createSpec calls all read the same count (-> duplicate
    //       ids) and INDEX.md was rewritten whole (-> only one row survived).
    // They run in their own workspace so the tuned assertions above stay put.
    guardRoot = String(
      asObject(
        await client.callTool({
          name: "sdd_create_workspace",
          arguments: {
            projectName: `mcp-guards-${Date.now()}`,
            assistant: "codex",
            profile: "recommended",
            useSpecKit: false
          }
        })
      ).projectRoot
    );
    const guardSpecsDir = path.join(guardRoot, "spec", "specs");
    const guardIndexPath = path.join(guardSpecsDir, "INDEX.md");
    const indexRows = async () =>
      (await fs.readFile(guardIndexPath, "utf8")).split("\n").filter((line) => /^\|\s*\d{3}\s*\|/.test(line));

    // (a) N concurrent task toggles must ALL succeed and ALL persist.
    const probeId = String(
      asObject(
        await client.callTool({
          name: "sdd_create_spec",
          arguments: { projectRoot: guardRoot, featureName: "Concurrency probe", owner: "Guard" }
        })
      ).specId
    );
    assert.equal(probeId, "001-concurrency-probe");
    const TOGGLES = 20;
    await fs.writeFile(
      path.join(guardSpecsDir, probeId, "tasks.md"),
      ["# Tasks", "", ...Array.from({ length: TOGGLES }, (_, i) => `- [ ] concurrent task ${i}`)].join("\n") + "\n",
      "utf8"
    );
    const pending = asObject(
      await client.callTool({ name: "sdd_read_tasks", arguments: { projectRoot: guardRoot, specId: probeId } })
    ).tasks;
    assert.equal(pending.length, TOGGLES);

    const toggleResults = await Promise.allSettled(
      pending.map((task) =>
        client.callTool({
          name: "sdd_set_task_done",
          arguments: { projectRoot: guardRoot, specId: probeId, line: task.line, done: true }
        })
      )
    );
    const toggleFailures = toggleResults.filter(
      (settled) => settled.status === "rejected" || settled.value?.isError
    );
    assert.equal(
      toggleFailures.length,
      0,
      `all ${TOGGLES} concurrent task toggles must succeed, got ${toggleFailures.length} failures: ` +
        JSON.stringify(toggleFailures[0]?.reason ?? toggleFailures[0]?.value?.content)
    );
    const toggledOnDisk = asObject(
      await client.callTool({ name: "sdd_read_tasks", arguments: { projectRoot: guardRoot, specId: probeId } })
    ).tasks;
    assert.equal(
      toggledOnDisk.filter((task) => task.done).length,
      TOGGLES,
      "every concurrent toggle must persist: a lost update means one user's tick was silently discarded"
    );
    // A failed or racing atomic write must not litter the bundle with scratch files.
    assert.deepEqual(
      (await fs.readdir(path.join(guardSpecsDir, probeId))).filter((name) => name.includes(".tmp-")),
      [],
      "atomicWrite must leave no temp files behind"
    );

    // (b) Numbering follows the highest number ON DISK, not the folder count,
    //     so it agrees with scripts/new-spec.sh. With 001 and 003 present the
    //     next spec is 004 — never a second 003.
    await fs.cp(path.join(guardSpecsDir, probeId), path.join(guardSpecsDir, "003-hand-made"), {
      recursive: true
    });
    const afterGap = String(
      asObject(
        await client.callTool({
          name: "sdd_create_spec",
          arguments: { projectRoot: guardRoot, featureName: "After gap", owner: "Guard" }
        })
      ).specId
    );
    assert.equal(afterGap, "004-after-gap", "next spec number must be max(on disk) + 1");

    // (c) Concurrent createSpec calls: distinct ids, one INDEX row each.
    const rowsBefore = (await indexRows()).length;
    const CONCURRENT_SPECS = ["Alpha race", "Beta race", "Gamma race"];
    const createdIds = (
      await Promise.all(
        CONCURRENT_SPECS.map((featureName) =>
          client.callTool({
            name: "sdd_create_spec",
            arguments: { projectRoot: guardRoot, featureName, owner: "Guard" }
          })
        )
      )
    ).map((result) => String(asObject(result).specId));
    assert.equal(
      new Set(createdIds.map((id) => id.slice(0, 3))).size,
      CONCURRENT_SPECS.length,
      `concurrent createSpec must allocate distinct numbers, got ${createdIds.join(", ")}`
    );
    for (const id of createdIds) {
      assert.ok(
        await fs.stat(path.join(guardSpecsDir, id, "spec.md")).catch(() => null),
        `${id} must be a real bundle on disk`
      );
    }
    assert.equal(
      (await indexRows()).length,
      rowsBefore + CONCURRENT_SPECS.length,
      "every concurrently created spec must keep its own row in specs/INDEX.md"
    );

    // --- Gate integrity guards: the gate must fail CLOSED -------------------
    // The gate is this product's core promise, and every case below used to
    // open it by mistake. Each assertion fails on the pre-fix code:
    //   (d) the approval predicate existed FOUR times and the gate's copy
    //       (`status === "aprobado" || status === "approved"`) disagreed with
    //       every UI copy. With `Aprobada` (the label the builder prints),
    //       `Approved ` (trailing space) or `Aprobado / Approved`, checkGate
    //       reported approvedSpecs: 0, ok: true and SKIPPED every approval
    //       quality check AND the consent requirement, while the builder
    //       painted the card green and enabled "Implement".
    //   (e) an EMPTY .sdd/user-consent.log passed the TS gate (plain
    //       fs.access) while bash (`[ -s ]`) correctly failed.
    //   (f) checkGate never ran the policy check that the bash gate runs
    //       first: deleting the agent rule files gave bash exit 1 and TS
    //       `ok: true, errors: 0`.
    //   (g) the scripts silently fell back to the framework checkout they ship
    //       with, so the gate "passed" for any directory that is not an SDD
    //       workspace — including, through action.yml, every consumer of the
    //       published GitHub Action.

    // The bash gate cannot import the TS rule, so the literal is pinned here.
    const gateScriptSource = await fs.readFile(path.join(REPO_ROOT, "scripts/check-sdd-gate.sh"), "utf8");
    assert.equal(
      gateScriptSource.match(/^SDD_APPROVED_STATUS_ERE='([^']*)'/m)?.[1],
      APPROVED_STATUS_ERE,
      "scripts/check-sdd-gate.sh must use the exact approval ERE exported by sdd-core"
    );
    assert.ok(
      /^SDD_NEGATED_STATUS_ERE='[^']*'/m.test(gateScriptSource),
      "scripts/check-sdd-gate.sh must pin a negated-status ERE (negation wins over the substring rule)"
    );
    for (const negated of ["No aprobado", "Not approved", "unapproved"]) {
      assert.equal(
        new RegExp(NEGATED_STATUS_ERE, "i").test(negated),
        true,
        `the exported negation ERE must reject "${negated}"`
      );
    }

    gateRoot = String(
      asObject(
        await client.callTool({
          name: "sdd_create_workspace",
          arguments: {
            projectName: `mcp-gate-${Date.now()}`,
            assistant: "codex",
            profile: "recommended",
            useSpecKit: false
          }
        })
      ).projectRoot
    );
    const gateSddRoot = path.join(gateRoot, "spec");
    const gateSpecId = String(
      asObject(
        await client.callTool({
          name: "sdd_create_spec",
          arguments: { projectRoot: gateRoot, featureName: "Gate guard", owner: "Gate Guard" }
        })
      ).specId
    );
    const tsGate = async () =>
      asObject(await client.callTool({ name: "sdd_check_gate", arguments: { projectRoot: gateRoot } }));

    // (d) Every spelling the UI and the agents actually produce is approved,
    //     by BOTH gates, and therefore actually gets audited.
    for (const status of ["Aprobado", "Aprobada", "Approved ", "Aprobado / Approved"]) {
      await writeGateGuardSpec(gateSddRoot, gateSpecId, status);
      const healthy = await tsGate();
      const healthyBash = await runSddScript("check-sdd-gate.sh", gateRoot);
      assert.equal(healthy.approvedSpecs, 1, `checkGate must count "${status}" as approved`);
      assert.equal(healthy.ok, true, `a healthy "${status}" bundle must open the gate`);
      assert.equal(healthyBash.code, 0, `the bash gate must open for a healthy "${status}" bundle`);
      assert.match(
        healthyBash.output,
        /approved with checklist tasks/,
        `the bash gate must run the approval checks for "${status}"`
      );

      // Same spec, gutted: both gates must now refuse.
      await writeGateGuardSpec(gateSddRoot, gateSpecId, status, { healthy: false, consent: "missing" });
      const gutted = await tsGate();
      const guttedBash = await runSddScript("check-sdd-gate.sh", gateRoot);
      assert.equal(gutted.ok, false, `an approved-but-gutted "${status}" bundle must CLOSE the gate`);
      assert.equal(gutted.approvedSpecs, 1, `"${status}" must still be counted approved when gutted`);
      for (const code of [
        "placeholder-approval-date",
        "missing-approval-evidence",
        "plan-incomplete",
        "tasks-missing",
        "missing-consent-log"
      ]) {
        assert.ok(
          gutted.messages.some((message) => message.code === code),
          `"${status}" must report ${code}; skipping the approval checks is how the gate fails open`
        );
      }
      assert.notEqual(guttedBash.code, 0, `the bash gate must close for a gutted "${status}" bundle`);

      // The board card the user actually looks at agrees with the gate.
      const gateBoard = asObject(
        await client.callTool({ name: "sdd_board_read", arguments: { projectRoot: gateRoot } })
      );
      assert.notEqual(
        gateBoard.specs.find((spec) => spec.id === gateSpecId).tone,
        "pending",
        `the board must not show "${status}" as pending while the gate counts it approved`
      );
    }

    // (e) A consent log that exists but says nothing is not consent.
    await writeGateGuardSpec(gateSddRoot, gateSpecId, "Aprobada", { consent: "empty" });
    const emptyConsent = await tsGate();
    assert.equal(emptyConsent.ok, false, "an empty .sdd/user-consent.log must close the gate");
    assert.ok(
      emptyConsent.messages.some((message) => message.code === "missing-consent-log"),
      "an empty consent log must be reported as missing consent"
    );
    assert.notEqual(
      (await runSddScript("check-sdd-gate.sh", gateRoot)).code,
      0,
      "the bash gate must close on an empty consent log"
    );

    // (f) The TS gate runs the policy check the bash gate runs first.
    await writeGateGuardSpec(gateSddRoot, gateSpecId, "Aprobada");
    assert.equal((await tsGate()).ok, true, "the gate guard workspace must be green before the policy case");
    await fs.rm(path.join(gateSddRoot, "CLAUDE.md"), { force: true });
    const missingRules = await tsGate();
    assert.equal(missingRules.ok, false, "a missing agent rule file must close the TS gate, not only bash");
    assert.ok(
      missingRules.messages.some(
        (message) => message.code === "policy-required-file-missing" && message.path === "CLAUDE.md"
      ),
      "checkGate must surface the policy failure it used to ignore"
    );
    assert.notEqual(
      (await runSddScript("check-sdd-gate.sh", gateRoot)).code,
      0,
      "the bash gate must agree that a missing agent rule file closes the gate"
    );

    // (g) Strict root: a directory that is not an SDD workspace is a hard
    //     error. It must never silently validate the framework repo instead.
    nonWorkspaceRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-not-a-workspace-"));
    await fs.mkdir(path.join(nonWorkspaceRoot, "src"), { recursive: true });
    await fs.writeFile(path.join(nonWorkspaceRoot, "src/index.js"), "console.log('hi');\n", "utf8");
    for (const [script, banner] of [
      ["check-sdd-gate.sh", "Checking SDD gate in:"],
      ["check-sdd-policy.sh", "Checking SDD policy in:"],
      ["validate-sdd.sh", "Validating SDD structure in:"]
    ]) {
      const result = await runSddScript(script, nonWorkspaceRoot);
      assert.notEqual(result.code, 0, `${script} must fail against a directory with no SDD workspace`);
      assert.ok(
        !result.output.includes(banner),
        `${script} must not validate anything at all for a non-workspace (it used to validate the framework repo)`
      );
      assert.match(result.output, /not an SDD workspace/, `${script} must say why it refused`);
    }
    // ...while an explicit, real workspace still resolves through the same
    // path (guardRoot is an untouched sidecar; gateRoot lost its CLAUDE.md above).
    const realWorkspacePolicy = await runSddScript("check-sdd-policy.sh", guardRoot);
    assert.equal(
      realWorkspacePolicy.code,
      0,
      `strict root resolution must still accept a real workspace passed explicitly: ${realWorkspacePolicy.output}`
    );
    assert.match(realWorkspacePolicy.output, /Checking SDD policy in:/);

    // The MCP App view renders the server-computed tone instead of re-deriving
    // it: its local copy checked task completion BEFORE approval, so a spec at
    // {Pendiente, 3/3} rendered a green "Hecha / Done" badge.
    assert.ok(appHtml.includes("spec.tone"), "the MCP App must read the tone from the payload");
    assert.doesNotMatch(
      appHtml,
      /function (isApproved|specKind)\b/,
      "the MCP App must not carry its own approval predicate"
    );

    // --- Teaching layer: the in-product help must stay true -----------------
    // This template is a school as much as a tool, so the help is a feature
    // with its own failure modes. Each guard below fails on a real regression:
    //   (a) a doc slug drifting -> every "full guide" link 404s for beginners;
    //   (b) an i18n key added in one language only -> the other language
    //       renders the raw key (the builder dicts had NO key check at all);
    //   (c) a help topic or guide typo -> the popover shows "help.foo.body";
    //   (d) the dashboard leaking two languages at once (spec 010 forbids it)
    //       or shipping a red gate band that explains nothing.

    // (a) One source of truth for the deep links. The builder cannot import
    //     sdd-core (standalone Vite app), so its mirror must match exactly and
    //     every slug must resolve to a guide that really exists in docs/.
    const builderHelpSrc = await fs.readFile(path.join(REPO_ROOT, "builder/src/help.ts"), "utf8");
    const mirroredGuides = Object.fromEntries(
      [...builderHelpSrc.matchAll(/(\w+):\s*\{\s*en:\s*"([^"]+)",\s*es:\s*"([^"]+)"\s*\}/g)].map(
        ([, guide, en, es]) => [guide, { en, es }]
      )
    );
    assert.deepEqual(
      mirroredGuides,
      DOC_GUIDES,
      "builder/src/help.ts must mirror sdd-core DOC_GUIDES exactly (one source of truth for the doc links)"
    );
    for (const [guide, byLang] of Object.entries(DOC_GUIDES)) {
      for (const [docLang, slug] of Object.entries(byLang)) {
        const guidePath = path.join(REPO_ROOT, "docs", docLang, `${slug}.md`);
        assert.ok(
          await fs.access(guidePath).then(
            () => true,
            () => false
          ),
          `the ${docLang} deep link for "${guide}" points at a guide that does not exist: docs/${docLang}/${slug}.md`
        );
      }
    }

    // (b) + (c) Builder dictionaries and every key the components ask for.
    const i18nSrc = await fs.readFile(path.join(REPO_ROOT, "builder/src/i18n.ts"), "utf8");
    const dictBlock = (marker) => {
      const start = i18nSrc.indexOf(marker);
      assert.notEqual(start, -1, `${marker} not found in builder/src/i18n.ts`);
      const end = i18nSrc.indexOf("\n};", start);
      assert.notEqual(end, -1, `unterminated dictionary after ${marker}`);
      return i18nSrc.slice(start, end);
    };
    const keysIn = (block) => [...block.matchAll(/^ {2}"([^"]+)":/gm)].map((match) => match[1]);
    const esKeys = keysIn(dictBlock("const es = {"));
    const enKeys = keysIn(dictBlock("const en: Record<keyof typeof es, string> = {"));
    assert.ok(esKeys.length > 200, `the builder ES dictionary looks truncated (${esKeys.length} keys)`);
    assert.deepEqual(
      [...esKeys].sort(),
      [...enKeys].sort(),
      "the builder ES and EN dictionaries must define exactly the same keys"
    );
    const esKeySet = new Set(esKeys);
    assert.ok(esKeySet.has("help.learnMore"), "the teaching layer needs its deep-link label");

    const builderSrcDir = path.join(REPO_ROOT, "builder/src");
    const walk = async (dir) => {
      const entries = await fs.readdir(dir, { withFileTypes: true });
      const files = [];
      for (const entry of entries) {
        const full = path.join(dir, entry.name);
        if (entry.isDirectory()) files.push(...(await walk(full)));
        else if (/\.tsx?$/.test(entry.name)) files.push(full);
      }
      return files;
    };
    for (const file of await walk(builderSrcDir)) {
      const source = await fs.readFile(file, "utf8");
      const where = path.relative(REPO_ROOT, file);
      for (const [, key] of source.matchAll(/\bt\("([^"]+)"/g)) {
        assert.ok(esKeySet.has(key), `${where} translates "${key}", which no dictionary defines`);
      }
      for (const [, topic] of source.matchAll(/\btopic="([^"]+)"/g)) {
        for (const suffix of ["title", "body"]) {
          assert.ok(
            esKeySet.has(`help.${topic}.${suffix}`),
            `${where} shows help topic "${topic}" but help.${topic}.${suffix} is not in the dictionary`
          );
        }
      }
      for (const [, guide] of [
        ...source.matchAll(/\bguide="([^"]+)"/g),
        ...source.matchAll(/\bdocsUrl\("([^"]+)"/g)
      ]) {
        assert.ok(guide in DOC_GUIDES, `${where} links to unknown guide "${guide}"`);
      }
    }

    // (d) The dashboard renders the same help, one language at a time.
    emptyRoot = String(
      asObject(
        await client.callTool({
          name: "sdd_create_workspace",
          arguments: {
            projectName: `mcp-empty-${Date.now()}`,
            assistant: "codex",
            profile: "recommended",
            useSpecKit: false
          }
        })
      ).projectRoot
    );

    for (const dashLang of ["es", "en"]) {
      const html = await renderDashboard(projectRoot, { lang: dashLang });
      const hints = html.match(/class="help-btn"/g) ?? [];
      assert.ok(
        hints.length >= 4,
        `the ${dashLang} dashboard must explain its concepts in place (found ${hints.length} help affordances)`
      );
      for (const guide of ["flow", "builder"]) {
        assert.ok(
          html.includes(docsUrl(guide, dashLang)),
          `the ${dashLang} dashboard help must deep-link to the ${guide} guide in the reader's language`
        );
      }
      const other = dashLang === "es" ? "en" : "es";
      assert.ok(
        !html.includes(docsUrl("flow", other)),
        `the ${dashLang} dashboard must not link the ${other} guide too — one language at a time (spec 010)`
      );
      assert.ok(
        !html.includes(dashLang === "es" ? "Full guide" : "Guía completa"),
        `the ${dashLang} dashboard leaked ${other} help copy`
      );
    }

    // A closed gate must teach: gateRoot lost its CLAUDE.md above, so it is red.
    const closedEs = await renderDashboard(gateRoot, { lang: "es" });
    const closedEn = await renderDashboard(gateRoot, { lang: "en" });
    assert.match(closedEs, /Gate cerrado/, "the gate guard workspace must render as closed");
    assert.ok(
      closedEs.includes("gate-missing") && closedEs.includes("regla de oro protegiendo"),
      "a closed gate must say it is the golden rule working and what is missing, not just glow red"
    );
    assert.match(
      closedEs,
      /error\(es\) de validación|spec\(s\) sin aprobar|mensajes del validador/,
      "the closed-gate explanation must list at least one concrete missing item"
    );
    assert.ok(
      closedEn.includes("golden rule protecting"),
      "the closed-gate teaching must exist in English too"
    );

    // An empty workspace must teach what "no specs" means, in both languages.
    const emptyEs = await renderDashboard(emptyRoot, { lang: "es" });
    const emptyEn = await renderDashboard(emptyRoot, { lang: "en" });
    assert.ok(
      emptyEs.includes("empty-learn") && emptyEs.includes("En SDD se empieza por la spec"),
      "an empty workspace must explain what that means and what to do next"
    );
    assert.ok(
      emptyEn.includes("you start with the spec") && emptyEn.includes(docsUrl("flow", "en")),
      "the empty state must teach and link the workflow guide in English too"
    );

    console.log("MCP integration test passed");
    console.log(`Project: ${projectName}`);
    console.log(`Spec: ${specId}`);
  } finally {
    for (const root of [projectRoot, guardRoot, gateRoot, emptyRoot, nonWorkspaceRoot]) {
      if (root) {
        await fs.rm(root, { recursive: true, force: true });
      }
    }
    await transport.close().catch(() => {});
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
