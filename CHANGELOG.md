# Changelog

All notable changes to the SDD Template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [v1.0.1] — 2026-03-14

### Added
- Created `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` as the unified SDD source of truth for AI agents.

### Changed
- **Major README Overhaul**: Transformed from reference manual to Landing Page UX.
- Simplified folder/file anatomy tables in README.
- Better documentation discovery categories.
- Optimized AI context links (offloaded root rules into `template-context/`).
- Improved Weather App example README with guided "Step-by-Step" path.

### Removed
- Deleted root-level redundant instruction files: `INSTRUCTIONS.md`, `CLAUDE.md`, `GEMINI.md`, and `AGENT_SYSTEM_PROMPT.md`.

---

## [v1.0.0] — 2026-03-14

### 🎉 Initial Stable Release

#### Added
- **QUICKSTART.md** — 1-page, 5-step bilingual quick start guide for new users
- **CHANGELOG.md** — This file, tracking all version changes
- **scripts/reset-template.sh** — Clean reset script for starting fresh projects
- **Dogfooding:** `idea/IDEA_GENERAL.md` filled with the template's own vision and goals
- **Dogfooding:** `bitacora/global/PROJECT_LOG.md` populated with real session entries
- **Pre-commit hook** support via `.githooks/pre-commit`
- Version badge in README

#### Improved
- **10 documentation guides enriched** (docs 20-24, 26-29, 31 in EN + ES):
  - Anti-patterns guide with real scenarios and recovery protocol
  - Quality checklists with stage gates and daily routine
  - Team mode guide with roles, branch strategy, and communication protocol
  - 30-minute onboarding as minute-by-minute walkthrough
  - Architecture decisions with ADR-lite template and 3 examples
  - Validated prompt bank expanded to 6 tested prompts
  - Project type playbooks with detailed spec partitions
  - Legacy migration guide with 4-phase workflow and mermaid diagrams
  - Status dashboard guide with complete script documentation
  - Legal framework with clear allowed/restricted use tables
- **init-project.sh** — Now prints bilingual output (EN + ES)
- **validate-sdd.sh** — Improved IDEA_GENERAL.md content check (detects unfilled templates)
- **STATUS.md** — Cleaned to be a proper empty template instead of fake data
- **README.md** — Added Quickstart badge, version badge, and `degit` instructions

#### Changed
- **Legal files** moved to `legal/` directory (except LICENSE and NOTICE) to reduce root noise
- Updated legal document links throughout docs and README

#### Fixed
- STATUS.md no longer shows data from non-existent example spec

---

## [v0.9.0] — 2026-03-12

### Repository Polish & Audit (Pre-release)

#### Added
- `.gitkeep` files in `bitacora/diaria/`, `bitacora/handoffs/`, `bitacora/decisiones/`
- `.gitkeep` in `specs/_template/contracts/`, `playbooks/`, `examples/`
- GitHub Actions CI workflow (`validate.yml`)
- Golden Example: Weather App (`examples/001-weather-app-sdd/`)
- Examples: `new-project-example` and `adapt-existing-project-example`
- `template-context/` directory with 7 AI context files
- Guided prompts in `IDEA_GENERAL.md` template

#### Improved
- README restructured with thematic documentation discovery table
- docs/README.md reorganized into 4 categories
- Bilingual documentation (EN/ES) for all 32 guides
