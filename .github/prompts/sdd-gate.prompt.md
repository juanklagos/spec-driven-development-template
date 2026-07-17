---
mode: agent
description: Run the SDD gate (policy + approval + consistency) and record consent before implementation (mirror of /sdd:gate)
---

Run the machine-checked SDD gate. Respond in the user's language (EN/ES).

1. Run `./scripts/check-sdd-policy.sh .` and `./scripts/check-sdd-gate.sh .` (sidecar projects: `./spec/scripts/...`).
2. Report results honestly with the real output lines.
3. If it fails: do not implement; name the exact gap and file/section to fix.
4. If it passes: ask the user explicitly for approval to start implementation; only after a clear yes, record it with `./scripts/confirm-user-consent.sh "User approved implementation for spec NNN"`. Then implement only tasks from the active spec's `tasks.md`.

Hard stop: no code before approved `spec.md`, consistent `plan.md`, and recorded consent.

Canonical source: `.claude/commands/sdd/gate.md` — keep both in sync.
