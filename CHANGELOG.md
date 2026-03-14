# Changelog

All notable changes to the SDD Template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [v1.0.1] — 2026-03-14

### Added
- `scripts/check-sdd-gate.sh` to enforce SDD implementation gate checks before coding.
- `template-context/09-SPECKIT-STANDARDIZATION-PLAN.md` with phased roadmap to evolve into a Spec Kit-centered framework.

### Changed
- **Spec Kit-first workflow standardization** across scripts and docs.
- `scripts/init-project-with-spec-kit.sh` now prioritizes `specify`, then `uv tool install`, then `uvx`.
- `scripts/init-project.sh` now propagates AI rule files, template context, and `check-sdd-gate.sh` into initialized projects.
- CI workflow now validates canonical AI rule assets and runs both:
  - `./scripts/validate-sdd.sh . --strict`
  - `./scripts/check-sdd-gate.sh .`
- AI rules now use `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` as canonical source.
- Updated onboarding docs (`README.md`, `AGENTS.md`, `AI_START_HERE.md`, `QUICKSTART.md`, Spec Kit integration docs EN/ES) to include SDD gate and Spec Kit-first flow.
- Updated templates:
  - `specs/_template/spec.md` approval status fields clarified.
  - `specs/_template/plan.md` now includes dependencies, milestones, and risks sections.

### Removed
- References to deprecated root-level instruction files in active rule paths.

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
