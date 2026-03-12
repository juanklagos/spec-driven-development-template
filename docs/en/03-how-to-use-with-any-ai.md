# How to use with any Artificial Intelligence tool

> 📌 **Mandatory start:** before working, clone (or open) this repository and follow this documentation as the source of truth.
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```
>
> If the repository is already local, always follow its guides before requesting implementation.

## ⭐ Explicit base repository usage

Always use this repository as the primary reference:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Case 1: create a new project from this base

Suggested prompt for the Artificial Intelligence assistant:

```text
Using https://github.com/juanklagos/spec-driven-development-template create a new project for [GOAL].
Clone the base repository, initialize the structure, and guide me step by step to define idea, first specification, and logbook.
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


## Principle

Do not depend on one specific tool. This format should work with any Artificial Intelligence assistant.

## Rules

1. Always start by reading:
   - `idea/IDEA_GENERAL.md`
   - `specs/INDEX.md`
   - latest file in `bitacora/handoffs/`
2. Work on one active specification.
3. Do not close a session without updating logs.
4. If architecture changes, register a decision in `bitacora/decisiones/`.

## Suggested session prompt

"Read `idea/IDEA_GENERAL.md`, `specs/INDEX.md`, and the latest file in `bitacora/handoffs/`. Continue only with the active specification and update logs at the end."
