---
mode: agent
description: Validate and close the session with the SDD output contract (mirror of /sdd:close)
---

Close the session with validation and traceability. Respond in the user's language (EN/ES).

1. Run `./scripts/validate-sdd.sh . --strict`, `./scripts/check-sdd-policy.sh .`, `./scripts/check-sdd-gate.sh .` (sidecar: `./spec/scripts/...`).
2. Update: active spec `history.md`, `specs/INDEX.md`, `bitacora/diaria/YYYY-MM-DD.md`, `bitacora/global/PROJECT_LOG.md`, `bitacora/handoffs/` if work stays pending.
3. End with the six-item contract: Objective, Active spec, Changes, Validation (real output), Risks, Next step.

Report failures honestly; never mark the session clean when it is not.

Canonical source: `.claude/commands/sdd/close.md` — keep both in sync.
