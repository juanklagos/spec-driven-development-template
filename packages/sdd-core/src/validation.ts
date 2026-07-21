// The shape every SDD check speaks: structure validation, policy check and the
// implementation gate all return the same ValidationResult so the MCP tools,
// the REST API and the builder never have to special-case one of them.
//
// It lives in its own module (instead of index.ts, where it used to be
// declared) so that policy.ts can produce these messages without importing
// index.ts, which imports policy.ts.

export interface ValidationMessage {
  level: "error" | "warning" | "info";
  code: string;
  message: string;
  path?: string;
}

export interface ValidationResult {
  ok: boolean;
  errors: number;
  warnings: number;
  messages: ValidationMessage[];
}

/** ok is errors === 0: warnings never close a gate. */
export function summarize(messages: ValidationMessage[]): ValidationResult {
  const errors = messages.filter((message) => message.level === "error").length;
  const warnings = messages.filter((message) => message.level === "warning").length;
  return {
    ok: errors === 0,
    errors,
    warnings,
    messages
  };
}
