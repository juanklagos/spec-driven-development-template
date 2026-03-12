# Supported Artificial Intelligence agents and recommended prompts

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

> [!TIP]
> **Recommended start (low friction):** you do not need to clone this repository if you are already working inside a project.
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


This guide is based on official GitHub Spec Kit documentation.

Official source:

- https://github.com/github/spec-kit

## 1) Agent table supported by GitHub Spec Kit

In <kbd>specify init --ai</kbd>, Spec Kit supports the following agents:

| Agent | `--ai` identifier | Status |
|---|---|---|
| Antigravity | `agy` | Supported |
| Amp | `amp` | Supported |
| Auggie | `auggie` | Supported |
| Bob (IBM) | `bob` | Supported |
| Claude Code | `claude` | Supported |
| CodeBuddy | `codebuddy` | Supported |
| Codex | `codex` | Supported |
| GitHub Copilot | `copilot` | Supported |
| Cursor | `cursor-agent` | Supported |
| Gemini | `gemini` | Supported |
| Kilo Code | `kilocode` | Supported |
| Kimi Code | `kimi` | Supported |
| Kiro CLI | `kiro-cli` (alias `kiro`) | Supported |
| OpenCode | `opencode` | Supported |
| Qoder CLI | `qodercli` | Supported |
| Qwen Code | `qwen` | Supported |
| Roo Code | `roo` | Supported |
| SHAI (OVHcloud) | `shai` | Supported |
| Tabnine CLI | `tabnine` | Supported |
| Mistral Vibe | `vibe` | Supported |
| Windsurf | `windsurf` | Supported |
| Generic (unlisted agent) | `generic` | Supported with `--ai-commands-dir` |

## 2) Recommended flow for any agent

1. <kbd>/speckit.constitution</kbd>
2. <kbd>/speckit.specify</kbd>
3. <kbd>/speckit.plan</kbd>
4. <kbd>/speckit.tasks</kbd>
5. <kbd>/speckit.implement</kbd>

## 3) Master kickoff prompt (copy and paste)

"""
Work under this repository structure: `idea/`, `specs/`, `bitacora/`.

Before making changes, read in this order:
1) `idea/IDEA_GENERAL.md`
2) `specs/INDEX.md`
3) latest file in `bitacora/handoffs/` (if any)

Mandatory rules:
- Do not implement without an active specification.
- Use GitHub Spec Kit in this order: constitution, specify, plan, tasks, implement.
- Keep traceability in `bitacora/` when closing the session.

Mandatory response format:
1) Session goal
2) Active specification
3) Immediate plan (short steps)
4) Changes made
5) Validation
6) Exact next step
"""

## 4) Prompt for consistent specification authoring

"""
Create or update a numbered specification in `specs/NNN-name/` with these files:
- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `contracts/` when needed

Conditions:
- Clear language for beginners and professionals.
- No unexplained abbreviations.
- Every acceptance criterion must be verifiable.
- Tasks must be concrete and executable.
"""

## 5) Prompt for consistent implementation

"""
Implement only what is defined in the active specification.

Before implementing:
- Summarize acceptance criteria.
- Mention risks.

During implementation:
- Keep changes minimal and traceable.
- Avoid out-of-scope changes.

At the end:
- Record results in `bitacora/global/PROJECT_LOG.md`.
- Update `bitacora/diaria/YYYY-MM-DD.md`.
- Create a handoff if pending work remains.
"""

## 6) Unified output contract (for any agent)

Always request this output structure:

1. Summary
2. Updated specification
3. Files changed
4. Validations executed
5. Open risks
6. Next step

This contract reduces tool differences and keeps outcomes consistent.


## 7) Playbooks by level

### <img src="https://img.shields.io/badge/🟢_Beginner-238636?style=flat-square" alt="Beginner">

```text
Explain step by step as if I am new to programming.
Ask short questions.
Help me complete the idea and then create spec 001.
Do not move to the next step until I confirm understanding.
```

### <img src="https://img.shields.io/badge/🟡_Intermediate-D29922?style=flat-square" alt="Intermediate">

```text
Work on one active specification.
Prioritize scope clarity, executable tasks, and complete logbook updates.
Separate changes into: idea, spec, plan, tasks, and validation.
```

### <img src="https://img.shields.io/badge/🔴_Advanced-DA3633?style=flat-square" alt="Advanced">

```text
Apply unified output contract and refinement protocol.
If scope changes, block implementation until history.md and INDEX are updated.
Return risk analysis and exact next step.
```
