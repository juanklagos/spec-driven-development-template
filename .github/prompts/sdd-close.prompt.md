---
mode: agent
description: Validate and close the session with the SDD output contract (mirror of /sdd:close)
---

Close the session with validation and traceability. Respond in the user's language (EN/ES).

1. Run `./scripts/validate-sdd.sh . --strict`, `./scripts/check-sdd-policy.sh .`, `./scripts/check-sdd-gate.sh .` (sidecar: `./spec/scripts/...`).
2. Update: active spec `history.md`, `specs/INDEX.md`, `bitacora/diaria/YYYY-MM-DD.md`, `bitacora/global/PROJECT_LOG.md`, `bitacora/handoffs/` if work stays pending.
3. Check for a decision worth recording — ask only if the session chose between real alternatives, OR the choice is expensive to reverse, OR a future reader would ask "why is it like this?". If so, name the candidate in one line, confirm with the user, and record it with `/sdd:decision` before closing. Otherwise skip the question.
4. End with the seven-item contract: Objective, Active spec, Changes, Validation (real output), Risks, Decision recorded (file in `bitacora/decisiones/`, or "none this session" and why), Next step.

Report failures honestly; never mark the session clean when it is not.

Canonical source: `.claude/commands/sdd/close.md` — keep both in sync.
