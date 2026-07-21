# Fast Entry Flows / Flujos de entrada rápida

Two ways in: a project that does not exist yet, and a project that already does.

## Flow A: New project from this template

1. Confirm goal.
2. Create or select project folder.
3. Initialize `idea/`, `specs/`, `bitacora/` using this template.
4. Complete `idea/IDEA_GENERAL.md`.
5. Create `specs/001-.../` and update `specs/INDEX.md`.
6. Register first entry in `bitacora/global/PROJECT_LOG.md`.
7. Request and record explicit user consent only when implementation is about to start.
8. Validate with `./scripts/validate-sdd.sh . --strict`.

## Flow B: Adapt existing project using this template

1. Confirm project path.
2. Keep existing code behavior unchanged.
3. Add `idea/`, `specs/`, `bitacora/` structure.
4. Write the first spec from how the system behaves today, not from how you wish it behaved.
5. Register migration decisions in `bitacora/`.
6. Request and record explicit user consent only when implementation is about to start.
7. Validate structure and consistency.

## Minimum expected outcome / Resultado mínimo esperado

The target project ends the session with the standard structure in place, one specification written, a first logbook entry, and a next step the user can act on without asking anyone.
