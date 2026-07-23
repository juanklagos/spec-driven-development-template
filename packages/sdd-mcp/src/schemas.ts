// Shared zod schemas for the SDD MCP tools.
//
// Extracted from server.ts so both the classic tools and the MCP App tool
// (app.ts, spec 006 R5) describe the exact same shapes: one source of truth
// for board, validation and gate payloads across every transport.

import { z } from "zod";

export const projectRootSchema = z
  .string()
  .describe("Absolute target project path. Recommended default inside this template: ./www/<project-name>.");

export const specIdSchema = z
  .string()
  .regex(/^\d{3}-[a-z0-9][a-z0-9-]*$/, "Spec id must look like 001-my-feature")
  .describe("Numbered spec folder id such as 001-my-feature.");

export const validationMessageSchema = z.object({
  level: z.enum(["error", "warning", "info"]),
  code: z.string(),
  message: z.string(),
  path: z.string().optional()
});

export const validationResultSchema = z.object({
  ok: z.boolean(),
  errors: z.number(),
  warnings: z.number(),
  messages: z.array(validationMessageSchema)
});

// Typed-edge dependency warning (spec 009, R2): approved spec leaning on an
// unapproved dependency, derived from the board's "depende de"/"bloquea" edges.
export const dependencyWarningSchema = z.object({
  edgeId: z.string(),
  dependent: z.string(),
  dependency: z.string(),
  label: z.string(),
  message: z.string()
});

export const canvasNodeSchema = z.object({
  id: z.string(),
  type: z.enum(["file", "text"]),
  x: z.number(),
  y: z.number(),
  width: z.number(),
  height: z.number(),
  file: z.string().optional(),
  text: z.string().optional(),
  color: z.string().optional()
});

export const canvasEdgeSchema = z.object({
  id: z.string(),
  fromNode: z.string(),
  toNode: z.string(),
  fromSide: z.string().optional(),
  toSide: z.string().optional(),
  label: z.string().optional(),
  color: z.string().optional()
});

export const canvasSchema = z.object({
  nodes: z.array(canvasNodeSchema),
  edges: z.array(canvasEdgeSchema)
});

export const taskItemSchema = z.object({
  text: z.string(),
  done: z.boolean(),
  line: z.number()
});

export const specDriftSchema = z.object({
  state: z.enum(["clean", "drifted", "unscoped", "unknown"]),
  commits: z
    .array(z.object({ hash: z.string(), date: z.string(), subject: z.string() }))
    .default([])
});

export const boardSpecCardSchema = z.object({
  id: z.string(),
  dir: z.string(),
  status: z.string(),
  /** Human title from line 1 of spec.md; defaulted for older servers. */
  title: z.string().default(""),
  tasks: z.object({ done: z.number(), total: z.number() }),
  /** Computed by sdd-core specTone: the one state every surface renders. */
  tone: z.enum(["pending", "ok", "done"]),
  /**
   * Paths the spec declares it governs. Optional-with-default so a workspace
   * whose specs predate the File scope section still validates.
   *
   * BoardSpecCard spreads SpecSummary, so every field added there arrives here
   * automatically — and this schema rejects undeclared properties. That is how
   * `tone` broke once and `fileScope` broke again; test-mcp-integration.mjs now
   * asserts the two shapes round-trip.
   */
  fileScope: z.array(z.string()).default([]),
  /**
   * Spec 025: drift of the code this spec governs vs. its approval. Computed by
   * sdd-core computeSpecDrift. Optional-with-default so a workspace served by an
   * older sdd-core (no drift field) still validates.
   */
  drift: specDriftSchema.default({ state: "unknown", commits: [] })
});

export const boardViewSchema = z.object({
  canvas: canvasSchema,
  specs: z.array(boardSpecCardSchema)
});

/**
 * Raw shape of the gate semaphore summary (getGateSummary in sdd-core).
 * Used as-is for the sdd_gate_summary outputSchema and wrapped with
 * z.object(...) inside the MCP App tool payload.
 */
export const verdictSchema = z.enum(["open", "closed", "blocked"]);

export const gateSummaryShape = {
  ok: z.boolean(),
  verdict: verdictSchema,
  errors: z.number(),
  warnings: z.number(),
  approvedSpecs: z.number(),
  totalSpecs: z.number(),
  gate: validationResultSchema.extend({
    approvedSpecs: z.number(),
    totalSpecs: z.number(),
    verdict: verdictSchema
  }),
  validation: validationResultSchema,
  specIssues: z.record(z.array(validationMessageSchema)),
  generalIssues: z.array(validationMessageSchema),
  dependencyWarnings: z.array(dependencyWarningSchema)
};

export const gateSummarySchema = z.object(gateSummaryShape);
