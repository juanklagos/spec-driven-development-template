# 🧪 TDD and BDD: how to write strong specifications

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


This section is a repository bonus to connect specification-first development with quality practices.

## 1) Simple difference between TDD and BDD

| Approach | Meaning | Main question | Expected output |
|---|---|---|---|
| TDD | Test-Driven Development | How do we validate technical behavior? | Tests that drive implementation |
| BDD | Behavior-Driven Development | How should the system behave for users? | Clear business scenarios |

## 2) Relation with this template

- `spec.md` defines expected behavior (strong BDD alignment).
- `tasks.md` can include explicit technical test tasks (strong TDD alignment).
- `contracts/` provides verifiable rules for both.

## 3) How to write a strong spec for TDD

### Recommended structure

1. In `spec.md`, define precise, measurable rules.
2. In `plan.md`, define technical test strategy.
3. In `tasks.md`, include test tasks before implementation tasks.

### TDD checklist

- [ ] Every requirement has a technical validation.
- [ ] Test tasks are explicit and executable.
- [ ] Failure criteria are clear before implementation.
- [ ] Test results are logged in the logbook.

## 4) How to write a strong spec for BDD

### Recommended structure

1. In `spec.md`, write scenarios using:
   - Given
   - When
   - Then
2. Describe observable behavior, not internal code details.
3. Use language understandable by business and technical audiences.

### BDD checklist

- [ ] Scenarios are clear and verifiable.
- [ ] Language is unambiguous.
- [ ] Every scenario maps to a requirement.
- [ ] Behavior can be demonstrated in a functional review.

## 5) Quick scenario template

```text
Given [initial context]
When [action or event]
Then [expected result]
```

## 6) Recommended combined strategy (TDD + BDD)

1. Define behavior in `spec.md` (BDD).
2. Translate behavior into technical tasks in `tasks.md` (TDD).
3. Implement in short iterations.
4. Register findings and updates in `history.md` and `bitacora/`.

## 7) Common mistakes

- Writing vague specs without verifiable criteria.
- Mixing business scope and technical detail in one section.
- Not updating `history.md` when scenarios change.
- Implementing without confirming the spec is still current.
