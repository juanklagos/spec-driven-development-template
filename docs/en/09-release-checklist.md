# Release checklist

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


Use this list before publishing on GitHub.

## Content validation

- [ ] `README.md` is clear and complete.
- [ ] `idea/` includes a usable project idea template.
- [ ] `specs/` includes rules, index, and templates.
- [ ] `bitacora/` includes structure and templates.
- [ ] At least one complete sample specification exists.

## GitHub Spec Kit integration

- [ ] Integration guide exists.
- [ ] Installation and initialization commands are documented.
- [ ] Recommended command flow is documented.
- [ ] Bootstrap script with Spec Kit exists.

## Community files

- [ ] `LICENSE`
- [ ] `CONTRIBUTING.md`
- [ ] `CODE_OF_CONDUCT.md`
- [ ] Issue and Pull Request templates

## Final checks

- [ ] New users can follow the guide without extra context.
- [ ] Scripts run correctly.
- [ ] Repository metadata is complete.
