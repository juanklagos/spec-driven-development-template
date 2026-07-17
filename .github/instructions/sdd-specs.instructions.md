---
applyTo: "specs/**"
---

# Rules for working inside specs/

- Every spec is a numbered bundle: `spec.md`, `plan.md`, `tasks.md`, `history.md` (plus optional `research.md`, `contracts/`).
- `spec.md` must keep its approval section up to date (status `Pendiente`/`Aprobado`, date, approver, evidence). Only the user approves.
- Write acceptance criteria in EARS form: `WHEN [trigger], THE SYSTEM SHALL [observable behavior]` (ES: `CUANDO ..., EL SISTEMA DEBERÁ ...`). No vague words without measurable values.
- `plan.md` must stay consistent with `spec.md`: every requirement covered, nothing out of scope.
- `tasks.md` uses checkboxes; include test tasks before implementation tasks.
- Record every scope/requirement change in `history.md` with date, and reflect status changes in `specs/INDEX.md`.
- Hard stop: no implementation code before the spec is approved and the plan is consistent (`./scripts/check-sdd-gate.sh .` must pass).
