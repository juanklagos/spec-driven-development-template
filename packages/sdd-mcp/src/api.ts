// REST API for the SDD Builder frontend. Every route delegates to the shared
// board layer in @juanklagos/sdd-core — the same functions the MCP board
// tools use (see server.ts) — so no board logic lives in the transport.

import http from "node:http";
import packageJson from "../package.json" with { type: "json" };
import {
  addSpecTask,
  appendProjectLogEntry,
  approveSpec,
  compareSidecar,
  createAiRequest,
  createSpec,
  generateRoadmap,
  generateStatus,
  getAgentPresence,
  getBoardView,
  getGateSummary,
  listAiRequests,
  listBitacoraFiles,
  manualInstructions,
  parseTasksMarkdown,
  readBitacoraFile,
  readSpecDocument,
  recordUserConsent,
  resetBoard,
  resolveAiRequest,
  resolveSddRoot,
  scoreSpec,
  setSpecTaskDone,
  updateSpecSections,
  writeBoard,
  writeDailyLog,
  writeDecision,
  writeHandoff,
  type AiRequestResolution,
  type BitacoraKind,
  type CreateAiRequestInput,
  type SpecSectionsInput
} from "@juanklagos/sdd-core";
import { createIssuesForSpec, isGithubPreconditionError } from "./github.js";
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
      // Spec 042, escenario 1: la segunda salida del aviso de tablero ilegible.
      // Es una escritura, así que sólo ocurre cuando la persona la pide.
      if (req.method === "POST" && route === "/api/board/reset") {
        const canvas = await resetBoard(projectRoot);
        json(res, 200, { canvas });
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
      // Consent, per spec. There was no route at all: the builder could approve
      // a spec and then had no way to record consent, so the gate stayed closed
      // and the only repair was a terminal — a dead end for exactly the
      // audience the canvas exists for.
      //
      // Never inferred and never automatic: the spec id comes from the URL and
      // the summary from the caller, because approval and consent are two
      // separate decisions on purpose.
      const consentMatch = route.match(/^\/api\/spec\/([^/]+)\/consent$/);
      if (req.method === "POST" && consentMatch) {
        const body = (await readBody(req)) as { summary?: string };
        if (typeof body?.summary !== "string" || !body.summary.trim()) {
          json(res, 400, { error: "Expected { summary: string }" });
          return true;
        }
        json(res, 200, await recordUserConsent(projectRoot, body.summary.trim(), consentMatch[1]));
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
        // remote, gh installed + authenticated) fail with a machine code that
        // the catch below forwards; the UI renders it in ONE language.
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
      // Spec 028: the write half of task management on the canvas — until now
      // the REST could only toggle boxes, so adding a task meant leaving the
      // builder for a terminal.
      if (req.method === "POST" && taskMatch) {
        const id = taskMatch[1];
        const body = (await readBody(req)) as { text?: string };
        if (typeof body?.text !== "string" || !body.text.trim()) {
          json(res, 400, { error: "Expected { text: string }" });
          return true;
        }
        json(res, 201, { tasks: await addSpecTask(projectRoot, id, body.text) });
        return true;
      }
      // Spec 028: the score the MCP already serves (spec 027), now visible
      // from the drawer — same scoreSpec, so canvas and agent never disagree.
      const scoreMatch = route.match(/^\/api\/spec\/([^/]+)\/score$/);
      if (req.method === "GET" && scoreMatch) {
        const [score] = await scoreSpec(projectRoot, scoreMatch[1]);
        json(res, 200, score);
        return true;
      }
      // Spec 028: bitácora from the canvas. GET lists a folder (?file=name
      // reads one entry); POST writes one entry through the same core writers
      // the MCP tools use — decisiones/handoffs { fileName, content }, diaria
      // { date, content }, global { entry }.
      const bitacoraMatch = route.match(/^\/api\/bitacora\/([^/]+)$/);
      if (bitacoraMatch) {
        const kind = bitacoraMatch[1] as BitacoraKind;
        if (!["handoffs", "decisiones", "diaria", "global"].includes(kind)) {
          json(res, 400, { error: "Unknown bitacora kind. Use handoffs, decisiones, diaria or global." });
          return true;
        }
        if (req.method === "GET") {
          const file = url.searchParams.get("file");
          if (file) {
            json(res, 200, await readBitacoraFile(projectRoot, kind, file));
          } else {
            json(res, 200, { kind, files: await listBitacoraFiles(projectRoot, kind) });
          }
          return true;
        }
        if (req.method === "POST") {
          const body = (await readBody(req)) as {
            fileName?: string;
            date?: string;
            content?: string;
            entry?: string;
          };
          if (kind === "global") {
            if (typeof body?.entry !== "string" || !body.entry.trim()) {
              json(res, 400, { error: "Expected { entry: string }" });
              return true;
            }
            json(res, 201, await appendProjectLogEntry(projectRoot, body.entry));
            return true;
          }
          if (kind === "diaria") {
            if (typeof body?.date !== "string" || typeof body?.content !== "string" || !body.content.trim()) {
              json(res, 400, { error: "Expected { date: 'YYYY-MM-DD', content: string }" });
              return true;
            }
            json(res, 201, await writeDailyLog(projectRoot, body.date, body.content));
            return true;
          }
          if (typeof body?.fileName !== "string" || typeof body?.content !== "string" || !body.content.trim()) {
            json(res, 400, { error: "Expected { fileName: string, content: string }" });
            return true;
          }
          const writer = kind === "decisiones" ? writeDecision : writeHandoff;
          json(res, 201, await writer(projectRoot, body.fileName, body.content));
          return true;
        }
      }
      // Spec 028: regenerate the status dashboard and the roadmap from the
      // canvas — the two generators already existed in core and MCP.
      if (req.method === "POST" && route === "/api/status") {
        json(res, 200, await generateStatus(projectRoot));
        return true;
      }
      if (req.method === "POST" && route === "/api/roadmap") {
        json(res, 200, await generateRoadmap(projectRoot));
        return true;
      }
      // Spec 031: the AI request queue. The builder publishes requests here
      // and the user's agent session answers them over MCP; these routes are
      // the builder-facing mirror. Note there is no "respond" route — only an
      // agent answers, and only the user accepts (which is `resolve`).
      if (req.method === "POST" && route === "/api/request") {
        const body = (await readBody(req)) as CreateAiRequestInput | undefined;
        if (typeof body?.instruction !== "string" || !body.instruction.trim()) {
          json(res, 400, { error: "Expected { type, instruction, target?, currentText? }" });
          return true;
        }
        json(res, 201, await createAiRequest(projectRoot, body));
        return true;
      }
      // Spec 029, R5: the version gap, visible on the canvas. Read-only —
      // the builder shows it and points at the command; it never upgrades on
      // its own, because this spec demands warning, not autonomy.
      if (req.method === "GET" && route === "/api/version") {
        const sddRoot = await resolveSddRoot(projectRoot);
        const comparison = await compareSidecar(sddRoot, packageJson.version);
        json(res, 200, {
          templateVersion: comparison.templateVersion,
          serverVersion: comparison.packageVersion,
          upToDate: comparison.upToDate,
          staleFramework: comparison.staleFramework.map((f) => f.target),
          divergedPreserved: comparison.divergedPreserved.map((f) => f.target),
          missing: comparison.missing.map((f) => f.target),
          command: `npx @juanklagos/sdd-mcp@latest upgrade --project-root ${projectRoot} --dry-run`
        });
        return true;
      }
      // Spec 032, R10: the connect panel's data comes from the SAME client
      // catalogue the CLI writes from, so the builder can never show a path
      // or a snippet that `connect` does not actually produce.
      if (req.method === "GET" && route === "/api/connect") {
        json(res, 200, {
          projectRoot,
          command: "npx @juanklagos/sdd-mcp@latest connect",
          clients: manualInstructions(projectRoot).map(({ client, file, snippet }) => ({
            id: client.id,
            label: client.label,
            configFile: file,
            format: client.format,
            serveHint: client.serveHint,
            snippet
          }))
        });
        return true;
      }
      if (req.method === "GET" && route === "/api/requests") {
        const [requests, agent] = await Promise.all([listAiRequests(projectRoot), getAgentPresence(projectRoot)]);
        json(res, 200, { requests, agent });
        return true;
      }
      const requestResolveMatch = route.match(/^\/api\/request\/([^/]+)\/resolve$/);
      if (req.method === "POST" && requestResolveMatch) {
        const body = (await readBody(req)) as { resolution?: string };
        const resolution = body?.resolution;
        if (resolution !== "accepted" && resolution !== "rejected" && resolution !== "cancelled") {
          json(res, 400, { error: "Expected { resolution: 'accepted' | 'rejected' | 'cancelled' }" });
          return true;
        }
        json(res, 200, await resolveAiRequest(projectRoot, requestResolveMatch[1], resolution as AiRequestResolution));
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
      // A coded precondition failure also ships its `code` (and raw CLI
      // `detail` when there is one) so the client can localize it instead of
      // printing the bilingual fallback message verbatim (spec 010, R1).
      // Spec 042: cualquier error del núcleo que traiga su propio `code` viaja
      // con él, no sólo los de GitHub. Es lo que permite al lienzo distinguir
      // «el tablero no se pudo leer» de «el servidor no responde», que hasta
      // ahora se pintaban con el mismo titular.
      const coded =
        error && typeof error === "object" && typeof (error as { code?: unknown }).code === "string"
          ? {
              code: (error as { code: string }).code,
              // `path` viaja como `detail`: es el dato que el aviso del lienzo
              // tiene que enseñar para que la persona sepa qué archivo abrir.
              ...(typeof (error as { path?: unknown }).path === "string"
                ? { detail: (error as { path: string }).path }
                : {})
            }
          : {};
      json(res, 422, {
        error: error instanceof Error ? error.message : String(error),
        ...coded,
        ...(isGithubPreconditionError(error)
          ? { code: error.code, ...(error.detail ? { detail: error.detail } : {}) }
          : {})
      });
      return true;
    }
    return false;
  };
}
