# Status Dashboard / Tablero de estado

Generated at / Generado en: 2026-08-08 22:12 UTC

## Active specs / Specs activas

| Number | Name | Status | Priority | Owner | Updated |
|---|---|---|---|---|---|
| 006 | visual-spec-builder | In Progress / En progreso (F1-F3 hechas; queda T7b demo Pages + revisión spec MCP final 2026-07-28) | High / Alta | Juan Klagos / Claude | 2026-07-21 |
| 011 | one-command-launcher | In Progress / En progreso (T1, T2, T7 hechas; queda la ruta `npx`: T3-T6, T8) | High / Alta | Juan Klagos / Claude | 2026-07-23 |
| 023 | desk-electron | In Progress / En progreso (12 de 13; T9 firma fuera de alcance en macOS por decisión) | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-23 |

## All specs snapshot / Resumen de todas las specs

| Number | Name | Status | Priority | Owner | Updated |
|---|---|---|---|---|---|
| 001 | sdd-mcp-foundation | Done / Completada | High / Alta | Juan Klagos / Codex | 2026-07-17 |
| 002 | interactive-onboarding | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-17 |
| 003 | distribution-and-tutor | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-17 |
| 004 | site-dashboard-community | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-17 |
| 005 | learning-for-everyone | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-17 |
| 006 | visual-spec-builder | In Progress / En progreso (F1-F3 hechas; queda T7b demo Pages + revisión spec MCP final 2026-07-28) | High / Alta | Juan Klagos / Claude | 2026-07-21 |
| 007 | builder-v2-easy | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-20 |
| 008 | builder-v3-ai | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-20 |
| 009 | builder-v4-teams | Done / Completada | Medium / Media | Juan Klagos / Claude | 2026-07-21 |
| 010 | builder-v5-pro-ux | Done / Completada | High / Alta | Juan Klagos / Claude | 2026-07-21 |
| 011 | one-command-launcher | In Progress / En progreso (T1, T2, T7 hechas; queda la ruta `npx`: T3-T6, T8) | High / Alta | Juan Klagos / Claude | 2026-07-23 |
| 012 | gate-verdict | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-21 |
| 013 | gate-integrity | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-21 |
| 014 | builder-first-five-minutes | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-21 |
| 015 | builder-first-session | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-21 |
| 016 | front-door | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-22 |
| 017 | docs-navigation | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-22 |
| 018 | brand-logo | Done / Completada | Medium / Media | Juan Carlos Alvarez Lagos / Claude | 2026-07-22 |
| 019 | docs-links | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-22 |
| 020 | front-door-two-commands | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-22 |
| 021 | silent-version-mismatch | Done / Completada (T10 la verifica el propietario al publicar) | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-23 |
| 022 | drawer-tareas-colapsables | Done / Completada | Medium / Media | Juan Carlos Alvarez Lagos / Claude | 2026-07-22 |
| 023 | desk-electron | In Progress / En progreso (12 de 13; T9 firma fuera de alcance en macOS por decisión) | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-23 |
| 024 | nucleo-con-pruebas | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-23 |
| 025 | semaforo-de-deriva | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-23 |
| 026 | tema-docs | Done / Completada (T6 ticker diferido a propósito) | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-23 |
| 027 | mcp-full-coverage | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / Claude | 2026-07-23 |
| 028 | mcp-builder-superficie-completa | Done / Completada | High / Alta | Juan Carlos Alvarez Lagos / OpenCode | 2026-08-08 |

## Task progress / Progreso de tareas

- Pending / Pendientes: 11
- Completed / Completadas: 295

## Recent log excerpt / Extracto reciente de bitácora

```text
  ## 2026-07-23 — Spec 027: cobertura completa de comandos MCP
  
  - **Goal / Objetivo:** cerrar las asimetrías del servidor MCP (fuerte escribiendo, débil leyendo) tras la auditoría pedida por el propietario («cubre todo»).
  - **Work completed / Trabajo realizado:** 7 herramientas nuevas (21 → 28): sdd_read_spec_document, sdd_read_bitacora, sdd_check_drift, sdd_add_task, sdd_lint_ears, sdd_score_spec, sdd_install_sidecar. Core nuevo probado (bitacora.ts, score.ts, addSpecTask, getSpecDriftReport, installSidecar); docs ES/EN actualizadas.
  - **Decisions made / Decisiones tomadas:** score portado a TS (el bash exige rg), sidecar delegado al bash con execFile (patrón createWorkspace) — `bitacora/decisiones/2026-07-23-mcp-score-port-y-sidecar-execfile.md`.
  - **Blockers / Bloqueos:** ninguno.
  - **Next step / Próximo paso:** publicar la versión con las 28 herramientas (propietario, con OTP); spec futura opcional: resources/prompts para projectRoot arbitrario.
  - **Owner / Responsable:** Juan Carlos Alvarez Lagos / Claude
```
