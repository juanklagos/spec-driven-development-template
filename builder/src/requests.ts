// Spec 031 — client-side types and pure rules for the AI request queue.
// The thresholds live here (with their spec anchors) so the store and every
// surface agree on what "connected" and "stalled" mean; both take `nowMs`
// so tests inject the clock.

// `review-spec` (spec 036, R5): revisar una spec entera. Un tipo más de la
// misma cola; mantener este union en sintonía con
// packages/sdd-core/src/requests.ts, como el lint EARS.
export type AiRequestType = "draft-field" | "structure-idea" | "review-spec";

export type AiRequestStatus =
  | "pending"
  | "in_progress"
  | "answered"
  | "accepted"
  | "rejected"
  | "cancelled";

export type AiTargetKind = "section" | "task" | "note" | "bitacora" | "spec";

/**
 * Superficies de CAMPO: lo único que puede montar «Ampliar con IA». `spec`
 * queda fuera a propósito — una spec entera se revisa, no se amplía — y así el
 * contrato de ai-surfaces.test.ts también lo sostiene el tipo (ISP).
 */
export type AiFieldKind = Exclude<AiTargetKind, "spec">;

export interface AiRequestTarget {
  kind: AiTargetKind;
  specId?: string;
  ref: string;
}

export interface AiRequest {
  id: string;
  type: AiRequestType;
  target?: AiRequestTarget;
  currentText?: string;
  instruction: string;
  status: AiRequestStatus;
  createdAt: string;
  agent?: string;
  startedAt?: string;
  proposal?: string;
  answeredAt?: string;
  resolvedAt?: string;
}

export interface AgentPresence {
  agent: string;
  lastSeenAt: string;
}

/** R6: an agent counts as connected while its last queue poll is this fresh. */
export const AGENT_FRESH_MS = 5 * 60 * 1000;

/** R8: a request still pending after this long is flagged as stalled. */
export const STALLED_MS = 10 * 60 * 1000;

export function isAgentConnected(presence: AgentPresence | null, nowMs: number): boolean {
  if (!presence) return false;
  const seen = Date.parse(presence.lastSeenAt);
  return Number.isFinite(seen) && nowMs - seen < AGENT_FRESH_MS;
}

export function isStalled(request: AiRequest, nowMs: number): boolean {
  if (request.status !== "pending") return false;
  const created = Date.parse(request.createdAt);
  return Number.isFinite(created) && nowMs - created > STALLED_MS;
}

/** The requests worth showing in the UI: everything not yet closed (R7). */
export function activeAiRequests(requests: AiRequest[]): AiRequest[] {
  return requests.filter(
    (r) => r.status === "pending" || r.status === "in_progress" || r.status === "answered"
  );
}
