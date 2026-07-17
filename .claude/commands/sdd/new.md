---
description: Start a project with SDD - capture the idea and prepare the first spec / Inicia un proyecto con SDD - captura la idea y prepara la primera spec
argument-hint: [project description in plain language]
---

Guide the user from zero to a first spec ready for approval. Respond in the user's language (EN/ES). Ask ONE short question at a time; no jargon.

1. If `$ARGUMENTS` is empty, ask for the project in plain language. Then run a short discovery interview — one question at a time, only what is missing:
   - Problem and main goal (who hurts today, what changes when this works?).
   - MVP scope: what is IN and what is explicitly OUT.
   - Constraints: deadline, budget, tech the user must/can't use, existing systems to respect.
   - Stack: only if the user has one in mind; otherwise propose later in `plan.md`, not here.
   - Edge cases and risks: "what's the worst realistic thing a user could do or expect?"
   Summarize the interview back in 5 bullets and get a "yes" before writing anything.
2. Decide the layout with the user:
   - Existing/external project → compact sidecar: `./scripts/install-spec-sidecar.sh <path> --profile=recommended` (SDD artifacts in `./spec/`, code stays in the project root).
   - Project living inside this template repo → `./scripts/create-www-project.sh <name> <agent>`.
3. Fill `idea/IDEA_GENERAL.md` (or `./spec/idea/IDEA_GENERAL.md`) with name, problem, goal, MVP scope.
4. Create the first spec bundle: `./scripts/new-spec.sh "<feature>" "<owner>"` (sidecar: `./spec/scripts/new-spec.sh`).
5. Draft `spec.md` with the user: user story, Given/When/Then scenarios, EARS acceptance criteria (`WHEN [trigger], THE SYSTEM SHALL [behavior]`), out of scope.
6. Ask the user to approve the spec; record status/date/approver/evidence in its approval section.
7. Close by pointing to `/sdd:gate` as the next step.

Hard stop: do NOT write project code in this command. Base creation needs no consent; implementation later will.
