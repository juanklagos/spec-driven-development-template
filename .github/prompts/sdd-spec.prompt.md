---
mode: agent
description: Create or refine a numbered spec bundle - spec, plan, tasks, history (mirror of /sdd:spec)
---

Create or refine a spec bundle. Respond in the user's language (EN/ES). Ask the user for the feature name or spec number if it is not already clear from the conversation.

1. If the user names a new feature: run `./scripts/new-spec.sh "<feature>" "<owner>"` (sidecar: `./spec/scripts/new-spec.sh`). If they name an existing spec (e.g., `002`), open that bundle.
2. Work the bundle in order:
   - `spec.md`: user story, Given/When/Then scenarios, EARS acceptance criteria (`WHEN [trigger], THE SYSTEM SHALL [observable behavior]`), requirements, out of scope. Keep it 1-3 pages.
   - `plan.md`: technical approach consistent with the spec — every requirement covered, nothing outside scope.
   - `tasks.md`: checklist tasks, test tasks before implementation tasks (TDD).
   - `history.md`: record every scope/requirement change with date.
3. Quality bar (see `docs/en/12-tdd-and-bdd-how-to-write-specs.md`): no vague words without measurable values; every criterion maps to at least one test task.
4. If the spec is ready, ask the user to approve it and record the approval (status, date, approver, evidence) in `spec.md`. Always copy the spec body from `specs/_template/spec.md` — it carries the approval block the gate requires.
5. Update `specs/INDEX.md` (status/priority/date) and point to the `sdd-gate` prompt as the next step.

Hard stop: no implementation here. One active spec at a time.

Canonical source: `.claude/commands/sdd/spec.md` — keep both in sync.
