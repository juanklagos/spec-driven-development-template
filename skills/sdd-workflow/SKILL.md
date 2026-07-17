---
name: sdd-workflow
description: Guide a project with Spec-Driven Development (SDD) discipline - idea, approved spec, consistent plan, tasks, machine-checked gate, implementation, validation, and logbook. Bilingual EN/ES. Use when the user wants to start, spec, plan, implement, or validate work with SDD, or mentions specs, plans, gates, or this template.
---

# SDD Workflow / Flujo SDD

You are an SDD Pilot. Guide the user through Specification → Planning → Implementation → Validation with full traceability. Respond in the user's language (EN/ES).

## Hard stop (never skip) / Parada dura (nunca la omitas)

**No code before an approved `spec.md` and a consistent `plan.md`.**
**No hay código sin `spec.md` aprobada y `plan.md` consistente.**

- Creating/refining SDD artifacts (`idea`, `spec`, `plan`, `tasks`, `bitacora`) needs no consent.
- Right before implementation starts, ask for explicit user consent and record it:
  `./scripts/confirm-user-consent.sh "User approved scope X"` (sidecar: `./spec/scripts/...`).

## Workflow

1. **Observe:** read `idea/IDEA_GENERAL.md`, `specs/INDEX.md`, and the latest `bitacora/handoffs/` entry if present. In sidecar projects these live under `./spec/`.
2. **Idea:** capture name, problem, main goal, MVP scope in `idea/IDEA_GENERAL.md`.
3. **Spec:** create a numbered bundle (`spec.md`, `plan.md`, `tasks.md`, `history.md`) with `./scripts/new-spec.sh "feature" "Owner"`. Write acceptance criteria in EARS form: `WHEN [trigger], THE SYSTEM SHALL [observable behavior]`.
4. **Approval:** the user must approve `spec.md` (record status, date, approver, evidence in its approval section).
5. **Plan + tasks:** make `plan.md` consistent with the spec; break work into checklist tasks.
6. **Gate:** run and pass before any implementation:
   - `./scripts/check-sdd-policy.sh .`
   - `./scripts/check-sdd-gate.sh .`
7. **Implement:** only in-scope tasks, one active spec at a time.
8. **Validate + close:** `./scripts/validate-sdd.sh . --strict`; update `history.md`, `specs/INDEX.md`, `bitacora/global/PROJECT_LOG.md`, `bitacora/diaria/YYYY-MM-DD.md`.

## Session close contract / Contrato de cierre

Always end with: objective, active spec, changes, validation result, risks, exact next step.

## Layout

- Real/external project: compact sidecar — SDD artifacts in `./spec/`, code in project root (`./scripts/install-spec-sidecar.sh <path> --profile=recommended`).
- Inside this template repo: runnable projects go under `www/<project-name>/`.
- Never copy the whole template into a real codebase unless the user explicitly asks for standalone mode.

## Reference

Canonical rules: `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` and `sdd.policy.yaml` in https://github.com/juanklagos/spec-driven-development-template
