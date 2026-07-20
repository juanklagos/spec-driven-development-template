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
(estado / state). Todo MIT / All MIT. CSS plano con variables y dark/light por
`prefers-color-scheme` / Plain CSS with variables and dark/light via `prefers-color-scheme`.
