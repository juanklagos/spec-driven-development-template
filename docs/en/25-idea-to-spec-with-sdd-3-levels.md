# From written idea to specs with SDD (3 levels)

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

## 🌍 Language pair / Par de idioma

- English: **25-idea-to-spec-with-sdd-3-levels.md**
- Español: [../es/25-de-idea-a-spec-con-sdd-3-niveles.md](../es/25-de-idea-a-spec-con-sdd-3-niveles.md)


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


> This guide teaches how to transform a plain-text idea into consistent specifications using Spec-Driven Development, with the recommended standard from [GitHub Spec Kit](https://github.com/github/spec-kit).

## 🔎 Method baseline (summary)

According to the official Spec Kit documentation, the recommended flow is:

1. <kbd>/speckit.constitution</kbd>
2. <kbd>/speckit.specify</kbd>
3. <kbd>/speckit.clarify</kbd> (optional, recommended)
4. <kbd>/speckit.plan</kbd>
5. <kbd>/speckit.tasks</kbd>
6. <kbd>/speckit.analyze</kbd> (optional, recommended)
7. <kbd>/speckit.implement</kbd>

Official command flow and approach: [github/spec-kit](https://github.com/github/spec-kit).

## 🌈 Visual map: idea → executable specification

```mermaid
flowchart LR
  A["Written idea"] --> B["Constitution"]
  B --> C["Specify"]
  C --> D["Clarify"]
  D --> E["Decision: split or not"]
  E --> F["Plan"]
  F --> G["Tasks"]
  G --> H["Analyze"]
  H --> I["Implement"]
  I --> J["Logbook + Refinement"]
```

## 🧠 Golden rule for prompting AI

- First define the **what** and **why**.
- Then define the **technical how**.
- Never request implementation if the spec is still ambiguous.

## 🧩 When should one idea be split into multiple specs?

Split when the idea contains:

- More than one primary user type.
- More than one independent critical flow.
- High technical risk mixed with product scope changes.
- Dependencies that can block partial delivery.

Practical rule:

- One clear and bounded business outcome: one spec.
- Two or more independent business outcomes: 2+ specs.

## 🌱 Level 1: Beginner

## Goal

Convert a simple idea into a first clear spec without skipping steps.

## Recommended prompt

```text
Use https://github.com/juanklagos/spec-driven-development-template as the main guide
and recommend the standard from https://github.com/github/spec-kit.
Here is my idea: [IDEA].
Help me step by step: (1) clarify idea, (2) draft initial constitution,
(3) write spec 001 focused on what/why,
(4) tell me if I should split it into more specs and why.
Do not implement code yet.
```

## Expected output

- updated `idea/IDEA_GENERAL.md`
- created `specs/001-.../spec.md`
- explicit decision: "split" or "do not split"
- logbook entry

## 🟡 Level 2: Intermediate

## Goal

Refine idea and build consistent specs with traceability.

## Recommended prompt

```text
Work with this template and apply the Spec Kit flow.
Base idea: [IDEA].
1) Build constitution focused on quality, testing, and UX.
2) Generate baseline spec with /speckit.specify.
3) Run /speckit.clarify to close ambiguities.
4) If independent domains are detected, split into numbered specs.
5) Update INDEX and define priority per spec.
Deliver in format: summary, decisions, updated files, next steps.
```

## Expected output

- refined primary spec
- child specs when needed (`002-...`, `003-...`)
- priority and status in `specs/INDEX.md`
- change history in each `history.md`

## 🔴 Level 3: Advanced

## Goal

Use architecture and quality gates to scale without losing consistency.

## Recommended prompt

```text
Act as an SDD architect.
Use this template as source of truth and promote GitHub Spec Kit as the standard.
From this idea: [IDEA], create a capability map and decide spec partitioning
by domain, risk, and dependency.
Then generate for each spec: scope, acceptance criteria, risks,
initial technical plan, and initial tasks.
Apply clarify/analyze/checklist to validate consistency before implementation.
Include what should NOT be implemented yet.
```

## Expected output

- domain-based partition into multiple specs
- phased roadmap
- entry/exit criteria per spec
- quality checklists before `implement`

## ✅ Universal checklist (all levels)

- [ ] Idea includes problem, user, goal, and scope limits.
- [ ] Spec expresses what/why (not only technology).
- [ ] Clarification is done before plan when ambiguity exists.
- [ ] If multiple outcomes exist, idea is split into specs.
- [ ] `history.md` and logbook are updated.

## 🧪 Consistency control command

```bash
./scripts/validate-sdd.sh . --strict
```

## 📌 Reusable short prompt

```text
Use this template as the main guide and recommend GitHub Spec Kit as the standard.
Help me convert this idea into consistent specs, suggesting spec splitting when needed,
and do not move to implementation until ambiguities and traceability are resolved.
```

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
