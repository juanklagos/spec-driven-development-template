// Spec 031, T1. The AI request queue against a throwaway workspace, on the
// real read/write path (same style as task-ops.test.ts). The load-bearing
// property: nothing under specs/ changes until a request is accepted — and
// acceptance itself is NOT this module's job, so the module must never touch
// specs/ at all.

import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import {
  createAiRequest,
  getAgentPresence,
  listAiRequests,
  nextAiRequest,
  respondAiRequest,
  resolveAiRequest
} from "./requests.js";

let root: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-requests-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  await fs.mkdir(path.join(root, "idea"), { recursive: true });
  await fs.mkdir(path.join(root, "specs/001-demo"), { recursive: true });
  await fs.mkdir(path.join(root, "bitacora"), { recursive: true });
  await fs.writeFile(path.join(root, "specs/001-demo/spec.md"), "# Spec\n\n## Requisitos\n\n- R1\n");
});

afterEach(async () => {
  await fs.rm(root, { recursive: true, force: true });
});

/** Snapshot of every file under specs/ (path -> content) to prove no writes. */
async function specsSnapshot(): Promise<Map<string, string>> {
  const out = new Map<string, string>();
  async function walk(dir: string): Promise<void> {
    for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
      const full = path.join(dir, entry.name);
      if (entry.isDirectory()) await walk(full);
      else out.set(full, await fs.readFile(full, "utf8"));
    }
  }
  await walk(path.join(root, "specs"));
  return out;
}

const DRAFT_INPUT = {
  type: "draft-field" as const,
  target: { kind: "section" as const, specId: "001-demo", ref: "requirements" },
  currentText: "- R1",
  instruction: "amplía los requisitos"
};

describe("createAiRequest (R1)", () => {
  it("persists a pending request as human-readable JSON under .sdd/requests/", async () => {
    const created = await createAiRequest(root, DRAFT_INPUT);
    expect(created.status).toBe("pending");
    expect(created.id).toBeTruthy();
    const file = path.join(root, ".sdd", "requests", `${created.id}.json`);
    const raw = await fs.readFile(file, "utf8");
    expect(raw).toContain("\n"); // pretty-printed, not a single line
    const parsed = JSON.parse(raw);
    expect(parsed).toMatchObject({
      type: "draft-field",
      instruction: "amplía los requisitos",
      target: { kind: "section", specId: "001-demo", ref: "requirements" },
      currentText: "- R1",
      status: "pending"
    });
    expect(parsed.createdAt).toBeTruthy();
  });

  it("gives every request a unique, monotonically ordered id in the same millisecond", async () => {
    // Regression: ids were `Date.now()-<random>`, so two requests created in
    // the same millisecond tied on the prefix and FIFO order fell through to
    // the random suffix. 50 in a row makes a same-ms collision certain.
    const ids: string[] = [];
    for (let i = 0; i < 50; i++) ids.push((await createAiRequest(root, DRAFT_INPUT)).id);
    expect(new Set(ids).size).toBe(50);
    expect([...ids].sort()).toEqual(ids);
  });

  it("rejects an empty instruction and a draft-field without target", async () => {
    await expect(createAiRequest(root, { ...DRAFT_INPUT, instruction: "  " })).rejects.toThrow(/instruction/i);
    await expect(
      createAiRequest(root, { type: "draft-field", instruction: "x" })
    ).rejects.toThrow(/target/i);
  });
});

describe("nextAiRequest (R2, R6)", () => {
  it("returns the oldest pending request and marks it in_progress with the agent", async () => {
    const first = await createAiRequest(root, { ...DRAFT_INPUT, instruction: "primera" });
    await createAiRequest(root, { ...DRAFT_INPUT, instruction: "segunda" });

    const claimed = await nextAiRequest(root, "claude-code");
    expect(claimed?.id).toBe(first.id);
    expect(claimed?.status).toBe("in_progress");
    expect(claimed?.agent).toBe("claude-code");
    expect(claimed?.currentText).toBe("- R1");

    const second = await nextAiRequest(root, "claude-code");
    expect(second?.instruction).toBe("segunda");
  });

  it("returns null explicitly when the queue is empty, and still records presence", async () => {
    expect(await getAgentPresence(root)).toBeNull();
    expect(await nextAiRequest(root, "claude-code")).toBeNull();
    const presence = await getAgentPresence(root);
    expect(presence?.agent).toBe("claude-code");
    expect(presence?.lastSeenAt).toBeTruthy();
  });

  it("never returns a cancelled request (R8)", async () => {
    const req = await createAiRequest(root, DRAFT_INPUT);
    await resolveAiRequest(root, req.id, "cancelled");
    expect(await nextAiRequest(root, "claude-code")).toBeNull();
  });
});

describe("respondAiRequest (R3)", () => {
  it("stores the proposal, sets answered, and modifies nothing under specs/", async () => {
    const req = await createAiRequest(root, DRAFT_INPUT);
    await nextAiRequest(root, "claude-code");
    const before = await specsSnapshot();

    const answered = await respondAiRequest(root, req.id, "- R1\n- R2 nuevo");
    expect(answered.status).toBe("answered");
    expect(answered.proposal).toBe("- R1\n- R2 nuevo");

    expect(await specsSnapshot()).toEqual(before);
  });

  it("fails clearly on a cancelled request (race: user cancelled mid-flight)", async () => {
    const req = await createAiRequest(root, DRAFT_INPUT);
    await nextAiRequest(root, "claude-code");
    await resolveAiRequest(root, req.id, "cancelled");
    await expect(respondAiRequest(root, req.id, "propuesta")).rejects.toThrow(/cancelled/);
  });
});

describe("lifecycle transitions (spec properties)", () => {
  it("only allows the declared transitions", async () => {
    const req = await createAiRequest(root, DRAFT_INPUT);
    // pending: cannot be answered or accepted directly
    await expect(respondAiRequest(root, req.id, "x")).rejects.toThrow(/pending/);
    await expect(resolveAiRequest(root, req.id, "accepted")).rejects.toThrow();

    await nextAiRequest(root, "claude-code");
    // in_progress: cannot be accepted before an answer exists
    await expect(resolveAiRequest(root, req.id, "accepted")).rejects.toThrow();

    await respondAiRequest(root, req.id, "propuesta");
    const accepted = await resolveAiRequest(root, req.id, "accepted");
    expect(accepted.status).toBe("accepted");

    // terminal: no way back
    await expect(resolveAiRequest(root, req.id, "cancelled")).rejects.toThrow();
  });

  it("supports reject from answered and cancel from pending or in_progress", async () => {
    const a = await createAiRequest(root, DRAFT_INPUT);
    await nextAiRequest(root, "claude-code");
    await respondAiRequest(root, a.id, "propuesta");
    expect((await resolveAiRequest(root, a.id, "rejected")).status).toBe("rejected");

    const b = await createAiRequest(root, DRAFT_INPUT);
    expect((await resolveAiRequest(root, b.id, "cancelled")).status).toBe("cancelled");

    const c = await createAiRequest(root, DRAFT_INPUT);
    await nextAiRequest(root, "claude-code");
    expect((await resolveAiRequest(root, c.id, "cancelled")).status).toBe("cancelled");
  });
});

describe("listAiRequests", () => {
  it("lists chronologically and includes every status", async () => {
    const a = await createAiRequest(root, { ...DRAFT_INPUT, instruction: "uno" });
    const b = await createAiRequest(root, { type: "structure-idea", instruction: "dos" });
    await nextAiRequest(root, "claude-code");

    const listed = await listAiRequests(root);
    expect(listed.map((r) => r.id)).toEqual([a.id, b.id]);
    expect(listed[0].status).toBe("in_progress");
    expect(listed[1].status).toBe("pending");
  });

  it("returns empty on a fresh workspace instead of throwing", async () => {
    expect(await listAiRequests(root)).toEqual([]);
  });
});

// --- Spec 036, T6 (R5) ------------------------------------------------------
// Una revisión es una petición más. Si necesitara su propio camino por la cola,
// el tipo no estaría bien elegido.
describe("review-spec requests (spec 036, R5)", () => {
  const REVIEW_INPUT = {
    type: "review-spec" as const,
    target: { kind: "spec" as const, specId: "001-demo", ref: "001-demo" },
    instruction: "Revisa esta spec y devuelve hallazgos por seccion."
  };

  it("travels the same lifecycle as any other request", async () => {
    const before = await specsSnapshot();

    const created = await createAiRequest(root, REVIEW_INPUT);
    expect(created.type).toBe("review-spec");
    expect(created.status).toBe("pending");
    expect(created.target).toEqual(REVIEW_INPUT.target);

    const claimed = await nextAiRequest(root, "cualquier-ia");
    expect(claimed?.id).toBe(created.id);
    expect(claimed?.status).toBe("in_progress");

    const answered = await respondAiRequest(root, created.id, '{"findings":[]}');
    expect(answered.status).toBe("answered");
    expect(answered.proposal).toBe('{"findings":[]}');

    const resolved = await resolveAiRequest(root, created.id, "accepted");
    expect(resolved.status).toBe("accepted");

    // R10: la revisión no escribe en specs/ por su cuenta, en ningun paso.
    expect(await specsSnapshot()).toEqual(before);
  });

  it("needs a target that says which spec is under review", async () => {
    await expect(
      createAiRequest(root, { type: "review-spec", instruction: "revisa algo" })
    ).rejects.toThrow(/target/i);
  });

  it("shows up in the list like the rest", async () => {
    await createAiRequest(root, REVIEW_INPUT);
    const all = await listAiRequests(root);
    expect(all.map((r) => r.type)).toContain("review-spec");
  });
});

