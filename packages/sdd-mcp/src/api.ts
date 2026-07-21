// REST API for the SDD Builder frontend. Every route delegates to the shared
// board layer in @juanklagos/sdd-core — the same functions the MCP board
// tools use (see server.ts) — so no board logic lives in the transport.

import http from "node:http";
import {
  approveSpec,
  createSpec,
  getBoardView,
  getGateSummary,
  parseTasksMarkdown,
  readSpecDocument,
  setSpecTaskDone,
  updateSpecSections,
  writeBoard,
  type SpecSectionsInput
} from "@juanklagos/sdd-core";
import { createIssuesForSpec } from "./github.js";
import { isPayloadTooLarge, json, payloadTooLargeResponse, readBody } from "./http-utils.js";

export interface ApiDeps {
  projectRoot: string;
  /** SSE endpoint handler (GET /api/events), provided by the event hub. */
  handleEvents(req: http.IncomingMessage, res: http.ServerResponse): void;
}

export type ApiHandler = (req: http.IncomingMessage, res: http.ServerResponse, url: URL) => Promise<boolean>;

/** Returns a handler that resolves to true when it owned the route. */
export function createApiHandler({ projectRoot, handleEvents }: ApiDeps): ApiHandler {
  return async function handleApi(req, res, url) {
    const route = url.pathname;
    try {
      if (req.method === "GET" && route === "/api/events") {
        handleEvents(req, res);
        return true;
      }
      if (req.method === "GET" && route === "/api/board") {
        const view = await getBoardView(projectRoot);
        json(res, 200, { projectRoot, ...view });
        return true;
      }
      if (req.method === "PUT" && route === "/api/board") {
        await writeBoard(projectRoot, (await readBody(req)) as never);
        json(res, 200, { ok: true });
        return true;
      }
      if (req.method === "GET" && route === "/api/gate") {
        json(res, 200, await getGateSummary(projectRoot));
        return true;
      }
      const approveMatch = route.match(/^\/api\/spec\/([^/]+)\/approve$/);
      if (req.method === "POST" && approveMatch) {
        const body = (await readBody(req)) as { approver?: string; evidence?: string };
        if (typeof body?.approver !== "string" || !body.approver.trim()) {
          json(res, 400, { error: "Expected { approver: string, evidence?: string }" });
          return true;
        }
        // Optional evidence overrides the line in spec.md (spec 010, R2).
        const evidence = typeof body.evidence === "string" ? body.evidence : undefined;
        json(res, 200, await approveSpec(projectRoot, approveMatch[1], body.approver, evidence));
        return true;
      }
      const sectionsMatch = route.match(/^\/api\/spec\/([^/]+)\/sections$/);
      if (req.method === "PUT" && sectionsMatch) {
        const body = (await readBody(req)) as SpecSectionsInput | undefined;
        if (typeof body !== "object" || body === null) {
          json(res, 400, {
            error:
              "Expected { story?, scenarios?, criteria?, requirements?, properties?, successCriteria?, outOfScope? }"
          });
          return true;
        }
        json(res, 200, await updateSpecSections(projectRoot, sectionsMatch[1], body));
        return true;
      }
      const issuesMatch = route.match(/^\/api\/spec\/([^/]+)\/issues$/);
      if (req.method === "POST" && issuesMatch) {
        // Tasks -> GitHub issues (spec 009, R3). Preconditions (git repo with
        // remote, gh installed + authenticated) fail with bilingual errors
        // that the catch below returns as-is for the UI to show.
        json(res, 200, await createIssuesForSpec(projectRoot, issuesMatch[1]));
        return true;
      }
      const specMatch = route.match(/^\/api\/spec\/([^/]+)$/);
      if (req.method === "GET" && specMatch) {
        const id = specMatch[1];
        const [spec, plan, tasks] = await Promise.all([
          readSpecDocument(projectRoot, id, "spec.md"),
          readSpecDocument(projectRoot, id, "plan.md"),
          readSpecDocument(projectRoot, id, "tasks.md")
        ]);
        json(res, 200, { id, docs: { spec, plan, tasks }, tasks: parseTasksMarkdown(tasks) });
        return true;
      }
      const taskMatch = route.match(/^\/api\/spec\/([^/]+)\/tasks$/);
      if (req.method === "PUT" && taskMatch) {
        const id = taskMatch[1];
        const body = (await readBody(req)) as { line?: number; done?: boolean };
        if (typeof body?.line !== "number" || typeof body?.done !== "boolean") {
          json(res, 400, { error: "Expected { line: number, done: boolean }" });
          return true;
        }
        json(res, 200, { tasks: await setSpecTaskDone(projectRoot, id, body.line, body.done) });
        return true;
      }
      if (req.method === "POST" && route === "/api/spec") {
        const body = (await readBody(req)) as { name?: string; owner?: string };
        if (!body?.name) {
          json(res, 400, { error: "Expected { name: string, owner?: string }" });
          return true;
        }
        const result = await createSpec({ projectRoot, featureName: body.name, owner: body.owner ?? "Owner" });
        json(res, 201, result);
        return true;
      }
    } catch (error) {
      // An over-cap body is a client error about size, not an SDD rule failure.
      if (isPayloadTooLarge(error)) {
        const { status, body } = payloadTooLargeResponse(error);
        json(res, status, body);
        return true;
      }
      json(res, 422, { error: error instanceof Error ? error.message : String(error) });
      return true;
    }
    return false;
  };
}
