# Especificación 002 - interactive-onboarding (Nivel 1 de propuestas 2026-07-17)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-17`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat de la sesión 2026-07-17 — el autor respondió "hazlo" a la propuesta explícita "¿Arranco con el Nivel 1?" tras revisar `idea/PROPUESTAS_2026-07-17.md`. Consentimiento registrado en `.sdd/user-consent.log`.

## Historia de usuario principal

Como visitante del template (estudiante, dev o agente de IA), quiero que el flujo SDD sea descubrible e instalable con fricción mínima (comandos, skill portable, entorno de un clic, contexto para agentes y demo visual), para empezar a usar SDD sin leer 51 guías primero.

## Escenarios de aceptación

1. Dado un usuario de Claude Code en este repo, cuando escribe `/sdd:help`, entonces recibe el diagnóstico de etapa y el siguiente paso exacto.
2. Dado un agente compatible con Agent Skills, cuando carga `skills/sdd-workflow/SKILL.md`, entonces obtiene el flujo SDD completo con sus comandos de validación.
3. Dado un usuario de VS Code/Copilot, cuando abre el repo, entonces dispone de prompt files `/sdd-*` e instrucciones scoped para `specs/`.
4. Dado un agente de código externo, cuando consulta `llms.txt` en la raíz, entonces encuentra el índice navegable de la documentación.
5. Dado un visitante de GitHub, cuando pulsa el badge de Codespaces, entonces obtiene un entorno con dependencias instaladas y validación inicial corrida.
6. Dado un release del template, cuando corre el workflow de demo, entonces `docs/assets/demo.gif` se regenera con el flujo real (spec → validación → gate).

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO el usuario invoque `/sdd:help`, EL SISTEMA DEBERÁ leer INDEX/STATUS/bitácora y responder con la etapa actual y un único siguiente paso.
- CUANDO el usuario invoque `/sdd:gate`, EL SISTEMA DEBERÁ ejecutar los scripts de política y gate y pedir/registrar consentimiento solo si la spec está aprobada y el plan es consistente.
- EL SISTEMA DEBERÁ mantener el hard stop en todos los comandos: sin código antes de spec aprobada y plan consistente.
- CUANDO se regenere `llms.txt`, EL SISTEMA DEBERÁ producirlo desde el contenido real de `docs/` (sin enlaces muertos).
- EL SISTEMA DEBERÁ mantener bilingüe (EN/ES) todo artefacto de cara al usuario.

## Requisitos

- R1. Skill portable `skills/sdd-workflow/SKILL.md` (estándar Agent Skills: frontmatter `name` + `description`).
- R2. Slash commands de Claude Code en `.claude/commands/sdd/`: `help`, `new`, `spec`, `gate`, `close`.
- R3. Soporte Copilot/VS Code: `.github/prompts/sdd-*.prompt.md` + `.github/instructions/sdd-specs.instructions.md` (applyTo `specs/**`).
- R4. `llms.txt` en raíz + generador `scripts/generate-llms-txt.sh`.
- R5. `.devcontainer/devcontainer.json` + badge "Open in Codespaces" en ambos README.
- R6. `demo.tape` (VHS) + workflow `.github/workflows/demo.yml` que regenere `docs/assets/demo.gif` (workflow_dispatch + release).
- R7. README (EN/ES): badge Codespaces + sección breve de comandos/skill; sin romper la estructura aprobada en la reorganización previa.

## Fuera de alcance / Out of scope

- Plugin/marketplace de Claude Code, tutor `/sdd:tutor`, publicación npm, sitio Starlight, GitHub Action pública, dashboard MCP Apps, curso GitHub Skills (Niveles 2 y 3 de las propuestas).

## Criterios de éxito

- Los tres scripts de validación SDD pasan con 0 errores tras los cambios.
- 0 enlaces relativos rotos en los archivos nuevos/modificados.
- Un usuario de Claude Code puede completar idea → spec → gate usando solo los comandos `/sdd:*`.
