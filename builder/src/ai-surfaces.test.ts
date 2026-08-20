// Spec 031, T11c (R4b). The AI assist mounts are a CONTRACT, pinned in both
// directions like the MCP tool list in smoke-test-mcp.mjs:
//   - every content surface (7 spec.md sections, tasks, notes, bitácora
//     drafts) mounts AiAssistButton with its declared kind;
//   - approval and consent forms mount NOTHING — they are the human signature
//     of the gate, and a new mount anywhere fails this test until declared.
// Source-level on purpose: the rule is about which components ship the
// button, not about runtime behaviour (the queue tests cover that).

import fs from "node:fs";
import path from "node:path";
import { describe, expect, it } from "vitest";

const COMPONENTS = path.join(__dirname, "components");

function read(name: string): string {
  return fs.readFileSync(path.join(COMPONENTS, name), "utf8");
}

/** Every `kind="..."` prop of AiAssistButton mounts in one file. */
function mountedKinds(source: string): string[] {
  return [...source.matchAll(/<AiAssistButton[\s\S]*?kind="([a-z]+)"/g)].map((m) => m[1]);
}

describe("AI assist mounts (R4b contract)", () => {
  it("SectionEditor mounts kind 'section' on all 7 template sections", () => {
    const source = read("SectionEditor.tsx");
    expect(mountedKinds(source)).toEqual(["section", "section"]); // aiText + aiList helpers
    // The two helpers must be applied to every section of the template.
    for (const refId of [
      "story",
      "scenarios",
      "criteria",
      "requirements",
      "properties",
      "successCriteria",
      "outOfScope"
    ]) {
      expect(source).toMatch(new RegExp(`ai(?:Text|List)\\("${refId}"`));
    }
  });

  it("SpecDrawer mounts kind 'task' only — never in the approval/consent panel", () => {
    const source = read("SpecDrawer.tsx");
    expect(mountedKinds(source)).toEqual(["task"]);
    // The approval panel (ApprovalPanel component, up to the next top-level
    // function) must stay AI-free: approver, evidence and consent are human
    // input by design.
    const approval = source.slice(source.indexOf("function ApprovalPanel"));
    const approvalBlock = approval.slice(0, approval.indexOf("\nfunction ", 1));
    expect(approvalBlock).toContain("consent"); // sanity: we sliced the right block
    expect(approvalBlock).not.toContain("AiAssistButton");
  });

  it("NoteNode and BitacoraModal mount their kinds", () => {
    expect(mountedKinds(read("NoteNode.tsx"))).toEqual(["note"]);
    expect(mountedKinds(read("BitacoraModal.tsx"))).toEqual(["bitacora"]);
  });

  // Spec 036, T10 (R11). El panel de revisión entra en el contrato: existe,
  // ancla a las 7 secciones y NO monta el botón — su única salida accionable
  // es devolver el foco al «Ampliar con IA» de la sección, que ya pasa por el
  // diff. La frontera de aprobación/consentimiento no se mueve.
  it("ReviewPanel is declared, and mounts no AI button of its own", () => {
    const source = read("ReviewPanel.tsx");
    expect(mountedKinds(source)).toEqual([]);
    expect(source).toContain("onFix");
  });

  it("no other component mounts the button", () => {
    const withButton = fs
      .readdirSync(COMPONENTS)
      .filter((name) => name.endsWith(".tsx"))
      .filter((name) => name !== "AiAssistButton.tsx" && read(name).includes("<AiAssistButton"));
    // ReviewPanel.tsx NO está en esta lista, y ese es el punto (spec 036).
    expect(withButton.sort()).toEqual(["BitacoraModal.tsx", "NoteNode.tsx", "SectionEditor.tsx", "SpecDrawer.tsx"]);
  });
});
