# History 006 - visual-spec-builder

## 2026-07-20

- Spec creada tras investigación doble (existencia + stack). Autor eligió Opción B (ambiciosa) vía pregunta de alcance; consentimiento registrado.
- Plan por fases: MVP (1a-1d) → sync vivo → MCP App → demo/docs.

## 2026-07-20 (Fase 1a-1b completadas)

- `board.ts` en sdd-core y API REST en http.ts implementados y verificados end-to-end contra workspace sidecar real (board por defecto, uniones persistidas en board.canvas, toggle de tareas escrito en disco, creación de spec vía POST, guards de seguridad).
- Frontend (Fase 1c) delegado a agente con contrato de API exacto y verificación obligatoria.
