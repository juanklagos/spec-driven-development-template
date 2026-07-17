<div align="center">
  <h1>🌱 Spec-Driven Development Template</h1>
  <p><b>Learn Spec-Driven Development (SDD) and apply it to real projects — with AI as your co-pilot and GitHub Spec Kit as the base workflow.</b></p>

  <p>
    <a href="./README.md"><img src="https://img.shields.io/badge/🇺🇸_English-Active-blue?style=for-the-badge" alt="English"></a>
    <a href="./README.es.md"><img src="https://img.shields.io/badge/🇪🇸_Español-Read-green?style=for-the-badge" alt="Español"></a>
  </p>

  <p>
    <img src="https://img.shields.io/badge/version-v1.4.1-blue?style=for-the-badge" alt="Version">
    <a href="./START_HERE_NON_TECH.md"><img src="https://img.shields.io/badge/🧑‍💼_NON--TECH-Start-green?style=for-the-badge" alt="Non Technical Start"></a>
    <a href="./AI_START_HERE.md"><img src="https://img.shields.io/badge/🤖_AI_START-Open-purple?style=for-the-badge" alt="AI Start"></a>
    <a href="./QUICKSTART.md"><img src="https://img.shields.io/badge/🚀_QUICKSTART-5_Minutes-ff6b35?style=for-the-badge" alt="Quickstart"></a>
    <a href="https://codespaces.new/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/⚡_Codespaces-Open-181717?style=for-the-badge&logo=github" alt="Open in GitHub Codespaces"></a>
  </p>
</div>

![Social Preview](./docs/assets/social-preview.svg)

---

## 🌟 What is this?

**Spec-Driven Development (SDD)** means writing and approving a clear specification *before* any code is written — so decisions, scope, and quality survive beyond a chat window. In 2026 it is the dominant practice for building software with AI agents.

This repository is **two things at once**:

1. **A school** — a bilingual (EN/ES), level-based path to learn SDD from zero, even if you don't program.
2. **A toolkit** — a ready-to-use structure to apply SDD in real projects: enforcement scripts, AI agent rules, a local MCP server, and a compact `spec/` sidecar for existing codebases.

It uses [GitHub Spec Kit](https://github.com/github/spec-kit) as the reference workflow engine; this repo is the practical layer around it (starter structure, guidance, rules, and validation).

| ❌ Without SDD | ✅ With this template |
| :--- | :--- |
| Decisions lost in chat history | Single source of truth in `specs/` |
| Code created without planning | Mandatory `spec.md` + `plan.md` gate, machine-checked |
| Hard onboarding for teams/AI | Standard structure and level-based guides |
| Weak traceability | Session logs in `bitacora/`, history per spec |

> 🔭 Want the industry map? Read [SDD in 2026: state of the art and how this template compares](./docs/en/50-sdd-state-of-the-art-2026.md).

## 🚪 Choose your door

Three entry points, one for each kind of visitor:

| You are... | Start here | What you get |
| :--- | :--- | :--- |
| 🧑‍💼 **Non-technical** (founder, PM, curious) | [START_HERE_NON_TECH.md](./START_HERE_NON_TECH.md) | Ultra-simple guided start, no jargon |
| 👩‍💻 **Developer** | [QUICKSTART.md](./QUICKSTART.md) | Commands to scaffold and validate in 5 minutes |
| 🤖 **AI agent** (or you, pasting into one) | [AI_START_HERE.md](./AI_START_HERE.md) | Operating rules + copy/paste prompts by level |

Then pick your learning level:

- Beginner: [docs/en/13-quick-guide-non-programmers.md](./docs/en/13-quick-guide-non-programmers.md)
- Intermediate: [docs/en/14-intermediate-guide.md](./docs/en/14-intermediate-guide.md)
- Advanced: [docs/en/15-advanced-guide.md](./docs/en/15-advanced-guide.md)

## ⚡ Start in 30 seconds

Copy/paste this prompt into your AI assistant (Claude, Cursor, Copilot, Gemini...):

```text
Using https://github.com/juanklagos/spec-driven-development-template, guide me step by step with SDD for my project.
My project is: [describe your project in plain language].
If my project is new, initialize from this template and GitHub Spec Kit as the base workflow.
If it already exists, adapt it without breaking current behavior.
No code before approved spec and consistent plan.
```

## 🎛️ Built-in commands for your AI agent

If you use **Claude Code**, this repo ships slash commands out of the box — start with `/sdd:help`:

| Command | What it does |
| :--- | :--- |
| `/sdd:help` | Diagnoses your current stage and gives the single next step |
| `/sdd:new` | Guided start: idea → first spec ready for approval |
| `/sdd:spec` | Create or refine a spec bundle with EARS criteria |
| `/sdd:gate` | Runs the machine-checked gate and records your consent |
| `/sdd:close` | Validates and closes the session with the output contract |
| `/sdd:tutor` | Conversational SDD course by levels, graded by the real validation scripts |

**Install in any project as a plugin** (no cloning):

```text
/plugin marketplace add juanklagos/spec-driven-development-template
/plugin install sdd@sdd-template
```

- **VS Code / Copilot:** the same flows as prompt files in [`.github/prompts/`](./.github/prompts/).
- **Any agent (32+ tools):** portable Agent Skill at [skills/sdd-workflow/SKILL.md](./skills/sdd-workflow/SKILL.md).
- **AI context:** [llms.txt](./llms.txt) indexes all docs for coding agents (regenerate with `./scripts/generate-llms-txt.sh`).

## 🚨 The golden rule

> **No code before an approved `spec.md` and a consistent `plan.md`.**

This is not just prose — it is machine-checked:

```bash
./scripts/check-sdd-policy.sh .   # multi-agent policy files are aligned
./scripts/check-sdd-gate.sh .     # spec approved + plan consistent + consent recorded
```

Before implementation starts, explicit user consent is recorded:

```bash
./scripts/confirm-user-consent.sh "User approved scope X"
```

(In sidecar projects the same scripts live under `./spec/scripts/`.)

Enforce it in CI too — this repo doubles as a GitHub Action:

```yaml
- uses: juanklagos/spec-driven-development-template@main
  with:
    path: "."      # project root (sidecar or standalone auto-detected)
    strict: "true"
```

Reference files: [sdd.policy.yaml](./sdd.policy.yaml) · [INSTRUCTIONS.md](./INSTRUCTIONS.md) · [AGENT_OPERATING_SYSTEM.md](./template-context/core-instructions/AGENT_OPERATING_SYSTEM.md)

## 🎬 How it works

```mermaid
flowchart LR
  A["Idea in plain language"] --> B["spec.md approved"]
  B --> C["plan.md consistent"]
  C --> D["tasks.md prioritized"]
  D --> E["Gate + explicit consent"]
  E --> F["Implementation"]
  F --> G["Validation + logbook"]
```

Every feature gets a numbered spec bundle:

1. `spec.md` — what and why (approved by you)
2. `plan.md` — how (consistent with the spec)
3. `tasks.md` — concrete steps
4. `history.md` — how it evolved

And every session leaves a trace in `bitacora/` (logbook): decisions, handoffs, next step.

Full walkthrough example: [examples/002-mcp-end-to-end](./examples/002-mcp-end-to-end/README.md)

## 🧭 Apply it to a real project

Three ways to use the template, from lightest to heaviest:

| Mode | When | Command |
| :--- | :--- | :--- |
| **Compact `spec/` sidecar** (recommended) | Real or existing project: SDD artifacts in `./spec/`, code stays in your project root | `./scripts/install-spec-sidecar.sh /path/to/project --profile=recommended` |
| **Internal workspace `www/`** | The runnable project should live inside this template repo | `./scripts/create-www-project.sh my-project codex` |
| **Full standalone copy** | You explicitly want the whole framework as your workspace | `./scripts/init-project.sh /path/to/project --profile=full` |

> [!TIP]
> Default professional path: install only the compact `spec/` sidecar. Never copy the full framework into a real codebase unless you explicitly want standalone mode.

Everyday commands (sidecar mode shown; same scripts exist at root in standalone mode):

| Action | Command |
| :--- | :--- |
| New spec | `./spec/scripts/new-spec.sh "my-feature" "Owner"` |
| Validate structure | `./spec/scripts/validate-sdd.sh . --strict` |
| Policy check | `./spec/scripts/check-sdd-policy.sh .` |
| SDD gate | `./spec/scripts/check-sdd-gate.sh .` |
| Status dashboard | `./spec/scripts/generate-status.sh` |

Folder anatomy, project map and layout details: [docs/en/42-project-organization-map.md](./docs/en/42-project-organization-map.md)

```mermaid
flowchart TD
  A["Your project root (code)"] --> B["spec/"]
  B --> C["idea/"]
  B --> D["specs/ (numbered bundles)"]
  B --> E["bitacora/ (logbook)"]
  B --> F["scripts/ (gate + validation)"]
```

## 🔌 Connect via MCP (optional, advanced)

If your AI client supports MCP, this repo ships a local `sdd-mcp` server so the SDD workflow becomes guided commands (`/start-project`, `/create-spec ...`).

```bash
npm install
npm run build
npm run mcp:start
```

- Easiest explanation first: [Easy MCP Guide](./docs/en/43-easy-mcp-guide.md)
- Client configs: [`.mcp.json`](./.mcp.json) (Claude Code) · [Cursor](./packages/sdd-mcp/examples/.cursor/mcp.json) · [Codex](./packages/sdd-mcp/examples/codex.config.toml)
- Complete reference: [docs/en/41-complete-mcp-reference.md](./docs/en/41-complete-mcp-reference.md)

Note: `GitMCP` (free, remote) helps an AI *read* this public repo; the local `sdd-mcp` runs the *real guided workflow*. They complement each other: [GitMCP guide](./docs/en/48-how-to-connect-this-repo-with-gitmcp.md).

## 📚 Documentation

**Three essential reads:**

1. [Workflow](./docs/en/02-workflow.md) — the SDD flow step by step
2. [Structure](./docs/en/01-structure.md) — what each folder is for
3. [SDD in 2026: state of the art](./docs/en/50-sdd-state-of-the-art-2026.md) — the industry map and where this template stands

**Everything else:** the [full documentation index](./docs/README.md) organizes all 51 guides (EN/ES) by topic: learning path, prompts, MCP, quality, team mode, legacy migration, legal.

## ⚖️ Legal & authorship

- License: PolyForm Noncommercial 1.0.0 — [legal guide](./docs/en/31-legal-framework-and-commercial-use.md)
- Changelog: [CHANGELOG.md](./CHANGELOG.md)
- Author: Juan Klagos ([AUTHORS.md](./AUTHORS.md))
