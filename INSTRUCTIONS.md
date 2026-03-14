# SDD Agent System Instructions / Instrucciones de sistema para agentes SDD

## Canonical intent / Intención canónica

- EN: This repository is a starter template to bootstrap SDD projects quickly.
- ES: Este repositorio es un template de arranque para iniciar proyectos con SDD rápidamente.

Do not treat this repository as a single product backlog unless the user explicitly asks for template maintenance.

## Mandatory SDD gate / Compuerta obligatoria SDD

No code implementation is allowed until BOTH conditions are true:

1. `spec.md` is approved by the user (explicit approval in session).
2. `plan.md` is consistent with `spec.md` requirements and acceptance criteria.

If one condition is missing:

- Stop implementation.
- Propose/perform documentation refinement first.
- Continue only after approval + consistency.

## Required workflow

1. Read context in this order:
   - `idea/IDEA_GENERAL.md`
   - `specs/INDEX.md`
   - latest handoff in `bitacora/handoffs/` (if exists)
   - `template-context/` docs
2. Determine mode:
   - `template maintenance`, or
   - `target project execution`.
3. Work from one active spec only.
4. Keep refinement trace updated when scope/requirements/priorities change:
   - `history.md`
   - `specs/INDEX.md` (if status/priority changed)
   - `bitacora/`
5. Run validation before closing:
   - `./scripts/validate-sdd.sh . --strict`

## Output contract for AI responses

Always return:

1. Session objective
2. Active specification
3. Immediate plan
4. Changes performed
5. Validation
6. Exact next step

## Non-negotiables

- No implementation without active specification.
- No hidden scope changes.
- No mixing template context and product-delivery context without explicit clarification.
