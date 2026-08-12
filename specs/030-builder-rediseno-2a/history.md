# Historia — 030-builder-rediseno-2a

## 2026-08-11 — Spec creada, aprobada e implementada

- Origen: handoff `~/Downloads/design_handoff_builder_2a` (rediseño "2a Terminal claro" elegido entre las cuatro direcciones exploradas en `Builder Rediseño.dc.html`; `1a` sirvió de referencia para el modo oscuro).
- Aprobación: petición directa del autor en sesión de Claude Code; consentimiento registrado en `.sdd/user-consent.log`.
- Implementación completa en las 7 fases del plan, cada una dejando la app funcionando:
  1. Tokens 2a + IBM Plex (`styles.css`, `index.html`).
  2. Renombrado Lienzo→Grafo + ~90 claves i18n nuevas (es/en) + `exportPng.ts`.
  3. Chrome de cuatro franjas: `IdentityBar`, `ContextStrip`, `GateStatusBar`, `Rail`; `TopBar.tsx` y `Palette.tsx` eliminados; `App.tsx` reestructurado; store con `scores`, `filters`, `zoom`, `paletteOpen`, `bitacoraOpen`; atajos I/E/S.
  4. `SpecNode`/`NoteNode`/kanban a sangre/`.edge-label`.
  5. `SpecDrawer` (bloque de bloqueo, puntaje con grado grande, pestañas subrayadas, drawer entre chrome y barra de compuerta) + `SectionEditor` (espinas de lint, barra inferior fija).
  6. `CommandPalette` promovida (acciones agrupadas + specs, pie de atajos).
  7. Overlays: vacío, sin conexión, asistente, tour, plantillas, bitácora, implementar.
- Validación: `tsc --noEmit` limpio, 34 tests del builder y 110 del monorepo en verde, `vite build` OK, verificación visual en claro y oscuro contra `Builder 2a.dc.html` con el workspace de prueba `www/demo-rediseno`.
- Desviación consciente del handoff: el menú `⋯` usa `Popover` (no se añadió `dropdown-menu` para evitar una dependencia nueva); el icono de GitHub es `CircleDot` (lucide ya no incluye iconos de marca).
