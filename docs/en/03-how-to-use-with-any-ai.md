# How to use with any Artificial Intelligence tool

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

## 🌍 Language pair / Par de idioma

- English: **03-how-to-use-with-any-ai.md**
- Español: [../es/03-como-usar-con-cualquier-inteligencia-artificial.md](../es/03-como-usar-con-cualquier-inteligencia-artificial.md)


## 🗣️ Friendly prompt (copy/paste)

Use this when you are not technical and want the AI to do setup + guidance end-to-end:

```text
Using https://github.com/juanklagos/spec-driven-development-template, create everything needed to carry out my project end-to-end.
My project is: [describe your project in plain language].

If my project is new, initialize it with this template and GitHub Spec Kit.
If my project already exists, adapt it to idea/specs/bitacora without breaking current behavior.
Guide me step by step for my level (beginner/intermediate/advanced), using simple language.
Do not skip specification, plan, tasks, refinement trace, logbook, and validation.
```


> [!TIP]
> For startup instructions and prompts, use:
> - [`AI_START_HERE.md`](../../AI_START_HERE.md)
> - [Prompt matrix](./19-prompt-matrix-by-goal.md)
> - [Validated prompt bank](./26-validated-prompt-bank.md)



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

## 💡 Quick tips

- Start from a simple one-paragraph project description.
- Ask the AI to confirm the active spec before coding.
- Close every session with validation and a clear next step.

## 📊 Visual flow

```mermaid
flowchart LR
  A["Project idea"] --> B["Spec approved"]
  B --> C["Plan aligned"]
  C --> D["Tasks prioritized"]
  D --> E["Implementation"]
  E --> F["Validation + Logbook"]
```
