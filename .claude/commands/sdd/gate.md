---
description: Run the SDD gate (policy + approval + consistency) and record consent before implementation / Ejecuta la compuerta SDD y registra consentimiento antes de implementar
---

Run the gate and, only if it opens, prepare implementation. Respond in the user's language (EN/ES).

1. Run (root layout; in sidecar projects use `./spec/scripts/...`):
   - `./scripts/check-sdd-policy.sh .`
   - `./scripts/check-sdd-gate.sh .`
2. Report the result honestly, including full error/warning lines, the verdict line and the posture line.
   The gate answers one of three states, and they mean different things:
   - `open` / `ABIERTA` — a spec is approved and consented to. Implementation may start.
   - `closed` / `CERRADA` — nothing is approved yet. Not a failure: it is where every project starts. Exit code is still 0 unless `--require-open` was passed, in which case it is 2.
   - `blocked` / `BLOQUEADA` — there are errors. Exit code 1.
   The posture line states what the gate did and did NOT check. Repeat it to the user rather than paraphrasing: it is the only thing standing between a green result and a false sense of coverage. In particular the gate does not read project code, so it cannot tell you whether what was written matches the spec.
3. If the gate FAILS, branch on **which** error it printed. Do not implement either way.
   - **Only** missing consent (`Missing or empty user consent log` and/or `NNN-slug approved but no user consent recorded for it`) — the spec itself is fine, it just has no recorded consent yet. `/sdd:spec` cannot fix this; consent is the remedy. So:
     - Ask the user explicitly: "Do you approve starting implementation of spec NNN with this scope?"
     - Only after a clear yes in the chat, record it: `./scripts/confirm-user-consent.sh --spec NNN-slug "User approved implementation for spec NNN-slug"`.
     - Re-run `./scripts/check-sdd-gate.sh .` and continue from step 2 with the new result.
   - Any other error (spec not approved, placeholder approval date/approver, empty approval evidence, `plan.md` incomplete, `tasks.md` with no checklist, a missing agent rule file) — name the exact gap and the file/section to fix, and suggest `/sdd:spec` to refine. Never record consent to make one of these go away.
4. If the gate PASSES:
   - If consent for the active spec is already recorded, implementation may start, limited to the tasks in `tasks.md` of that spec.
   - If the gate only passed because a legacy workspace-wide consent log covers the spec (the `Legacy consent log covers these approved specs` warning), ask for approval as in step 3 and record a per-spec entry before implementing.

Notes:
- Consent is **per spec**. One recorded consent opens the gate for that spec id only.
- A consent entry without `--spec` is a legacy, workspace-wide record: the gate accepts it with a warning, but prefer the explicit form.

Hard stop: no code before approved `spec.md`, consistent `plan.md`, and recorded consent for that spec. Never fabricate or assume consent.
