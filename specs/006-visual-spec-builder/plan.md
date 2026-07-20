# Plan 006 - visual-spec-builder

## Resumen

Construir el SDD Builder (Opción B) por fases incrementales; cada fase deja el repo consistente y usable. Stack: React Flow + dnd-kit + gray-matter/remark en core + servidor HTTP existente.

## Contexto técnico

- Fuente de verdad: .md (patrón obsidian-kanban); layout en `specs/board.canvas` (JSON Canvas, MIT).
- IDs estables: carpetas `NNN-slug` existentes.
- Distribución: estáticos del build de `builder/` servidos por `packages/sdd-mcp/src/http.ts` bajo `/builder` (misma UX que /dashboard).
- sdd-core no gana dependencias pesadas: parse de checkboxes con regex línea a línea (formato ya definido por el template); gray-matter/remark solo si resulta necesario para spec.md (Fase 2+).

## Fases de implementación

1. **Fase 1a**: `board.ts` en sdd-core (parseTasks/serializeTasks, readBoard/writeBoard con default autogenerado, readSpecDocument/writeTasks seguro) + export en index + smoke tests.
2. **Fase 1b**: API REST en http.ts (GET /api/board, PUT /api/board, GET /api/spec/:id, PUT /api/spec/:id/tasks, POST /api/spec) + servir estáticos /builder.
3. **Fase 1c**: frontend `builder/` (Vite+React Flow+dnd-kit): canvas, tarjetas tipadas, paleta, detalle con checkboxes, guardar layout; bilingüe.
4. **Fase 1d**: verificación end-to-end contra workspace sidecar de prueba + docs breves + README.
5. **Fase 2**: watcher (fs.watch/chokidar) + SSE → reconciliación en el store del front.
6. **Fase 3**: MCP App (ext-apps SDK) vista del board.
7. **Fase 4**: demo en Pages + guía 51 EN/ES + anuncio.

## Dependencias

- npm: @xyflow/react, @dnd-kit/*, zustand (solo en builder/); ninguna nueva en sdd-core para Fase 1.

## Hitos

- H1: API + core con tests (1a+1b). H2: builder usable end-to-end (1c+1d). H3: sync vivo. H4: MCP App. H5: demo+docs.

## Riesgos

- Alcance grande: se mitiga con fases que cierran completas; cada sesión termina con validación en verde.
- MCP Apps joven: Fase 3 puede ajustarse al estado del SDK en su momento.
- Escrituras concurrentes builder/editor: "el archivo gana" + escrituras atómicas (tmp+rename).
