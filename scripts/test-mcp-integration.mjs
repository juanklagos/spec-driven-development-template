import assert from "node:assert/strict";
import {
  APPROVED_STATUS_ERE,
  DOC_GUIDES,
  NEGATED_STATUS_ERE,
  extractApprovalStatus,
  extractFileScope,
  canvasEdgeColorForLabel,
  computeVerdict,
  classifyEdgeLabel,
  docsUrl,
  isApprovedStatus,
  specTone
} from "../packages/sdd-core/dist/index.js";
import { renderDashboard } from "../packages/sdd-mcp/dist/dashboard.js";
import { boardSpecCardSchema } from "../packages/sdd-mcp/dist/schemas.js";
import { execFile } from "node:child_process";
import { promises as fs } from "node:fs";
import os from "node:os";
import path from "node:path";
import { promisify } from "node:util";
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StdioClientTransport } from "@modelcontextprotocol/sdk/client/stdio.js";
import { validateEarsCriterion } from "../packages/sdd-core/dist/index.js";
import { GITHUB_ERROR_CODES, buildIssueBody, buildIssueTitle } from "../packages/sdd-mcp/dist/github.js";
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
  if (consent === "keep") {
    // Leave whatever the workspace already recorded — used by the per-spec
    // consent cases, where the point is that an EXISTING log does not cover
    // this spec.
    return;
  }
  if (consent === "recorded") {
    await fs.writeFile(consentLog, "[2026-03-18] gate guard consent\n", "utf8");
  } else if (consent === "empty") {
    await fs.writeFile(consentLog, "", "utf8");
  } else {
    await fs.rm(consentLog, { force: true });
  }
}

async function main() {
  // Static shape check, before anything else: it needs no workspace, and
  // running it first means a schema/type mismatch fails with this
  // explanation instead of an opaque SDK "-32602 must NOT have additional
  // properties" hundreds of lines later.
  // Twice now a field added to SpecSummary has broken the MCP board at
  // runtime, because BoardSpecCard spreads it and boardSpecCardSchema rejects
  // undeclared properties: `tone` in July, `fileScope` today. Both times the
  // failure surfaced as an opaque "must NOT have additional properties" from
  // the SDK, not as a type error. Assert the two shapes agree.
  {
    const specKeys = Object.keys({
      id: "",
      dir: "",
      status: "",
      fileScope: []
    });
    const cardKeys = Object.keys(boardSpecCardSchema.shape);
    const undeclared = specKeys.filter((key) => !cardKeys.includes(key));
    assert.deepEqual(
      undeclared,
      [],
      `SpecSummary field(s) ${undeclared.join(", ")} are spread into BoardSpecCard but missing from boardSpecCardSchema — the MCP board will fail at runtime, not at compile time`
    );
  }

  const projectName = `mcp-fixture-${Date.now()}`;
  let projectRoot = "";
  let guardRoot = "";
  let gateRoot = "";
  let emptyRoot = "";
  let nonWorkspaceRoot = "";
  let installRoot = "";

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

    // sdd_list_specs was a published tool with ZERO behavioural coverage: the
    // smoke test only checked that the NAME appears in tools/list, so its
    // handler could return anything. A freshly scaffolded spec must be listed
    // with the status the template actually writes (`Pendiente`).
    assert.deepEqual(
      asObject(await client.callTool({ name: "sdd_list_specs", arguments: { projectRoot } })).specs,
      [{ id: specId, dir: path.join(sddRoot, "specs", specId), status: "Pendiente", fileScope: [] }],
      "sdd_list_specs must report the freshly created spec as pending"
    );

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

    // (c2) CROSS-PROCESS allocation. (c) only covers callers inside this Node
    //      process, which `withFileLock` alone already serialized. Two
    //      `scripts/new-spec.sh` runs are a different race and the observed
    //      one: before scripts/lib/sdd-root.sh took an on-disk lock, two
    //      concurrent runs with different feature names both allocated 001 in
    //      5/5 trials, because `find | sort | tail -1` cannot see an
    //      in-flight allocation and `mkdir -p` never fails on EEXIST.
    const newSpecScript = path.join(REPO_ROOT, "scripts", "new-spec.sh");
    const runNewSpec = (cwd, featureName) =>
      execFileAsync("bash", [newSpecScript, featureName, "Race"], { cwd }).then(
        () => ({ code: 0 }),
        (error) => ({ code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` })
      );
    const raceSpecNumbers = async () =>
      (await fs.readdir(guardSpecsDir)).filter((name) => /^\d{3}-.*-race-\d+$/.test(name)).sort();

    const scriptRace = await Promise.all([
      runNewSpec(guardRoot, "script one race 1"),
      runNewSpec(guardRoot, "script two race 2")
    ]);
    for (const [index, result] of scriptRace.entries()) {
      assert.equal(result.code, 0, `concurrent new-spec.sh run ${index} failed: ${result.output ?? ""}`);
    }
    const scriptRaceIds = await raceSpecNumbers();
    assert.equal(scriptRaceIds.length, 2, `expected two script-created specs, got ${scriptRaceIds.join(", ")}`);
    assert.equal(
      new Set(scriptRaceIds.map((id) => id.slice(0, 3))).size,
      2,
      `two concurrent new-spec.sh runs must allocate DISTINCT numbers, got ${scriptRaceIds.join(", ")}`
    );

    // ...and the script racing the server, which is the path every UI surface
    // creates specs through. Both sides take <sdd-root>/specs/.lock.
    const [mixedScript, mixedServer] = await Promise.all([
      runNewSpec(guardRoot, "script three race 3"),
      client.callTool({
        name: "sdd_create_spec",
        arguments: { projectRoot: guardRoot, featureName: "Server race 4", owner: "Race" }
      })
    ]);
    assert.equal(mixedScript.code, 0, `new-spec.sh racing the server failed: ${mixedScript.output ?? ""}`);
    const serverRaceId = String(asObject(mixedServer).specId);
    const mixedScriptId = (await raceSpecNumbers()).find((id) => id.endsWith("-race-3"));
    assert.ok(mixedScriptId, "the racing new-spec.sh run must have created its bundle");
    assert.notEqual(
      mixedScriptId.slice(0, 3),
      serverRaceId.slice(0, 3),
      `new-spec.sh and sdd_create_spec must not share a number, got ${mixedScriptId} and ${serverRaceId}`
    );
    assert.ok(
      !(await fs.stat(path.join(guardSpecsDir, ".lock")).catch(() => null)),
      "the allocation lock must always be released, or the workspace is wedged for every later run"
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

    // Pinning the ERE constants byte-for-byte was not enough: the two
    // implementations agreed on the *rule* and disagreed on the *extraction*.
    // A greedy sed captured the LAST backtick pair, so a spec reading
    // `Pendiente` with a trailing `(target: `approved`)` note was approved in
    // bash and pending in TypeScript. Compare the extractions themselves.
    const STATUS_LINES = [
      "- Estado / Status: `Pendiente`",
      "- Estado / Status: `Aprobado`",
      "- Estado / Status: `Approved`",
      "- Estado / Status: `No aprobado`",
      "- Estado / Status: `Not approved`",
      "- Estado / Status: `unapproved`",
      // The line that broke it. Two backtick pairs, the second one a decoy.
      "- Estado / Status: `Pendiente` (target: `approved`)",
      "- Estado / Status: `Aprobado` (revisar `Pendiente` el 2026-08-01)",
      "- Estado / Status: `Pendiente` — ver `history.md`",
      // Whitespace and casing.
      "-   Estado / Status:   `Aprobado`   ",
      "- estado / status: `aprobado`",
      // Degenerate inputs: neither implementation may report approval.
      "- Estado / Status: Aprobado",
      "- Estado / Status: ``",
      "- Estado / Status:"
    ];

    for (const line of STATUS_LINES) {
      const { stdout } = await execFileAsync("bash", [
        "-c",
        '. "$1"/scripts/lib/sdd-root.sh; printf "%s" "$(sdd_extract_status_value "$2")"',
        "bash",
        REPO_ROOT,
        line
      ]);
      const fromBash = stdout;
      const fromTypeScript = extractApprovalStatus(line);

      if (fromBash === "") {
        // No backticked value. TypeScript falls back to the safe default, and
        // the safe default must never be an approving one.
        assert.equal(
          isApprovedStatus(fromTypeScript),
          false,
          `no status value in "${line}", so TypeScript must not fall back to an approving default (got "${fromTypeScript}")`
        );
        continue;
      }

      assert.equal(
        fromBash,
        fromTypeScript,
        `extraction drift on "${line}": bash read "${fromBash}", TypeScript read "${fromTypeScript}"`
      );
      assert.equal(
        isApprovedStatus(fromBash),
        isApprovedStatus(fromTypeScript),
        `approval verdict drift on "${line}"`
      );
    }

    // The specific regression, asserted on its own so a failure names itself.
    assert.equal(
      extractApprovalStatus("- Estado / Status: `Pendiente` (target: `approved`)"),
      "Pendiente",
      "a pending spec with a trailing target note must read as pending"
    );

    // The verdict's invariants. `ok` alone could not tell "you may implement"
    // apart from "nothing is approved, so there is nothing to implement", and
    // both painted green.
    for (const errors of [0, 1, 7]) {
      for (const approved of [0, 1, 12]) {
        const verdict = computeVerdict(errors, approved);
        assert.ok(
          ["open", "closed", "blocked"].includes(verdict),
          `computeVerdict(${errors}, ${approved}) must be one of the three states`
        );
        if (errors > 0) {
          assert.equal(
            verdict,
            "blocked",
            `errors must always win: computeVerdict(${errors}, ${approved}) returned "${verdict}"`
          );
        } else {
          assert.equal(
            verdict,
            approved > 0 ? "open" : "closed",
            `computeVerdict(0, ${approved}) must be "${approved > 0 ? "open" : "closed"}"`
          );
        }
      }
    }
    assert.equal(
      computeVerdict(0, 0),
      "closed",
      "a workspace with nothing approved must be closed, never open — this is the state the dashboard used to call 'implementation allowed'"
    );

    // File scope (spec 012, T3e/T3f). Parsed and surfaced; enforced by nothing.
    // Spec 014 consumes this, so the shape has to be right before the data
    // starts accruing — a format change later invalidates every spec written
    // in between.
    const SCOPE_CASES = [
      ["## Ámbito de archivos / File scope\n- `src/a.ts` — nota con `otra` cosa\n", ["src/a.ts"], "takes the first backticked token, prose after it is free"],
      ["## File scope\n- no backticks here\n- `src/b.ts`\n", ["src/b.ts"], "skips lines with no backticked token"],
      ["## Ámbito de archivos\n- `src/c.ts`\n## Otra sección\n- `src/no.ts`\n", ["src/c.ts"], "stops at the next heading"],
      ["## Ambito de archivos\n- `src/d.ts`\n", ["src/d.ts"], "matches the unaccented heading too"],
      ["## Requisitos\n- `src/e.ts`\n", [], "never reads paths from another section"],
      ["# Spec with no scope section\n\n## Requisitos\n- uno\n", [], "an absent section is an empty list, never an error"],
      ["## File scope\n- `  src/f.ts  `\n", ["src/f.ts"], "trims the token"]
    ];
    for (const [markdown, expected, why] of SCOPE_CASES) {
      assert.deepEqual(extractFileScope(markdown), expected, `extractFileScope ${why}`);
    }

    // Dogfooding: spec 012 introduces the section and uses it.
    const ownScope = extractFileScope(
      await fs.readFile(path.join(REPO_ROOT, "specs/012-gate-verdict/spec.md"), "utf8")
    );
    assert.ok(
      ownScope.includes("scripts/check-sdd-gate.sh"),
      "spec 012 must declare its own file scope — the section is worthless if the spec that adds it does not use it"
    );

    // And the template ships the heading, or no new spec ever gets one.
    const specTemplate = await fs.readFile(path.join(REPO_ROOT, "specs/_template/spec.md"), "utf8");
    assert.match(
      specTemplate,
      /^##\s+Ámbito de archivos \/ File scope$/m,
      "specs/_template/spec.md must ship the File scope heading"
    );


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
      assert.equal(
        healthy.verdict,
        "open",
        `an approved, consented "${status}" bundle must report verdict "open" (got "${healthy.verdict}")`
      );
      assert.equal(healthyBash.code, 0, `the bash gate must open for a healthy "${status}" bundle`);
      assert.match(
        healthyBash.output,
        /approved with checklist tasks/,
        `the bash gate must run the approval checks for "${status}"`
      );

      // Same statuses through sdd_list_specs, which is where every listing
      // surface reads them from. This pins the trim in extractApprovalStatus
      // (packages/sdd-core/src/workspace.ts): `Approved ` must reach callers
      // as `Approved`, or a spec renders green while comparisons against the
      // untrimmed value miss.
      const listedGate = asObject(
        await client.callTool({ name: "sdd_list_specs", arguments: { projectRoot: gateRoot } })
      ).specs;
      assert.deepEqual(
        listedGate.find((item) => item.id === gateSpecId),
        { id: gateSpecId, dir: path.join(gateSddRoot, "specs", gateSpecId), status: status.trim(), fileScope: [] },
        `sdd_list_specs must report "${status}" trimmed`
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

    // (e2) Consent is PER SPEC. Both gates used to test only "the log is not
    //      empty", so consenting once to 001 opened the gate for an unrelated
    //      002 approved later — verified 2026-07-21 on a sidecar fixture:
    //      "[OK] User consent log present", "0 error(s)", exit 0, for a spec
    //      nobody had ever been asked about.
    const gateConsentLog = path.join(gateSddRoot, ".sdd", "user-consent.log");
    await writeGateGuardSpec(gateSddRoot, gateSpecId, "Aprobada", { consent: "missing" });
    await fs.writeFile(
      gateConsentLog,
      `[2026-07-21 00:00:00 +0000] [spec:${gateSpecId}] User approved implementation for spec ${gateSpecId}\n`,
      "utf8"
    );
    assert.equal((await tsGate()).ok, true, "a per-spec consent entry must open the gate for that spec");
    assert.equal(
      (await runSddScript("check-sdd-gate.sh", gateRoot)).code,
      0,
      "the bash gate must agree that a per-spec consent entry opens the gate"
    );

    // A second spec, approved but never consented to, must CLOSE both gates
    // even though the log is non-empty and already covers the first one.
    const unrelatedSpecId = String(
      asObject(
        await client.callTool({
          name: "sdd_create_spec",
          arguments: { projectRoot: gateRoot, featureName: "Unrelated consent probe", owner: "Gate Guard" }
        })
      ).specId
    );
    await writeGateGuardSpec(gateSddRoot, unrelatedSpecId, "Aprobada", { consent: "keep" });
    const unconsented = await tsGate();
    assert.equal(unconsented.ok, false, "an approved spec with no consent of its own must close the gate");
    assert.ok(
      unconsented.messages.some(
        (message) => message.code === "missing-spec-consent" && message.message.includes(unrelatedSpecId)
      ),
      "the TS gate must name the spec that is missing consent"
    );
    const unconsentedBash = await runSddScript("check-sdd-gate.sh", gateRoot);
    assert.notEqual(unconsentedBash.code, 0, "the bash gate must close for a spec with no consent of its own");
    assert.ok(
      unconsentedBash.output.includes(`${unrelatedSpecId} approved but no user consent recorded for it`),
      `the bash gate must name the spec missing consent: ${unconsentedBash.output}`
    );

    // ...and recording it through the MCP tool (which passes no spec id, so the
    // id is recovered from the summary) reopens the gate. Both sides must
    // produce the same `[spec:<id>]` marker or bash and TS drift apart.
    await client.callTool({
      name: "sdd_record_user_consent",
      arguments: {
        projectRoot: gateRoot,
        summary: `User approved implementation for spec ${unrelatedSpecId}`
      }
    });
    assert.match(
      await fs.readFile(gateConsentLog, "utf8"),
      new RegExp(`\\[spec:${unrelatedSpecId}\\]`),
      "recordUserConsent must write a machine-parseable per-spec marker"
    );
    assert.equal((await tsGate()).ok, true, "recording the missing consent must reopen the TS gate");
    assert.equal(
      (await runSddScript("check-sdd-gate.sh", gateRoot)).code,
      0,
      "recording the missing consent must reopen the bash gate too"
    );

    // Migration, never a hard break: a log written before per-spec entries
    // existed still covers the workspace, as a WARNING with the exact command.
    await fs.writeFile(gateConsentLog, "[2026-01-01] Usuario aprobó implementar\n", "utf8");
    const legacyConsent = await tsGate();
    assert.equal(legacyConsent.ok, true, "a pre-existing free-text consent log must not suddenly fail hard");
    assert.ok(
      legacyConsent.messages.some((message) => message.code === "legacy-consent-log"),
      "a legacy consent log must warn and name the migration command"
    );
    const legacyBash = await runSddScript("check-sdd-gate.sh", gateRoot);
    assert.equal(legacyBash.code, 0, "the bash gate must also accept a legacy consent log");
    assert.match(
      legacyBash.output,
      /Legacy consent log covers these approved specs/,
      "the bash gate must print the same migration warning as the TS gate"
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

    // (g2) Same fail-open, other half: NO argument at all, from a cwd that has
    //      nothing to do with the framework. Verified 2026-07-21, `cd
    //      /tmp/empty && bash <template>/scripts/validate-sdd.sh` printed
    //      "Validating SDD structure in: <template>", walked all 11 framework
    //      specs and exited 0 — a green report about a workspace the caller is
    //      not in. The fallback is now taken only when $PWD is inside the tree
    //      that workspace governs.
    const runFrom = (cwd, script, ...args) =>
      execFileAsync("bash", [path.join(REPO_ROOT, "scripts", script), ...args], { cwd }).then(
        ({ stdout, stderr }) => ({ code: 0, output: `${stdout}${stderr}` }),
        (error) => ({ code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` })
      );
    for (const script of [
      "check-sdd-gate.sh",
      "check-sdd-policy.sh",
      "validate-sdd.sh",
      "confirm-user-consent.sh"
    ]) {
      const args = script === "confirm-user-consent.sh" ? ["should never be recorded"] : [];
      const strayRun = await runFrom(nonWorkspaceRoot, script, ...args);
      assert.notEqual(
        strayRun.code,
        0,
        `${script} with no argument, from an unrelated cwd, must fail instead of silently using the framework repo`
      );
      assert.match(strayRun.output, /not an SDD workspace/, `${script} must say why it refused`);
    }
    // ...while the two documented convenience forms keep working: no argument
    // from the framework root, and no argument from a sidecar PROJECT root
    // (where $PWD is the parent of the SDD root, not the SDD root itself).
    assert.equal(
      (await runFrom(REPO_ROOT, "check-sdd-gate.sh")).code,
      0,
      "./scripts/check-sdd-gate.sh from the framework root must still work"
    );
    assert.equal(
      (await runFrom(guardRoot, "check-sdd-policy.sh")).code,
      0,
      "./spec/scripts/check-sdd-policy.sh from a sidecar project root must still work"
    );

    // --- Installers must be re-runnable and must repair the gate -----------
    // QUICKSTART.md, both READMEs and docs/{en,es}/51-* all tell users to run
    // the sidecar installer; re-running it silently did nothing and exited 1,
    // because BSD `cp -n` (macOS) returns 1 when the destination exists and
    // `set -euo pipefail` killed the script at the FIRST already-present file.
    // Nothing after that line ran — including, on the standalone initializer,
    // the copy of scripts/lib/sdd-root.sh that every gate script sources.
    installRoot = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-installer-"));
    const sidecarProject = path.join(installRoot, "sidecar-project");
    await fs.mkdir(sidecarProject, { recursive: true });
    // A project that already has its own AI rules: the installer must not
    // overwrite them, and must SAY SO instead of only filing a note nothing reads.
    await fs.writeFile(path.join(sidecarProject, "CLAUDE.md"), "# My existing project rules\n", "utf8");

    const runInstaller = (script, target) =>
      execFileAsync("bash", [path.join(REPO_ROOT, "scripts", script), target]).then(
        ({ stdout, stderr }) => ({ code: 0, output: `${stdout}${stderr}` }),
        (error) => ({ code: error.code ?? 1, output: `${error.stdout ?? ""}${error.stderr ?? ""}` })
      );

    for (const [script, target] of [
      ["install-spec-sidecar.sh", sidecarProject],
      ["init-project.sh", path.join(installRoot, "standalone-project")]
    ]) {
      const first = await runInstaller(script, target);
      assert.equal(first.code, 0, `${script} must succeed on a fresh target: ${first.output}`);

      const sddRootOfTarget =
        script === "install-spec-sidecar.sh" ? path.join(target, "spec") : target;
      const installedGate = path.join(sddRootOfTarget, "scripts", "check-sdd-gate.sh");

      // A tampered gate is exactly what reinstalling has to repair: these files
      // are framework-owned, not user content.
      await fs.writeFile(installedGate, "exit 0  # TAMPERED\n", "utf8");
      const second = await runInstaller(script, target);
      assert.equal(second.code, 0, `${script} must be re-runnable, it exited ${second.code}: ${second.output}`);
      assert.ok(
        !(await fs.readFile(installedGate, "utf8")).includes("TAMPERED"),
        `${script} must restore a tampered ${path.basename(installedGate)} on reinstall`
      );
      assert.ok(
        await fs.stat(path.join(sddRootOfTarget, "scripts", "lib", "sdd-root.sh")).catch(() => null),
        `${script} must install scripts/lib/sdd-root.sh — every gate script sources it on line 5`
      );
      // The installed gate has to actually run in the project it was installed into.
      const installedGateRun = await runFrom(target, "check-sdd-gate.sh", target);
      assert.equal(
        installedGateRun.code,
        0,
        `the gate installed by ${script} must run in its own project: ${installedGateRun.output}`
      );
    }

    // The sidecar stamps what it was installed from, so a stale workspace can
    // say so. Nothing recorded this before.
    assert.match(
      await fs.readFile(path.join(sidecarProject, "spec", ".sdd", "TEMPLATE_VERSION"), "utf8"),
      new RegExp(`template_version=${packageJson.version.replace(/\./g, "\\.")}`),
      "the sidecar must stamp the template version it was installed from"
    );

    // The root AI-rule conflict must be PRINTED. Filing it in
    // spec/ROOT_AI_STUB_CONFLICTS.md and printing the normal success banner
    // meant an agent reading the project's own CLAUDE.md never learned ./spec/
    // exists — the exact failure this template exists to prevent.
    const conflictInstall = await runInstaller("install-spec-sidecar.sh", sidecarProject);
    assert.match(
      conflictInstall.output,
      /WARNING: these root AI rule files already existed and were NOT modified/,
      "the installer must warn out loud about untouched root AI rule files"
    );
    assert.match(conflictInstall.output, /CLAUDE\.md/, "the warning must name the files it skipped");
    assert.match(
      conflictInstall.output,
      /\.\/spec\/AGENTS\.md/,
      "the warning must carry the snippet the user has to paste"
    );
    assert.equal(
      await fs.readFile(path.join(sidecarProject, "CLAUDE.md"), "utf8"),
      "# My existing project rules\n",
      "the installer must still never overwrite the user's own root AI rules"
    );

    // The MCP App view renders the server-computed tone instead of re-deriving
    // it: its local copy checked task completion BEFORE approval, so a spec at
    // {Pendiente, 3/3} rendered a green "Hecha / Done" badge.
    assert.ok(appHtml.includes("spec.tone"), "the MCP App must read the tone from the payload");
    assert.doesNotMatch(
      appHtml,
      /function (isApproved|specKind)\b/,
      "the MCP App must not carry its own approval predicate"
    );

    // --- Duplicated rules: the "KEEP IN SYNC" contracts, verified -----------
    // The builder is a standalone Vite app and cannot import sdd-core, so
    // three rules exist twice, each with a comment asking the next editor to
    // keep both copies aligned. Comments are not tests: until this block,
    // nothing read builder/src/{ears,convert,sections}.ts, so any of the three
    // could drift silently. Same pattern as the check-sdd-gate.sh drift assert
    // above (the bash gate cannot import TypeScript either).
    //   - a diverged EARS regex => the builder warns on criteria the server
    //     accepts (or stays silent on ones it rejects);
    //   - a diverged edge-label set / canvas color => the same board renders
    //     one purpose in the UI and persists another to board.canvas;
    //   - a diverged status regex => "No aprobado" paints green in the builder
    //     while the gate correctly refuses to open.
    const readSrc = (relative) => fs.readFile(path.join(REPO_ROOT, relative), "utf8");
    const declaredLiterals = (source, names) =>
      Object.fromEntries(
        names.map((name) => [name, source.match(new RegExp(`^const ${name} = (.+);$`, "m"))?.[1]])
      );

    // (1) EARS lint regexes: builder/src/ears.ts vs the core copy.
    const earsNames = ["EARS_PATTERN_RE", "VAGUE_WORDS_RE", "HAS_NUMBER_RE"];
    const coreEars = declaredLiterals(await readSrc("packages/sdd-core/src/spec-actions.ts"), earsNames);
    const builderEars = declaredLiterals(await readSrc("builder/src/ears.ts"), earsNames);
    for (const name of earsNames) {
      assert.ok(coreEars[name], `packages/sdd-core/src/spec-actions.ts no longer declares ${name}`);
      assert.ok(builderEars[name], `builder/src/ears.ts no longer declares ${name}`);
    }
    assert.deepEqual(
      builderEars,
      coreEars,
      "builder/src/ears.ts must mirror the EARS regexes of packages/sdd-core/src/spec-actions.ts exactly"
    );
    // ...and the mirrored pattern must really behave like the core lint.
    const builderEarsPattern = new RegExp(builderEars.EARS_PATTERN_RE.replace(/^\/|\/i$/g, ""), "i");
    for (const criterion of [
      "CUANDO el usuario pulse pagar, EL SISTEMA DEBERÁ crear el pedido.",
      "WHEN the user clicks pay, THE SYSTEM SHALL create the order.",
      "El checkout debe funcionar bien"
    ]) {
      assert.equal(
        builderEarsPattern.test(criterion),
        validateEarsCriterion(criterion).matchesPattern,
        `the builder EARS pattern disagrees with sdd-core on: ${criterion}`
      );
    }

    // (2) Typed edges: builder/src/convert.ts vs packages/sdd-core/src/board.ts.
    const setItems = (source, name) => {
      const match = source.match(new RegExp(`^const ${name} = new Set\\(\\[([^\\]]*)\\]\\)`, "m"));
      assert.ok(match, `${name} not found as a Set literal`);
      return [...match[1].matchAll(/"([^"]*)"/g)].map((item) => item[1]).sort();
    };
    const colorMap = (source) => {
      const start = source.indexOf("const EDGE_KIND_CANVAS_COLOR");
      assert.notEqual(start, -1, "EDGE_KIND_CANVAS_COLOR not found");
      const block = source.slice(start, source.indexOf("\n};", start));
      return Object.fromEntries([...block.matchAll(/^\s{2}(\w+):\s*"([^"]+)"/gm)].map(([, k, v]) => [k, v]));
    };
    const coreBoardSrc = await readSrc("packages/sdd-core/src/board.ts");
    const builderConvertSrc = await readSrc("builder/src/convert.ts");
    for (const name of ["DEPENDS_EDGE_LABELS", "BLOCKS_EDGE_LABELS", "CONTAINS_EDGE_LABELS"]) {
      assert.deepEqual(
        setItems(builderConvertSrc, name),
        setItems(coreBoardSrc, name),
        `builder/src/convert.ts must mirror ${name} from packages/sdd-core/src/board.ts`
      );
    }
    assert.deepEqual(
      colorMap(builderConvertSrc),
      colorMap(coreBoardSrc),
      "builder/src/convert.ts must persist the same JSON Canvas colors as canvasEdgeColorForLabel"
    );
    // ...and each mirrored label must classify the same way in the core.
    for (const [name, kind] of [
      ["DEPENDS_EDGE_LABELS", "depends"],
      ["BLOCKS_EDGE_LABELS", "blocks"],
      ["CONTAINS_EDGE_LABELS", "contains"]
    ]) {
      for (const label of setItems(builderConvertSrc, name)) {
        assert.equal(classifyEdgeLabel(label), kind, `sdd-core does not classify "${label}" as ${kind}`);
        assert.equal(
          canvasEdgeColorForLabel(label),
          colorMap(builderConvertSrc)[kind],
          `the builder canvas color for "${label}" differs from sdd-core`
        );
      }
    }
    assert.equal(classifyEdgeLabel("cualquier otra cosa"), "related", "unknown labels stay related");

    // (3) Approval status: builder/src/sections.ts vs the exported EREs.
    const builderSectionsSrc = await readSrc("builder/src/sections.ts");
    const sectionsStart = builderSectionsSrc.indexOf("export const isApprovedStatusText");
    assert.notEqual(sectionsStart, -1, "builder/src/sections.ts no longer exports isApprovedStatusText");
    const sectionsBlock = builderSectionsSrc.slice(
      sectionsStart,
      builderSectionsSrc.indexOf("\n};", sectionsStart)
    );
    assert.deepEqual(
      [...sectionsBlock.matchAll(/\/((?:[^/\\\n]|\\.)+)\/i\.test\(value\)/g)].map((match) => match[1]),
      [new RegExp(NEGATED_STATUS_ERE).source, new RegExp(APPROVED_STATUS_ERE).source],
      "builder/src/sections.ts must mirror NEGATED_STATUS_ERE then APPROVED_STATUS_ERE (negation wins)"
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

    // (b2) Server error codes are a contract between github.ts and the builder
    //      dictionary. Spec 010, R1 forbids double labels "incl. tour, toasts,
    //      errores", but POST /api/spec/:id/issues used to answer with the raw
    //      bilingual message ("Este workspace no es un repositorio git / This
    //      workspace is not a git repository — ejecuta / run: git init …") and
    //      SpecDrawer printed it verbatim. Now the server sends a code and the
    //      UI renders one language — which only works while EVERY code the
    //      server can emit has an entry (the es/en parity assert above then
    //      guarantees both languages).
    for (const code of GITHUB_ERROR_CODES) {
      assert.ok(
        esKeySet.has(`error.code.${code}`),
        `github.ts can emit ${code} but builder/src/i18n.ts has no error.code.${code} entry — the UI would print the raw bilingual fallback`
      );
    }

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

    // gateRoot lost its CLAUDE.md above, so it has errors — that is BLOCKED, not
    // merely closed. The two used to be the same red state, which is exactly the
    // conflation spec 012 removes: "nothing approved yet" is not a failure, and
    // painting it red taught users to ignore the colour.
    const closedEs = await renderDashboard(gateRoot, { lang: "es" });
    const closedEn = await renderDashboard(gateRoot, { lang: "en" });
    assert.match(closedEs, /Gate bloqueado/, "a workspace with errors must render as blocked, not closed");
    assert.doesNotMatch(
      closedEs,
      /Implementación permitida/,
      "a blocked workspace must never say implementation is allowed"
    );

    // The state that used to lie: no errors at all, but nothing approved either.
    // `ok` was true, so the dashboard said "Implementación permitida" to a user
    // who had approved nothing.
    const nothingApprovedEs = await renderDashboard(emptyRoot, { lang: "es" });
    const nothingApprovedEn = await renderDashboard(emptyRoot, { lang: "en" });
    assert.doesNotMatch(
      nothingApprovedEs,
      /Implementación permitida/,
      "a workspace with zero approved specs must not claim implementation is allowed"
    );
    assert.doesNotMatch(
      nothingApprovedEn,
      /Implementation allowed/,
      "the same, in English"
    );

    // The posture line prints on every dashboard, in both languages, and says
    // what was NOT checked. A green chip must never mean "we did not look".
    for (const [html, needle, lang] of [
      [nothingApprovedEs, "NO comprobado", "es"],
      [nothingApprovedEn, "NOT checked", "en"]
    ]) {
      assert.ok(
        html.includes("gate-posture") && html.includes(needle),
        `the ${lang} dashboard must state what the gate did not check`
      );
    }
    assert.ok(
      closedEs.includes("gate-missing") && closedEs.includes("regla de oro haciendo su trabajo"),
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

    // --- Regression guard (audit I7): one spec template, and it must work ----
    // A second, divergent spec body template used to ship at
    // templates/spec/spec.template.md. Copying it as specs/NNN/spec.md broke
    // three things at once: approveSpec threw ("has no Estado de aprobación /
    // Approval status section"), checkGate reported missing-status-section, and
    // updateSpecSections appended a duplicate "## Requisitos" at the end instead
    // of filling the existing heading (its "## Functional requirements" title
    // matched no alias). It was deleted rather than maintained as a second copy
    // of the spec schema. This assert keeps it deleted and keeps the surviving
    // template honest.
    const specBodyTemplates = [];
    const templateScanDirs = [path.join(REPO_ROOT, "specs/_template"), path.join(REPO_ROOT, "templates/spec")];
    for (const dir of templateScanDirs) {
      const entries = await fs.readdir(dir).catch(() => []);
      for (const name of entries) {
        if (/^spec(\.template)?\.md$/.test(name)) specBodyTemplates.push(path.join(dir, name));
      }
    }
    assert.deepEqual(
      specBodyTemplates.map((file) => path.relative(REPO_ROOT, file)),
      ["specs/_template/spec.md"],
      "there must be exactly ONE spec body template in the repo — a second copy is a second spec schema, and the divergent templates/spec/spec.template.md broke approveSpec, checkGate and updateSpecSections"
    );

    // The surviving template must satisfy every rule the server enforces on a
    // real spec.md, so `cp` from it can never produce an unapprovable spec.
    const canonicalTemplate = await fs.readFile(specBodyTemplates[0], "utf8");
    assert.match(
      canonicalTemplate,
      /^##\s+Estado de aprobaci[óo]n\s*\/\s*Approval status/mi,
      "specs/_template/spec.md must carry the approval block, or approveSpec throws and checkGate reports missing-status-section"
    );
    for (const alias of [
      /^##\s+(historia de usuario|user stor)/mi,
      /^##\s+(escenarios de aceptaci|acceptance scenarios)/mi,
      /^##\s+(criterios de aceptaci|acceptance criteria)/mi,
      /^##\s+(requisitos|requirements)/mi,
      /^##\s+(propiedades de la spec|spec propert)/mi,
      /^##\s+(criterios de [ée]xito|success criteria)/mi
    ]) {
      assert.match(
        canonicalTemplate,
        alias,
        `specs/_template/spec.md is missing a heading updateSpecSections knows (${alias}) — the tool would append a duplicate section instead of filling it`
      );
    }
    // "Fuera de alcance / Out of scope" is deliberately NOT in the template:
    // updateSpecSections appends it with its canonical bilingual heading and
    // reports it in `created`. Asserted here so the omission stays a decision.
    assert.doesNotMatch(
      canonicalTemplate,
      /^##\s+(fuera de alcance|out of scope)/mi,
      "if specs/_template/spec.md gains an out-of-scope heading, update this guard and docs/*/41 (the section would move from `created` to `updated`)"
    );

    console.log("MCP integration test passed");
    console.log(`Project: ${projectName}`);
    console.log(`Spec: ${specId}`);
  } finally {
    for (const root of [projectRoot, guardRoot, gateRoot, emptyRoot, nonWorkspaceRoot, installRoot]) {
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
