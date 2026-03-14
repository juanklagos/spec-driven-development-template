# GitHub Copilot Instructions - SDD Template

This repository follows Spec-Driven Development (SDD).

Read first:
- `INSTRUCTIONS.md`
- `AGENTS.md`
- `template-context/README.md`

Hard implementation gate:
- Do not generate or modify implementation code unless `spec.md` is approved by the user and `plan.md` is consistent with `spec.md`.

If gate is not met:
- Focus on refining spec/plan/tasks/history/logbook.

Always preserve traceability:
- Update `history.md` for requirement/scope/priority changes.
- Update `specs/INDEX.md` when status or priority changes.
- Update `bitacora/` at session end.

Validation:
- Run `./scripts/validate-sdd.sh . --strict` before closing tasks.
