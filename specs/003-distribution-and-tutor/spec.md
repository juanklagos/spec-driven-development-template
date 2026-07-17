# Especificación 003 - distribution-and-tutor (Nivel 2 de propuestas 2026-07-17)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-17`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat de la sesión 2026-07-17 — el autor respondió "hazlo y continua con todo nivel senior" tras el cierre del Nivel 1, aprobando continuar con el Nivel 2. Consentimiento registrado en `.sdd/user-consent.log`.

## Historia de usuario principal

Como usuario del template (estudiante o dev), quiero instalar el flujo SDD en cualquier proyecto con un comando (plugin/CLI/Action) y aprender SDD conversando con un tutor dentro del agente, para adoptar la disciplina sin fricción de instalación ni lectura previa.

## Escenarios de aceptación

1. Dado un usuario de Claude Code en cualquier proyecto, cuando ejecuta `/plugin marketplace add juanklagos/spec-driven-development-template` e instala el plugin, entonces obtiene los comandos `/sdd:*` y la skill sin clonar el repo.
2. Dado un estudiante, cuando invoca `/sdd:tutor`, entonces recibe un curso conversacional por niveles que usa los scripts de validación como corrector.
3. Dado un repo ajeno con sidecar `spec/`, cuando su CI usa `uses: juanklagos/spec-driven-development-template@main`, entonces la validación SDD corre y falla el build si el gate no pasa.
4. Dado un dev externo, cuando ejecuta `npx create-sdd-project mi-app`, entonces obtiene un proyecto con sidecar SDD sin clonar el template manualmente (requiere publicación npm posterior).

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO el usuario invoque `/sdd:tutor`, EL SISTEMA DEBERÁ preguntar nivel e idioma, enseñar un concepto por vez y verificar cada ejercicio con los scripts de validación reales.
- CUANDO la Action corra en un proyecto con `spec/scripts/`, EL SISTEMA DEBERÁ usar esos scripts; si no existen, DEBERÁ usar los scripts empaquetados de la propia Action.
- EL SISTEMA DEBERÁ mantener el hard stop en todos los artefactos nuevos.
- EL SISTEMA DEBERÁ mantener bilingüe (EN/ES) todo artefacto de cara al usuario.

## Requisitos

- R1. Plugin de Claude Code: `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` (nombre de plugin `sdd`, apuntando a los comandos `.claude/commands/sdd/` y a `skills/`).
- R2. Tutor `/sdd:tutor`: `.claude/commands/sdd/tutor.md` con guion pedagógico por niveles (usa docs 12/13/14/15/18) + espejo `.github/prompts/sdd-tutor.prompt.md`.
- R3. Entrevista guiada reforzada en `/sdd:new` (restricciones, stack, casos borde — patrón GSD).
- R4. GitHub Action composite `action.yml` en la raíz del repo (inputs `path`, `strict`; autodetección sidecar/root/bundled).
- R5. Preparación npm: paquete `packages/create-sdd-project` (CLI zero-dep con `bin`, clona el template y ejecuta el instalador sidecar) con metadatos de publicación; sin romper los scripts de workspace del monorepo.
- R6. README (EN/ES): fila `/sdd:tutor`, instalación como plugin y uso de la Action en CI.

## Fuera de alcance / Out of scope

- Publicación efectiva en npm y en el GitHub Marketplace (requieren cuenta/release del autor; quedan documentadas).
- Sitio de docs Starlight, dashboard MCP Apps, curso GitHub Skills (fases propias del backlog).
- Renombrar los scopes `@sdd/*` de los paquetes existentes.

## Criterios de éxito

- Los tres scripts de validación SDD pasan con 0 errores tras los cambios.
- `npm run build` y `npm run typecheck` del monorepo siguen en verde con el paquete nuevo.
- 0 enlaces relativos rotos en archivos nuevos/modificados.
