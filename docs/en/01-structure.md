# Detailed structure

> [!TIP]
> For startup instructions and prompts, use:
> - [`AI_START_HERE.md`](../../AI_START_HERE.md)
> - [Prompt matrix](./19-prompt-matrix-by-goal.md)
> - [Validated prompt bank](./26-validated-prompt-bank.md)

## Friendly prompt (copy/paste)

```text
Using https://github.com/juanklagos/spec-driven-development-template, set up my project structure with idea/specs/bitacora and guide me in simple language.
My project is: [describe project].
If it is new, initialize everything.
If it already exists, adapt it without breaking current behavior.
```



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

## Optional folders (accelerators)

- `playbooks/`: project-type guides (SaaS, e-commerce, mobile app, backend API).
- `quality/`: evidence templates for testing and quality control.

These folders are optional. If they are not used, the base `idea/specs/bitacora` workflow remains valid.
