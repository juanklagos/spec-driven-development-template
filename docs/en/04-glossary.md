# Glossary

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

## 🌍 Language pair / Par de idioma

- English: **04-glossary.md**
- Español: [../es/04-glosario.md](../es/04-glosario.md)

---

If a word in the documentation stops you, it is here. Ordered by how often it gets in the way, not alphabetically.

## The five that stop people most

### Spec

The document where you write **what** you are going to build and **how you will know it is right**, before writing code. It is a text file, not a form or a tool.

Each spec lives in its own numbered folder, `specs/001-checkout/`, with these files inside:

| File | What it holds |
| :--- | :--- |
| `spec.md` | what gets built and how it is checked |
| `plan.md` | how it will be built |
| `tasks.md` | the task list, with checkboxes |
| `history.md` | what changed in the spec, and when |
| `research.md` | what was looked into, and why this option won |

When the documentation says "spec bundle", it means that folder and its files.

### Gate

The check that decides whether you may write code yet. It is a script you run — not a person, and not a permission somebody grants you.

It opens only when **three** things are true for that spec:

1. the spec is approved (a line inside `spec.md` says so),
2. the plan matches what was approved,
3. your consent is recorded (a line in `.sdd/user-consent.log`).

If one is missing, the gate is closed and it tells you which one.

### Approval and consent

These are two separate acts, which is why there are two steps:

- **Approving** says "this spec describes what I want."
- **Consenting** says "start building it now."

You can approve today and consent next week. The gate requires both.

### The `spec/` folder (previously called "sidecar")

How you add this method to a project that **already has code**: one new folder called `spec/` appears next to what you have, and nothing else moves or gets renamed.

This is the normal choice for real work. The alternative — putting the whole project inside this template, under `www/` — only makes sense if you are starting from scratch in here.

Older documentation calls this a "sidecar". It means exactly this.

### MCP (Model Context Protocol)

A standard that lets your AI tool use external tools. Here it is what lets the AI **actually create and change** your project's files, instead of describing in chat what somebody should do.

In practice: you register this project with your assistant once, and from then on it has the SDD actions available (create a spec, check the gate, write to the logbook, and so on).

## The rest

### Workspace

The project folder being worked on. When a command asks for `--project-root` or the `SDD_PROJECT_ROOT` variable, that is exactly what it wants: where your project is.

### Logbook (`bitacora/`)

The record of what happened: decisions, handovers between sessions, notes for the day. It exists so that six months from now somebody — including you — understands why things are the way they are.

### Handoff

A file that writes down the state of the work so another person, or another AI session, can pick it up without asking everything again.

### EARS

A fixed way of writing acceptance criteria so they cannot be read two ways:

> **WHEN** [situation], **THE SYSTEM SHALL** [result you can observe].

The point is that a criterion written like this turns into a test almost by itself. Explained in full in [guide 12](./12-tdd-and-bdd-how-to-write-specs.md).

### Drift

The code changed **after** you approved the spec. Not an error by itself: a warning that what is written and what is built may no longer match.

### Task

A concrete line in `tasks.md`, with its checkbox. If it cannot be ticked, it is not a task — it is a wish.

### Contract

A checkable rule about how one part of the system must behave.

### Research

What you found out before deciding, and why one option won over another.

---

> [!TIP]
> To start: [`QUICKSTART.md`](../../QUICKSTART.md) if you are technical, or [`START_HERE_NON_TECH.md`](../../START_HERE_NON_TECH.md) if you are not.
