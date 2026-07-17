---
mode: agent
description: Start a project with SDD - capture the idea and prepare the first spec (mirror of /sdd:new for Claude Code)
---

Guide the user from zero to a first spec ready for approval, using the SDD template rules in `AGENTS.md` and `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`. Respond in the user's language (EN/ES). Ask ONE short question at a time; no jargon.

1. Ask for the project in plain language, then run a short discovery interview (one question at a time): problem and goal, MVP scope (in/out), constraints (deadline, must/can't-use tech, existing systems), stack only if the user has one in mind, edge cases and risks. Summarize back in 5 bullets and get a "yes" before writing anything.
2. Layout: existing/external project → `./scripts/install-spec-sidecar.sh <path> --profile=recommended` (SDD in `./spec/`, code in root); project inside this repo → `./scripts/create-www-project.sh <name> <agent>`.
3. Fill `idea/IDEA_GENERAL.md`; create the bundle with `./scripts/new-spec.sh "<feature>" "<owner>"`.
4. Draft `spec.md`: user story, Given/When/Then scenarios, EARS acceptance criteria (`WHEN [trigger], THE SYSTEM SHALL [behavior]`), out of scope.
5. Ask the user to approve the spec and record the approval in its approval section.

Hard stop: no project code in this flow. No code before approved `spec.md` and consistent `plan.md`.

Canonical source: `.claude/commands/sdd/new.md` — keep both in sync.
