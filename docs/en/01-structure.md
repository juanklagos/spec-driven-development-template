# Detailed structure

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


## idea

Path: `idea/`

Main file:

- `IDEA_GENERAL.md`: defines project problem, goal, scope, users, risks, and completion criteria.

## specs

Path: `specs/`

Main files:

- `INDEX.md`: list of all specifications.
- `README.md`: specification rules.
- `_template/`: template for new specifications.

Each specification lives in a numbered folder:

- `001-name`
- `002-name`
- `003-name`

## bitacora

Path: `bitacora/`

Subfolders:

- `global/`: overall project history.
- `diaria/`: daily session logs.
- `handoffs/`: handoff notes to resume work.
- `decisiones/`: key decisions.
- `templates/`: log templates.

## docs

Path: `docs/`

Contains educational documentation for this system.

## scripts

Path: `scripts/`

Contains scripts to initialize this structure in other repositories.
