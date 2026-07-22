# Tareas 015 - La primera sesión del builder

## H1 — Las tarjetas se leen

- [x] **T1a** `extractSpecTitle` en `workspace.ts`, con degradación a etiqueta derivada del id.
- [x] **T1b** `SpecSummary.title` poblado en `listSpecs`; exportar el extractor.
- [x] **T1c** `title` en los esquemas MCP (board y `sdd_list_specs`) y en el tipo del builder.
- [x] **T1d** Título en `SpecNode` y en la tarjeta del kanban, con el id visible al lado.
- [x] **T1e** Prueba: título extraído de las formas reales, y nunca vacío.

## H2 — Una aprobación se completa sin terminal

- [ ] **T2a** `POST /api/spec/:id/consent` en la API, con identificador explícito.
- [ ] **T2b** Cliente en `builder/src/api.ts`.
- [ ] **T2c** Acción en el drawer tras aprobar, con refresco de la compuerta.
- [ ] **T2d** Textos ES/EN.

## H3 — Llegar a una spec cuesta tres teclas

- [ ] **T3a** `CommandPalette` con filtrado por número y título.
- [ ] **T3b** Atajo global Cmd+K / Ctrl+K y cierre con Escape.
- [ ] **T3c** Navegación con teclado completa y textos ES/EN.

## Verificación de cierre

- [ ] `npx tsc --noEmit` y `npm run build` del builder en verde.
- [ ] Los cuatro scripts SDD en 0 errores.
- [ ] `npm run mcp:test` y `npm run mcp:pack:smoke` en verde.
- [ ] Comprobado con el servidor arriba: título en tarjetas, consentimiento registrado desde el
      lienzo y compuerta refrescada, paleta abriendo y saltando.
