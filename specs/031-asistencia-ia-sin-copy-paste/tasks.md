# Tareas 031 - Asistencia IA sin copy-paste

Orden TDD: cada bloque escribe primero sus pruebas.

## Fase 1 — Core: cola de peticiones

- [x] T1. Pruebas del módulo `requests` en sdd-core: crear (R1), `nextRequest`
      FIFO + vacío explícito (R2), `respondRequest` no toca `specs/` (R3),
      transiciones ilegales rechazadas y `cancelled` invisible para
      `nextRequest` (R8, propiedades).
- [x] T2. Implementar módulo `requests` (crear, next, respond, resolve,
      máquina de estados) hasta que T1 pase.
- [x] T3. Prueba + implementación: watcher/eventos emiten SSE `kind: request`
      ante cambios en `.sdd/requests/` en <2 s (R1, R3).

## Fase 2 — Transporte REST + MCP

- [x] T4. Pruebas de rutas REST: `POST /api/request`, `GET /api/requests`
      (incluye `connectedAgent`/`lastSeenAt`), `POST /api/request/:id/resolve`
      con validación de cuerpo (R1, R6).
- [x] T5. Implementar rutas REST delegando en el core hasta que T4 pase.
- [x] T6. Pruebas MCP (smoke-test estilo `scripts/smoke-test-mcp.mjs`):
      `sdd_next_request` devuelve contexto completo con texto actual de la
      sección; `sdd_respond_request` deja la petición `answered` sin diff en
      `specs/` (R2, R3).
- [x] T7. Registrar y implementar las dos herramientas MCP hasta que T6 pase.

## Fase 3 — Builder UI

- [x] T8. Pruebas del slice de peticiones en el store (carga, refresco por
      evento, cálculo de estancada >10 min con reloj inyectado) (R7, R8).
- [x] T9. Implementar slice + indicador visible de peticiones activas con
      estados pendiente/en curso/atendida (R7) y badge estancada + cancelar
      (R8).
- [x] T10. Pruebas del diff por líneas (función pura: actual vs. propuesto).
- [x] T11. Componente compartido `AiAssistButton` + panel de diff con
      Aceptar/Rechazar; montado primero en `SectionEditor` (7 secciones →
      PUT sections + resolve) (R4).
- [x] T11b. Montar `AiAssistButton` en las demás superficies de contenido:
      tareas del `SpecDrawer`, `NoteNode`, formularios de `BitacoraModal`,
      cada una escribiendo por su ruta existente al aceptar (R4/R4b).
- [x] T11c. Prueba de exclusión: los formularios de aprobación y
      consentimiento NO montan el botón de IA (R4b).
- [x] T12. AssistantWizard: braindump + "Estructurar con IA", propuesta
      precargada en el preview editable, creación solo al confirmar (R5).
- [x] T13. Estado "sin agente conectado" + fallback PromptBox clásico junto a
      cada botón de IA (R6). Cadenas nuevas en `i18n.ts` ES/EN.

## Fase 4 — Cierre

- [x] T14. Guía del builder: sección "modo conectado" con el flujo
      `/loop` + `sdd_next_request` y el contrato de las herramientas.
- [x] T15. Prueba end-to-end manual guiada: builder + sesión Claude Code
      conectada; escenarios 1-5 de la spec verificados y anotados en
      `history.md`.
- [x] T16. `sdd_validate` + actualizar `specs/INDEX.md` y bitácora.
