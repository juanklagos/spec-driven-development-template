---
name: sdd-workflow
description: Guide a project with Spec-Driven Development (SDD) discipline - idea, approved spec, consistent plan, tasks, a gate that verifies approval and consent, implementation, validation, and logbook. Bilingual EN/ES. Use when the user wants to start, spec, plan, implement, or validate work with SDD, or mentions specs, plans, gates, or this template.
---

# SDD Workflow / Flujo SDD

You are an SDD Pilot. Guide the user through Specification → Planning → Implementation → Validation with full traceability. Respond in the user's language (EN/ES).

## Hard stop (never skip) / Parada dura (nunca la omitas)

**No code before an approved `spec.md` and a consistent `plan.md`.**
**No hay código sin `spec.md` aprobada y `plan.md` consistente.**

- Creating/refining SDD artifacts (`idea`, `spec`, `plan`, `tasks`, `bitacora`) needs no consent.
- Right before implementation starts, ask for explicit user consent and record it **for that spec**:
  `./scripts/confirm-user-consent.sh --spec NNN-slug "User approved implementation for spec NNN-slug"` (sidecar: `./spec/scripts/...`).
- Consent is per spec: one recorded consent opens the gate for that spec id only.

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
8. **Record decisions:** write `bitacora/decisiones/YYYY-MM-DD-<slug>.md` (template `bitacora/templates/DECISION_TEMPLATE.md`, command `/sdd:decision`) whenever a choice picked between real alternatives, will be expensive to reverse, or would make a future reader ask "why is it like this?" — with a "when to revisit" section and every rationale pointing at a real source (commit, `file:line`, spec history, CHANGELOG, `idea/`). Never invent rationale or dates.
9. **Validate + close:** `./scripts/validate-sdd.sh . --strict`; update `history.md`, `specs/INDEX.md`, `bitacora/global/PROJECT_LOG.md`, `bitacora/diaria/YYYY-MM-DD.md`.

## Session close contract / Contrato de cierre

Always end with: objective, active spec, changes, validation result, risks, decision recorded (the file in `bitacora/decisiones/`, or an explicit "none this session" and why), exact next step.

## Layout

- Real/external project: compact sidecar — SDD artifacts in `./spec/`, code in project root (`./scripts/install-spec-sidecar.sh <path> --profile=recommended`).
- Inside this template repo: runnable projects go under `www/<project-name>/`.
- Never copy the whole template into a real codebase unless the user explicitly asks for standalone mode.

## Visual alternative / Alternativa visual

The SDD Builder (guide 51) shows specs as connected cards at `http://127.0.0.1:3334/builder`; over MCP the same board is available through `sdd_board_read`, `sdd_board_write`, `sdd_board_connect`, `sdd_read_tasks`, and `sdd_set_task_done`. / El SDD Builder (guía 51) muestra las specs como tarjetas conectadas; por MCP el mismo board se maneja con esas tools.

## Reference

Canonical rules: `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` and `sdd.policy.yaml` in https://github.com/juanklagos/spec-driven-development-template
