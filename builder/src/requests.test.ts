// Spec 031, T8 — the pure rules the store applies to the queue, with an
// injected clock (no fake timers, no store mocking needed).
import { describe, expect, it } from "vitest";
import {
  activeAiRequests,
  AGENT_FRESH_MS,
  isAgentConnected,
  isStalled,
  STALLED_MS,
  type AiRequest
} from "./requests";

const NOW = Date.parse("2026-08-12T12:00:00.000Z");

function req(overrides: Partial<AiRequest>): AiRequest {
  return {
    id: "1-abc",
    type: "draft-field",
    target: { kind: "section", specId: "001-demo", ref: "requirements" },
    instruction: "amplía",
    status: "pending",
    createdAt: new Date(NOW).toISOString(),
    ...overrides
  };
}

describe("isAgentConnected (R6: 5 minutes)", () => {
  it("is false with no presence at all", () => {
    expect(isAgentConnected(null, NOW)).toBe(false);
  });

  it("is true just under the threshold and false just over it", () => {
    const fresh = { agent: "claude", lastSeenAt: new Date(NOW - AGENT_FRESH_MS + 1000).toISOString() };
    const stale = { agent: "claude", lastSeenAt: new Date(NOW - AGENT_FRESH_MS - 1000).toISOString() };
    expect(isAgentConnected(fresh, NOW)).toBe(true);
    expect(isAgentConnected(stale, NOW)).toBe(false);
  });
});

describe("isStalled (R8: 10 minutes pending)", () => {
  it("flags a pending request older than the threshold", () => {
    const old = req({ createdAt: new Date(NOW - STALLED_MS - 1000).toISOString() });
    expect(isStalled(old, NOW)).toBe(true);
  });

  it("never flags fresh pending requests or non-pending ones", () => {
    expect(isStalled(req({}), NOW)).toBe(false);
    const oldButClaimed = req({
      status: "in_progress",
      createdAt: new Date(NOW - STALLED_MS - 1000).toISOString()
    });
    expect(isStalled(oldButClaimed, NOW)).toBe(false);
  });
});

describe("activeAiRequests (R7)", () => {
  it("keeps pending/in_progress/answered and drops closed states", () => {
    const list = [
      req({ id: "1-a", status: "pending" }),
      req({ id: "2-b", status: "in_progress" }),
      req({ id: "3-c", status: "answered" }),
      req({ id: "4-d", status: "accepted" }),
      req({ id: "5-e", status: "rejected" }),
      req({ id: "6-f", status: "cancelled" })
    ];
    expect(activeAiRequests(list).map((r) => r.id)).toEqual(["1-a", "2-b", "3-c"]);
  });
});
