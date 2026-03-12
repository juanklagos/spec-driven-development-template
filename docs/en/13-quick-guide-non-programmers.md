# 🚀 Quick guide for non-programmers (5 minutes)

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


> Goal: start using this template even if you do not code.

## 🧠 Core idea

You do not need to write code first.
Define your idea clearly and ask the Artificial Intelligence assistant to guide each step.

## ✅ First steps

1. Open `idea/IDEA_GENERAL.md`
2. Write your project idea in simple language
3. Create `specs/001-my-first-spec/`
4. Copy files from `specs/_template/`
5. Ask the assistant to complete each section with you

## 🗣️ Ready-to-use prompt (start)

```text
Act as a beginner-friendly guide.
Help me complete idea/IDEA_GENERAL.md using simple language.
Do not assume missing information.
Ask one short question at a time.
At the end, summarize the idea clearly so I can continue with specs.
```

## 🗣️ Ready-to-use prompt (first spec)

```text
Based on idea/IDEA_GENERAL.md, create an initial specification in specs/001-my-first-spec/ with:
- spec.md
- plan.md
- tasks.md
- research.md
- history.md
Use clear language and avoid unexplained abbreviations.
```

## 🧪 Quick validation

| Question | If answer is Yes, you are on track ✅ |
|---|---|
| Do you understand what will be built? | Yes |
| Is there a clear task list? | Yes |
| Can you explain the idea to someone else? | Yes |

## 📌 Golden rule

If the idea changes, update documentation first, then implementation.
