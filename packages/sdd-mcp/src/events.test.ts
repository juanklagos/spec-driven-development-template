// Spec 031, T3. The event hub must surface AI-queue changes to the builder:
// a request written to .sdd/requests/ becomes an SSE `change` event with
// kind "request" in under 2 seconds (R1/R3). Runs against a real hub, a real
// HTTP server, and the real fs watcher — no mocks, same spirit as the core
// request tests.

import { createAiRequest } from "@juanklagos/sdd-core";
import http from "node:http";
import fs from "node:fs/promises";
import os from "node:os";
import path from "node:path";
import { afterEach, beforeEach, expect, it } from "vitest";

import { createEventHub, type EventHub } from "./events.js";

let root: string;
let hub: EventHub;
let server: http.Server;
let port: number;

beforeEach(async () => {
  root = await fs.mkdtemp(path.join(os.tmpdir(), "sdd-events-test-"));
  await fs.writeFile(path.join(root, "sdd.policy.yaml"), "version: 1\n");
  for (const dir of ["idea", "specs", "bitacora"]) {
    await fs.mkdir(path.join(root, dir), { recursive: true });
  }
  hub = createEventHub(root);
  server = http.createServer((req, res) => hub.handleConnection(req, res));
  await new Promise<void>((resolve) => server.listen(0, "127.0.0.1", resolve));
  port = (server.address() as { port: number }).port;
});

afterEach(async () => {
  hub.dispose();
  await new Promise<void>((resolve) => server.close(() => resolve()));
  await fs.rm(root, { recursive: true, force: true });
});

it("broadcasts a change event of kind 'request' within 2s of a queue write", async () => {
  const events: Array<{ event: string; data: string }> = [];
  const req = http.get({ host: "127.0.0.1", port, path: "/api/events" });

  const requestEvent = new Promise<{ kind: string; path: string }>((resolve, reject) => {
    const timer = setTimeout(() => reject(new Error(`No request event in 2s. Seen: ${JSON.stringify(events)}`)), 2000);
    req.on("response", (res) => {
      let buffer = "";
      res.setEncoding("utf8");
      res.on("data", (chunk: string) => {
        buffer += chunk;
        let idx;
        while ((idx = buffer.indexOf("\n\n")) !== -1) {
          const frame = buffer.slice(0, idx);
          buffer = buffer.slice(idx + 2);
          const event = /^event: (.*)$/m.exec(frame)?.[1] ?? "";
          const data = /^data: (.*)$/m.exec(frame)?.[1] ?? "";
          events.push({ event, data });
          if (event === "hello") {
            // Watcher is starting; give fs.watch a beat before the write.
            setTimeout(() => {
              void createAiRequest(root, {
                type: "draft-field",
                target: { kind: "section", specId: "001-demo", ref: "requirements" },
                instruction: "amplía"
              });
            }, 200);
          }
          if (event === "change") {
            const parsed = JSON.parse(data) as { kind: string; path: string };
            // macOS fs.watch can surface a spurious event about the watched
            // directory itself; the queue write we care about is a .json file.
            if (parsed.kind === "request" && /\.json$/.test(parsed.path)) {
              clearTimeout(timer);
              resolve(parsed);
            }
          }
        }
      });
      res.on("error", reject);
    });
    req.on("error", reject);
  });

  const change = await requestEvent;
  expect(change.kind).toBe("request");
  expect(change.path).toMatch(/\.json$/);
  req.destroy();
}, 10_000);
