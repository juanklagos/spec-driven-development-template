---
description: Run the SDD gate (policy + approval + consistency) and record consent before implementation / Ejecuta la compuerta SDD y registra consentimiento antes de implementar
---

Run the machine-checked gate and, only if it passes, prepare implementation. Respond in the user's language (EN/ES).

1. Run (root layout; in sidecar projects use `./spec/scripts/...`):
   - `./scripts/check-sdd-policy.sh .`
   - `./scripts/check-sdd-gate.sh .`
2. Report the result honestly, including full error/warning lines.
3. If the gate FAILS: do not implement. Name the exact gap (spec not approved, plan inconsistent, missing tasks...) and the file/section to fix. Suggest `/sdd:spec` to refine.
4. If the gate PASSES:
   - Ask the user explicitly: "Do you approve starting implementation of spec NNN with this scope?"
   - Only after a clear yes in the chat, record it: `./scripts/confirm-user-consent.sh "User approved implementation for spec NNN"`.
   - Then implementation may start, limited to the tasks in `tasks.md` of the active spec.

Hard stop: no code before approved `spec.md`, consistent `plan.md`, and recorded consent. Never fabricate or assume consent.
