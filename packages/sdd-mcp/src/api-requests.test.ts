// Spec 031, T4. The REST mirror of the AI request queue, exercised over a
// real HTTP server + throwaway workspace: create, list (with agent presence),
// resolve, and body validation. The MCP side is exercised through the core in
// requests.test.ts; here we only prove the transport delegates correctly.

import { nextAiRequest, respondAiRequest } from "@juanklagos/sdd-core";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { createApiHandler } from "./api.js";

let root: string;
let server: http.Server;
let base: string;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-api-requests-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  for (const dir of ["idea", "specs", "bitacora"]) {
    await fs.mkdir(path.join(root, dir), { recursive: true });
  }
  const handler = createApiHandler({
    projectRoot: root,
    handleEvents: () => {
      throw new Error("SSE not under test here");
    }
  });
  server = http.createServer((req, res) => {
    void handler(req, res, new URL(req.url ?? "/", "http://localhost")).then((owned) => {
      if (!owned) {
        res.writeHead(404).end();
      }
    });
  });
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  const { port } = server.address() as { port: number };
  base = `http://127.0.0.1:${port}`;
});

afterEach(async () => {
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await fs.rm(root, { recursive: true, force: true });
});

async function post(route: string, body: unknown): Promise<Response> {
  return fetch(`${base}${route}`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify(body)
  });
}

const DRAFT_BODY = {
  type: "draft-field",
  target: { kind: "section", specId: "001-demo", ref: "requirements" },
  currentText: "- R1",
  instruction: "amplía los requisitos"
};

describe("POST /api/request (R1)", () => {
  it("creates a pending request and persists it under .sdd/requests/", async () => {
    const res = await post("/api/request", DRAFT_BODY);
    expect(res.status).toBe(201);
    const created = (await res.json()) as { id: string; status: string };
    expect(created.status).toBe("pending");
    const files = await fs.readdir(path.join(root, ".sdd", "requests"));
    expect(files).toContain(`${created.id}.json`);
  });

  it("rejects a body without instruction", async () => {
    const res = await post("/api/request", { type: "draft-field" });
    expect(res.status).toBe(400);
  });
});

describe("GET /api/requests (R6, R7)", () => {
  it("lists requests oldest-first and reports agent presence", async () => {
    await post("/api/request", { ...DRAFT_BODY, instruction: "uno" });
    await post("/api/request", { type: "structure-idea", instruction: "dos" });

    const before = (await (await fetch(`${base}/api/requests`)).json()) as {
      requests: Array<{ instruction: string }>;
      agent: null | { agent: string; lastSeenAt: string };
    };
    expect(before.requests.map((r) => r.instruction)).toEqual(["uno", "dos"]);
    expect(before.agent).toBeNull();

    await nextAiRequest(root, "claude-code");

    const after = (await (await fetch(`${base}/api/requests`)).json()) as {
      requests: Array<{ status: string }>;
      agent: null | { agent: string };
    };
    expect(after.agent?.agent).toBe("claude-code");
    expect(after.requests[0].status).toBe("in_progress");
  });
});

describe("POST /api/request/:id/resolve (R4, R8)", () => {
  it("accepts an answered request and cancels a pending one", async () => {
    const created = (await (await post("/api/request", DRAFT_BODY)).json()) as { id: string };
    await nextAiRequest(root, "claude-code");
    await respondAiRequest(root, created.id, "- R1\n- R2");

    const accepted = await post(`/api/request/${created.id}/resolve`, { resolution: "accepted" });
    expect(accepted.status).toBe(200);
    expect(((await accepted.json()) as { status: string }).status).toBe("accepted");

    const other = (await (await post("/api/request", DRAFT_BODY)).json()) as { id: string };
    const cancelled = await post(`/api/request/${other.id}/resolve`, { resolution: "cancelled" });
    expect(((await cancelled.json()) as { status: string }).status).toBe("cancelled");
  });

  it("rejects an unknown resolution and an illegal transition", async () => {
    const created = (await (await post("/api/request", DRAFT_BODY)).json()) as { id: string };
    expect((await post(`/api/request/${created.id}/resolve`, { resolution: "shipped" })).status).toBe(400);
    // pending -> accepted is illegal; the coded SDD error surfaces as 422
    expect((await post(`/api/request/${created.id}/resolve`, { resolution: "accepted" })).status).toBe(422);
  });
});
