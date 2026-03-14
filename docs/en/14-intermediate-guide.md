# Intermediate guide (teams and real projects)

Who is this for:
- You already use SDD basics and need consistent team execution.

## Goal
Run repeatable sessions with traceability and low rework.

## Standard session flow

1. Read context:
- `idea/IDEA_GENERAL.md`
- `specs/INDEX.md`
- latest handoff in `bitacora/handoffs/`

2. Select one active spec.
3. Execute only in-scope tasks from `tasks.md`.
4. Update traceability:
- `history.md`
- `specs/INDEX.md` (if status/priority changes)
- `bitacora/global/PROJECT_LOG.md`

5. Validate:

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

## Team controls
- One active spec per session.
- No undocumented scope changes.
- Mandatory handoff when work is pending.

## Recommended prompt
Use and adapt:
- [Prompt matrix](./19-prompt-matrix-by-goal.md)

## Next step
Move to advanced governance:
- [docs/en/15-advanced-guide.md](./15-advanced-guide.md)
