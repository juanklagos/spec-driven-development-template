# History 006 - visual-spec-builder

## 2026-07-20

- Spec creada tras investigación doble (existencia + stack). Autor eligió Opción B (ambiciosa) vía pregunta de alcance; consentimiento registrado.
- Plan por fases: MVP (1a-1d) → sync vivo → MCP App → demo/docs.

## 2026-07-20 (Fase 1a-1b completadas)

- `board.ts` en sdd-core y API REST en http.ts implementados y verificados end-to-end contra workspace sidecar real (board por defecto, uniones persistidas en board.canvas, toggle de tareas escrito en disco, creación de spec vía POST, guards de seguridad).
- Frontend (Fase 1c) delegado a agente con contrato de API exacto y verificación obligatoria.

## 2026-07-20 (Fase 1 completa)

- Frontend entregado y verificado por agente con evidencia real (screenshots, toggle escrito en disco, creación de spec end-to-end, merge automático de specs sin nodo, dark mode, estados de error).
- Bug de atomicidad de `createSpec` (hallado por el agente) corregido y verificado: sin bundle parcial ante fallo.
- Limitación conocida documentada: PUT de board completo — "el último escritor gana" en el canvas (los .md nunca se pisan); lo resuelve la Fase 2.
