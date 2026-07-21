# 🌱 SDD Builder (frontend)

Canvas visual drag-and-drop para construir tu flujo SDD con tarjetas (Idea, Épica, Spec) y uniones.
Los `.md` de `specs/` son la fuente de verdad; el lienzo solo guarda el layout en `specs/board.canvas`
(formato [JSON Canvas](https://jsoncanvas.org)).

Visual drag-and-drop canvas to build your SDD flow with cards (Idea, Epic, Spec) and connections.
The `.md` files in `specs/` are the source of truth; the canvas only stores layout in
`specs/board.canvas` ([JSON Canvas](https://jsoncanvas.org) format).

## Uso / Usage

```bash
# Build (lo sirve el servidor HTTP de sdd-mcp en /builder)
# Build (served by the sdd-mcp HTTP server at /builder)
cd builder
npm install
npm run build

# Luego, desde la raíz del repo / Then, from the repo root:
npm run mcp:http:start
# → http://127.0.0.1:3334/builder
```

## Desarrollo / Development

```bash
# Terminal 1 (raíz / repo root): API en 3334 / API on 3334
npm run mcp:http:start

# Terminal 2:
cd builder
npm run dev        # Vite dev server con proxy de /api → 127.0.0.1:3334
npm run typecheck  # tsc --noEmit
```

## Stack

Vite + React 18 + TypeScript + [@xyflow/react](https://reactflow.dev) (canvas) +
[@dnd-kit/core](https://dndkit.com) (paleta / palette) + [zustand](https://zustand.docs.pmnd.rs)
(estado / state) + [Tailwind CSS v4](https://tailwindcss.com) y
[shadcn/ui](https://ui.shadcn.com) (Radix) para la UI (spec 010). Todo MIT / All MIT.
Dark/light por `prefers-color-scheme`; i18n propio ES/EN en `src/i18n.ts` (un idioma a la vez,
switcher en la TopBar) / Dark/light via `prefers-color-scheme`; own ES/EN i18n in `src/i18n.ts`
(one language at a time, TopBar switcher).
