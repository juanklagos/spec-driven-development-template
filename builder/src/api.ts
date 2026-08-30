import type {
  ApproveSpecResult,
  BitacoraKind,
  ConnectInfo,
  BoardCanvas,
  BoardResponse,
  CreateIssuesResult,
  CreateSpecResult,
  FileOutputResult,
  GateSummary,
  SpecDetail,
  SpecScore,
  SpecSectionsInput,
  TaskItem,
  VersionInfo,
  UpdateSpecSectionsResult
} from "./types";

import { hasTranslation, translate } from "./i18n";
import type { AgentPresence, AiRequest, AiRequestTarget, AiRequestType } from "./requests";

// Same-origin API served by packages/sdd-mcp (http://127.0.0.1:3334/builder).
//
// Errors are localized on BOTH sides. Server failures that carry a machine
// `code` (packages/sdd-mcp/src/github.ts owns the taxonomy) are rendered from
// the local dictionary, so the drawer no longer shows the bilingual
// "es / en" fallback message — spec 010, R1 forbids double labels in errors
// too. Any code the dictionary does not know falls back to the server text,
// which is never worse than the previous behaviour.
/**
 * Spec 042. An error that knows whether the server answered. Until this
 * existed, the canvas had a single narrative for every load failure — «the
 * builder can't find the server» — and printed it even when the server had
 * answered perfectly well to say the board file was unreadable, together with a
 * command that reproduced the very error the person was looking at.
 */
export class ApiError extends Error {
  /** Machine code from the server body, when it sent one. */
  readonly code?: string;
  /** Untranslatable server-side detail (a file path, raw CLI output). */
  readonly detail?: string;
  /** True only when the request never reached a server. */
  readonly unreachable: boolean;

  constructor(
    message: string,
    options: { code?: string; detail?: string; unreachable?: boolean } = {}
  ) {
    super(message);
    this.name = "ApiError";
    this.code = options.code;
    this.detail = options.detail;
    this.unreachable = options.unreachable ?? false;
  }
}

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "content-type": "application/json" },
      ...init
    });
  } catch {
    throw new ApiError(translate("error.apiUnreachable"), { unreachable: true });
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    let code: string | undefined;
    let detail: string | undefined;
    try {
      const body = (await res.json()) as { error?: string; code?: string; detail?: string };
      if (body?.error) message = body.error;
      code = body?.code;
      detail = body?.detail;
      const key = body?.code ? `error.code.${body.code}` : "";
      if (key && hasTranslation(key)) {
        // `detail` is raw CLI output: no dictionary can translate it, so it is
        // appended verbatim after the localized sentence.
        message = translate(key) + (body.detail ? ` — ${body.detail}` : "");
      }
    } catch {
      // keep the HTTP status message
    }
    throw new ApiError(message, { code, detail });
  }
  return (await res.json()) as T;
}

export const api = {
  getBoard: (): Promise<BoardResponse> => request("/api/board"),

  putBoard: (canvas: BoardCanvas): Promise<{ ok: boolean }> =>
    request("/api/board", { method: "PUT", body: JSON.stringify(canvas) }),

  /**
   * Spec 042. Discard an unreadable board and start from the default one. The
   * server keeps the old file as `board.canvas.bak`, so «discard» stays
   * recoverable. Only ever called from the explicit button in the notice.
   */
  resetBoard: (): Promise<{ canvas: BoardCanvas }> =>
    request("/api/board/reset", { method: "POST" }),

  getSpec: (id: string): Promise<SpecDetail> => request(`/api/spec/${encodeURIComponent(id)}`),

  putTask: (id: string, line: number, done: boolean): Promise<{ tasks: TaskItem[] }> =>
    request(`/api/spec/${encodeURIComponent(id)}/tasks`, {
      method: "PUT",
      body: JSON.stringify({ line, done })
    }),

  createSpec: (name: string, owner?: string): Promise<CreateSpecResult> =>
    request("/api/spec", {
      method: "POST",
      body: JSON.stringify(owner ? { name, owner } : { name })
    }),

  getGate: (): Promise<GateSummary> => request("/api/gate"),

  approveSpec: (id: string, approver: string, evidence?: string): Promise<ApproveSpecResult> =>
    request(`/api/spec/${encodeURIComponent(id)}/approve`, {
      method: "POST",
      body: JSON.stringify(evidence ? { approver, evidence } : { approver })
    }),

  /** Record consent for one spec. Approval and consent stay two acts. */
  recordConsent: (id: string, summary: string): Promise<{ logFile: string; summary: string; timestamp: string }> =>
    request(`/api/spec/${encodeURIComponent(id)}/consent`, {
      method: "POST",
      body: JSON.stringify({ summary })
    }),

  putSections: (id: string, sections: SpecSectionsInput): Promise<UpdateSpecSectionsResult> =>
    request(`/api/spec/${encodeURIComponent(id)}/sections`, {
      method: "PUT",
      body: JSON.stringify(sections)
    }),

  createIssues: (id: string): Promise<CreateIssuesResult> =>
    request(`/api/spec/${encodeURIComponent(id)}/issues`, { method: "POST" }),

  // --- Spec 028: the canvas catches up with the MCP surface ---------------

  /** Append one unchecked task to the spec's tasks.md. */
  addTask: (id: string, text: string): Promise<{ tasks: TaskItem[] }> =>
    request(`/api/spec/${encodeURIComponent(id)}/tasks`, {
      method: "POST",
      body: JSON.stringify({ text })
    }),

  /** The 0-100 quality score of one spec (same scoreSpec as sdd_score_spec). */
  getSpecScore: (id: string): Promise<SpecScore> =>
    request(`/api/spec/${encodeURIComponent(id)}/score`),

  /** Write one bitácora entry (decisiones/handoffs { fileName, content }, diaria { date, content }, global { entry }). */
  writeBitacora: (kind: BitacoraKind, payload: Record<string, string>): Promise<FileOutputResult> =>
    request(`/api/bitacora/${encodeURIComponent(kind)}`, {
      method: "POST",
      body: JSON.stringify(payload)
    }),

  /** Regenerate STATUS.md from specs/INDEX.md. */
  generateStatus: (): Promise<FileOutputResult> => request("/api/status", { method: "POST" }),

  /** Regenerate docs/roadmap.{md,mmd} from specs/INDEX.md. */
  generateRoadmap: (): Promise<{ mermaidPath: string; markdownPath: string }> =>
    request("/api/roadmap", { method: "POST" }),

  // --- Spec 031: AI request queue (builder -> agent, no clipboard) ---------

  /** Publish one AI-assist request for the connected agent session. */
  createAiRequest: (input: {
    type: AiRequestType;
    target?: AiRequestTarget;
    currentText?: string;
    instruction: string;
  }): Promise<AiRequest> => request("/api/request", { method: "POST", body: JSON.stringify(input) }),

  /** Every queued request plus the agent's last-seen presence. */
  listAiRequests: (): Promise<{ requests: AiRequest[]; agent: AgentPresence | null }> =>
    request("/api/requests"),

  /** Spec 029: sidecar vs server version, read-only. */
  getVersionInfo: (): Promise<VersionInfo> => request("/api/version"),

  /** Spec 032: the agent-client catalogue, straight from sdd-core. */
  getConnectInfo: (): Promise<ConnectInfo> => request("/api/connect"),

  /** Close one request. `accepted` is the ONLY path that follows with a write. */
  resolveAiRequest: (id: string, resolution: "accepted" | "rejected" | "cancelled"): Promise<AiRequest> =>
    request(`/api/request/${encodeURIComponent(id)}/resolve`, {
      method: "POST",
      body: JSON.stringify({ resolution })
    })
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
