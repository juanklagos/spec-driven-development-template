# Plan 002 - interactive-onboarding

## Resumen

Implementar el Nivel 1 de `idea/PROPUESTAS_2026-07-17.md`: seis mejoras de onboarding e interactividad, todas de tipo markdown/config, sin tocar código de los paquetes ni romper la estructura existente. Cada requisito de la spec (R1-R7) mapea a una fase.

## Contexto técnico

- Los slash commands de Claude Code viven en `.claude/commands/`; un subdirectorio crea el namespace (`.claude/commands/sdd/help.md` → `/sdd:help`).
- Agent Skills: carpeta con `SKILL.md` y frontmatter YAML mínimo (`name`, `description`); estándar abierto leído por 32+ herramientas.
- Prompt files de VS Code: `.github/prompts/*.prompt.md`; instrucciones scoped: `.github/instructions/*.instructions.md` con frontmatter `applyTo`.
- VHS no está instalado localmente: el GIF se genera en CI con `charmbracelet/vhs-action` (workflow_dispatch + release); el embed en README queda pendiente hasta la primera corrida.
- `llms.txt`: índice markdown en raíz generado por script bash desde `docs/en` y `docs/es` (título H1 de cada guía).

## Fases de implementación

1. R1: `skills/sdd-workflow/SKILL.md` portable con el flujo SDD y los scripts de validación.
2. R2: comandos `.claude/commands/sdd/{help,new,spec,gate,close}.md` bilingües reutilizando el banco de prompts.
3. R3: `.github/prompts/sdd-{new,gate,close}.prompt.md` + `.github/instructions/sdd-specs.instructions.md` (applyTo `specs/**`).
4. R4: `scripts/generate-llms-txt.sh` + `llms.txt` generado y commiteado.
5. R5: `.devcontainer/devcontainer.json` + badge Codespaces en README EN/ES.
6. R6: `demo.tape` + `.github/workflows/demo.yml` (vhs-action, commit del GIF).
7. R7: sección breve "comandos incluidos" en README EN/ES.
8. Trazabilidad: CHANGELOG, `specs/INDEX.md`, STATUS regenerado, bitácora, history.
9. Validación: 3 scripts SDD + chequeo de enlaces relativos.

## Dependencias

- Ninguna externa en local; el GIF de demo depende de Actions (vhs-action) en GitHub.

## Hitos

- Hito 1: comandos y skill funcionales (fases 1-3).
- Hito 2: contexto y entorno (fases 4-5).
- Hito 3: demo en CI + README (fases 6-7).
- Hito 4: trazabilidad y validación en verde (fases 8-9).

## Riesgos

- El embed del GIF en README queda pendiente hasta la primera corrida del workflow (evitar imagen rota).
- Naming de comandos: mantener `/sdd:*` estable porque los docs lo citarán; cambiarlo luego rompería hábitos.
- Los prompt files de Copilot duplican contenido de los comandos Claude: riesgo de drift; se anota en cada archivo que el espejo canónico es `.claude/commands/sdd/`.
