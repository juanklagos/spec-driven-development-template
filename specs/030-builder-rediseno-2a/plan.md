# Plan 030 — Rediseño del builder "2a Terminal claro"

## Enfoque

Recrear el prototipo `Builder 2a.dc.html` dentro del stack existente del builder (React 19 + TS + Tailwind v4 + shadcn/ui + @xyflow/react + @dnd-kit + zustand), siguiendo el orden sugerido del handoff: cada fase deja la app funcionando.

## Fases

1. Tokens + tipografía — `styles.css` (paleta 2a claro + oscuro derivado de 1a, sombras de una capa, `--chrome`, `--hairline`) y `index.html` (IBM Plex Sans/Mono).
2. Renombrado — i18n es/en ("Lienzo" → "Grafo") + claves nuevas + `exportPng.ts`. Solo copy.
3. Cuatro franjas — nuevos `IdentityBar.tsx`, `ContextStrip.tsx`, `GateStatusBar.tsx`, `Rail.tsx`; borrar `TopBar.tsx` y `Palette.tsx`; reestructurar `App.tsx`; store: `scores`, `filters`, `zoom`, `drawerTab`, `paletteOpen`, `loadScores`, `toggleFilter`; atajos I/E/S.
4. Tarjetas — `SpecNode`, `NoteNode`, `.edge-label`, kanban a sangre.
5. Drawer — `SpecDrawer` + `SectionEditor` según handoff.
6. ⌘K — `CommandPalette` con acciones agrupadas.
7. Estados y overlays — vacío, sin conexión, asistente, tour, plantillas, bitácora, implementar.

## Decisiones técnicas

- El menú `⋯` usa el `Popover` de shadcn ya presente (no se añade dropdown-menu para evitar una dependencia nueva).
- Los identificadores de código (`viewMode: "canvas"`, `BoardCanvas`, `board.canvas`) no cambian: contrato con el servidor y con Obsidian.
- `scores` se cachea en el store con `loadScores()` en batch tras cargar el board y tras cambios de specs; errores de score no bloquean la UI.
- Modo oscuro derivado de la variante 1a del handoff (valores en `tokens.css` de referencia).

## Validación

- `tsc --noEmit` del builder y tests existentes (`convert.test.ts`, `ears.test.ts`, `sections.test.ts`).
- Verificación visual contra `Builder 2a.dc.html` con el dev server.

## File scope

- builder/src/**
- builder/index.html
