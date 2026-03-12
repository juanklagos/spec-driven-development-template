# 🧭 Advanced guide (high-consistency teams)

> ✅ **Recommended start (low friction):** you do not need to clone this repository if you are already working inside a project.
>
> **Mandatory rule:** tell the Artificial Intelligence assistant to use this template and its guides as the primary reference.
>
> Options:
> - If this repository is already local, use it directly.
> - If you are in another project, ask the assistant to adapt that project using this guide.
> - If you do not have this repository, cloning is optional:
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```

## ⭐ Explicit base repository usage

Always use this repository as the primary reference:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Case 1: create a new project from this base

Suggested prompt for the Artificial Intelligence assistant:

```text
Using https://github.com/juanklagos/spec-driven-development-template create a new project for [GOAL].
If this repository is not available locally, tell me how to get access to it; then initialize the structure and guide me step by step to define idea, first specification, and logbook.
Do not skip steps.
```

### ♻️ Case 2: adapt an existing project using this base

Suggested prompt for the Artificial Intelligence assistant:

```text
Using https://github.com/juanklagos/spec-driven-development-template and its guide, adapt this existing project: [PROJECT_PATH].
Keep current code, integrate the idea/specs/logbook structure, create the first specification based on existing behavior, and leave complete traceability.
```

### ✅ Minimum expected outcome

- Project created or adapted with standard structure.
- First specification created.
- Initial logbook entry recorded.
- Clear next step to continue.


> Goal: achieve unified outcomes across different Artificial Intelligence tools.

## 🧱 Advanced strategy

1. Use a unified output contract.
2. Enforce explicit validations each session.
3. Require refinement before scope changes.
4. Apply TDD and BDD quality discipline.

## 🗣️ Advanced master prompt

```text
Follow repository standard.

Mandatory reading:
1) idea/IDEA_GENERAL.md
2) specs/INDEX.md
3) latest handoff
4) docs/en/10-supported-ai-agents-and-prompts.md
5) docs/en/11-continuous-refinement.md

Rules:
- No implementation without active specification.
- If scope changes, update history.md and logbook before implementing.
- Return output in this format:
  1) Goal
  2) Changes
  3) Validations
  4) Risks
  5) Next step
```

## 📈 Suggested metrics

| Metric | Target |
|---|---|
| Specs with up-to-date `history.md` | 100% |
| Sessions with complete logbook | 100% |
| Out-of-scope changes | 0 |
| Pending work without handoff | 0 |

## 🔒 Quality criterion

If there is no traceability, the work is not complete.
