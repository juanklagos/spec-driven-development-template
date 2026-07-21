# Plan 008-builder-v3-ai

## Resumen
Implementación por agente delegado con verificación real (builds, mcp:test, smoke REST, navegador contra sandbox). Reutiliza la capa compartida de sdd-core (getBoardView, etc.); toda lógica nueva de negocio nace en sdd-core, transportes finos (patrón de la revisión SOLID de spec 006).

## Fases
1. Core+API. 2. Frontend. 3. Docs (guía 51 EN/ES + CHANGELOG Unreleased). 4. Verificación y trazabilidad.

## Riesgos
Alcance por spec acotado a sus R*; cada spec cierra con validaciones en verde antes de la siguiente.
