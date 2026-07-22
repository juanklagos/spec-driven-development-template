import type {
  ApproveSpecResult,
  BoardCanvas,
  BoardResponse,
  CreateIssuesResult,
  CreateSpecResult,
  GateSummary,
  SpecDetail,
  SpecSectionsInput,
  TaskItem,
  UpdateSpecSectionsResult
} from "./types";

import { hasTranslation, translate } from "./i18n";

// Same-origin API served by packages/sdd-mcp (http://127.0.0.1:3334/builder).
//
// Errors are localized on BOTH sides. Server failures that carry a machine
// `code` (packages/sdd-mcp/src/github.ts owns the taxonomy) are rendered from
// the local dictionary, so the drawer no longer shows the bilingual
// "es / en" fallback message — spec 010, R1 forbids double labels in errors
// too. Any code the dictionary does not know falls back to the server text,
// which is never worse than the previous behaviour.
async function request<T>(path: string, init?: RequestInit): Promise<T> {
  let res: Response;
  try {
    res = await fetch(path, {
      headers: { "content-type": "application/json" },
      ...init
    });
  } catch {
    throw new Error(translate("error.apiUnreachable"));
  }
  if (!res.ok) {
    let message = `HTTP ${res.status}`;
    try {
      const body = (await res.json()) as { error?: string; code?: string; detail?: string };
      if (body?.error) message = body.error;
      const key = body?.code ? `error.code.${body.code}` : "";
      if (key && hasTranslation(key)) {
        // `detail` is raw CLI output: no dictionary can translate it, so it is
        // appended verbatim after the localized sentence.
        message = translate(key) + (body.detail ? ` — ${body.detail}` : "");
      }
    } catch {
      // keep the HTTP status message
    }
    throw new Error(message);
  }
  return (await res.json()) as T;
}

export const api = {
  getBoard: (): Promise<BoardResponse> => request("/api/board"),

  putBoard: (canvas: BoardCanvas): Promise<{ ok: boolean }> =>
    request("/api/board", { method: "PUT", body: JSON.stringify(canvas) }),

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
    request(`/api/spec/${encodeURIComponent(id)}/issues`, { method: "POST" })
};

export function errorMessage(error: unknown): string {
  return error instanceof Error ? error.message : String(error);
}
