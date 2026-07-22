---
mode: agent
description: Run the SDD gate (policy + approval + consistency) and record consent before implementation (mirror of /sdd:gate)
---

Run the SDD gate. Respond in the user's language (EN/ES).

1. Run `./scripts/check-sdd-policy.sh .` and `./scripts/check-sdd-gate.sh .` (sidecar projects: `./spec/scripts/...`).
2. Report results honestly with the real output lines, including the verdict and posture lines.
   Three states: `open` (approved and consented, may implement), `closed` (nothing approved yet — not a failure, exit 0; exit 2 only with `--require-open`), `blocked` (errors, exit 1). Repeat the posture line verbatim: it states what was NOT checked, and the gate does not read project code.
3. If it fails: do not implement, and branch on which error it printed.
   - If the ONLY error is a missing or empty consent log, or `NNN-slug approved but no user consent recorded for it`: the spec is fine and refining it cannot help. Ask the user explicitly for approval to start implementation of that spec; only after a clear yes, record it with `./scripts/confirm-user-consent.sh --spec NNN-slug "User approved implementation for spec NNN-slug"`, then re-run the gate and continue from step 2.
   - For any other error (spec not approved, placeholder approval fields, incomplete `plan.md`, no checklist in `tasks.md`, missing agent rule file): name the exact gap and file/section to fix. Never record consent to silence one of these.
4. If it passes: implement only tasks from the active spec's `tasks.md`, and only once consent for that spec id is on record. If the gate passed only under the `Legacy consent log covers these approved specs` warning, ask for approval and record a per-spec entry first.

Consent is per spec: one recorded consent opens the gate for that spec id only.

Hard stop: no code before approved `spec.md`, consistent `plan.md`, and recorded consent for that spec.

Canonical source: `.claude/commands/sdd/gate.md` — keep both in sync.
