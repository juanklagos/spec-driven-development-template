# Project log / Registro general del proyecto

## Entry format / Formato de entrada

> Copy the template below for each new session entry.
> Copia la plantilla a continuación para cada nueva entrada de sesión.

---

### [2026-03-14 08:30] Session 1 / Sesión 1 — Repository Audit & Polish
- **Goal / Objetivo:** Comprehensive audit of the SDD template to identify gaps and improve first-time user experience
- **Work completed / Trabajo realizado:**
  - Full repository structure analysis (13 dirs, 23 root files, 64 docs, 8 scripts)
  - Ran `validate-sdd.sh --strict` — passed with 0 errors
  - Created `QUICKSTART.md` (5-step bilingual quick start)
  - Filled `IDEA_GENERAL.md` with the template's own vision (dogfooding)
  - Filled this `PROJECT_LOG.md` with real entries
  - Cleaned `STATUS.md` to be a clean template
  - Consolidated and enriched 10 stub documents
  - Enhanced Weather App example as narrated tutorial
  - Created `CHANGELOG.md` with version `v1.0.0`
  - Created `scripts/reset-template.sh` for clean starts
  - Added pre-commit hook support
  - Moved legal files to `legal/` directory
  - Bilingualized `init-project.sh` output
  - Improved `validate-sdd.sh` IDEA_GENERAL.md content check
- **Decisions made / Decisiones tomadas:**
  - QUICKSTART.md is the new primary entry point for humans
  - AI_START_HERE.md remains the primary entry point for AI agents
  - Stub docs consolidated or enriched to minimum 1500 bytes useful content
  - Legal files moved to `legal/` to reduce root noise
- **Blockers / Bloqueos:** None
- **Next step / Próximo paso:** Publish v1.0.0, enable GitHub "Use this template" setting
- **Owner / Responsable:** Juan Klagos

---

### [2026-03-18 10:30] Session 2 / Sesión 2 — MCP Foundation MVP
- **Goal / Objetivo:** Convert the framework direction into a real MCP-ready architecture and MVP implementation
- **Work completed / Trabajo realizado:**
  - Approved spec `001-sdd-mcp-foundation` with user evidence from the current chat
  - Added `packages/sdd-core` and `packages/sdd-mcp`
  - Added root workspace TypeScript configuration
  - Implemented typed core operations for spec creation, validation, gate checks, and consent logging
  - Implemented first MCP stdio server with tools, resources, and prompts
  - Added MCP smoke test and bilingual server setup guides
  - Expanded MCP tools for roadmap, status, and logbook operations
  - Added client-facing setup examples for Claude Desktop, Cursor, and Codex Desktop
  - Added spec document resource templates and Streamable HTTP transport
  - Added dedicated smoke test for HTTP MCP connectivity
- **Decisions made / Decisiones tomadas:**
  - Repository root remains the canonical SDD framework
  - Productized path is `framework root + sdd-core + sdd-mcp`
  - MVP MCP is stdio-first and keeps compatibility with current shell scripts
- **Blockers / Bloqueos:** Pending dependency install and type verification against the selected MCP SDK version
- **Next step / Próximo paso:** Install dependencies, typecheck the packages, fix SDK API mismatches, and document local MCP setup
- **Next step / Próximo paso:** Add richer project-aware resources, tool output schemas, and client-specific installation docs with exact paths
- **Owner / Responsable:** Juan Klagos / Codex

---

### [2026-07-17 12:00] Session 3 / Sesión 3 — SDD 2026 research + repo reorganization
- **Goal / Objetivo:** Research the 2026 SDD state of the art, compare it with this template, and reorganize the repo for first-time visitors / Investigar el estado del arte SDD 2026, compararlo con el template y reorganizar el repo para visitantes nuevos
- **Work completed / Trabajo realizado:**
  - Added guide 50 (EN/ES): "SDD in 2026: state of the art and how this template compares" with sourced research (Spec Kit, Kiro, OpenSpec, BMAD, Tessl, Agent OS, Thoughtworks/martinfowler critiques, AGENTS.md standard)
  - Reorganized README (EN/ES): what-is-SDD first, three explained entry doors, simplified golden rule, MCP moved to optional advanced section, three essential reads
  - Rebuilt docs/README.md as a full thematic index of all 51 guides (EN/ES)
  - Fixed stale v1.4.0 strings (README badges, docs 35/37; doc 34 now generic v1.4.x)
  - Propagated sidecar-first guidance to AGENT_OPERATING_SYSTEM.md, 06-AI-RULES-MATRIX.md, and all 8 per-agent rule files (additive only; policy marker phrases intact)
  - Aligned QUICKSTART external route with sidecar model (install-spec-sidecar.sh)
  - Spec 001 marked Done in specs/INDEX.md (recorded in its history.md); STATUS.md regenerated; CHANGELOG [Unreleased] added
- **Decisions made / Decisiones tomadas:**
  - Template positioning confirmed: practical layer around GitHub Spec Kit, spec-anchored model, bilingual teaching + sidecar application
  - Launch kit copy uses generic v1.4.x to avoid re-staling on each release
- **Blockers / Bloqueos:** None
  - Follow-up same session: EARS section added to guide 12 (EN/ES) + EARS blocks in spec templates; guide 08 (EN/ES) updated to current Spec Kit command set (clarify/analyze/checklist/taskstoissues); optional commands reflected in AGENT_OPERATING_SYSTEM.md and AI_START_HERE.md; guide 50 short-term items marked done
  - Level 1 of the evolution proposals implemented under user-approved spec 002-interactive-onboarding: portable Agent Skill, /sdd:* slash commands, Copilot prompt files + scoped instructions, llms.txt + generator, devcontainer + Codespaces badge, VHS demo tape + CI workflow, README command section (EN/ES)
  - Level 2 implemented under user-approved spec 003-distribution-and-tutor: Claude Code plugin + marketplace, /sdd:tutor conversational course, reinforced /sdd:new interview, composite GitHub Action (action.yml), create-sdd-project npm scaffolder (prepared), demo workflow fixed (direct vhs install)
  - Level 3 implemented under user-approved spec 004-site-dashboard-community: Starlight docs site on GitHub Pages (EN/ES, 155 pages), /dashboard on sdd-mcp HTTP transport, Discussions + community section + tutor badges, MCP Registry server.json prepared
- **Next step / Próximo paso:** Medium-term items from guide 50: optional "spec properties" section in the spec template (bridge to executable specs) and a template-native tasks-to-issues flow for team mode
- **Owner / Responsable:** Juan Klagos / Claude

---

### [YYYY-MM-DD HH:MM] Session N / Sesión N
- **Goal / Objetivo:**
- **Work completed / Trabajo realizado:**
- **Decisions made / Decisiones tomadas:**
- **Blockers / Bloqueos:**
- **Next step / Próximo paso:**
- **Owner / Responsable:**
