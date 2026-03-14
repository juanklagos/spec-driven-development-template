# SDD Execution Gate / Compuerta de ejecución SDD

## Decision gate before coding

Coding is allowed only if all checks are YES:

1. Is there one active specification?
2. Is `spec.md` approved by the user?
3. Is `plan.md` consistent with `spec.md` acceptance criteria?
4. Are tasks in `tasks.md` aligned to plan and scope?
5. Is there no unresolved contradiction between idea/spec/plan?

If any check is NO:

- Do not write implementation code.
- Refine docs first.
- Report exact missing condition.

## Minimal evidence to proceed

- Explicit user approval in session text.
- Traceability from requirement -> plan -> tasks.
- Clear out-of-scope boundaries.

## End-of-session checks

- `history.md` updated when needed.
- `specs/INDEX.md` updated when needed.
- `bitacora/` updated.
- `./scripts/validate-sdd.sh . --strict` executed.
