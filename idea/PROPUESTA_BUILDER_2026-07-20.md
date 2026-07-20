# Propuesta: SDD Builder visual — investigación 2026-07-20

> Documento de trabajo. Si se aprueba, se convierte en spec numerada (006) antes de implementar.

## Veredicto de la investigación

**NO existe** (julio 2026) un constructor visual drag-and-drop que componga el flujo SDD con tarjetas tipadas (idea → épicas → specs → planes → tareas), uniones entre tarjetas, y generación bidireccional de las specs markdown reales. Se verificaron ~15 UIs del ecosistema SDD: todas son visores, dashboards de aprobación o kanbans de ejecución.

Lo más cercano y qué le falta:
- **Traycer** (traycer.ai, SaaS closed source): board con tickets+specs+dependencias y drag para reordenar; pero compone por chat, no es canvas, público dev.
- **spec-workflow-mcp** (GPL-3, 4.3k★, en pausa): kanban dnd-kit + editor markdown, pero solo opera sobre specs ya escritas por el agente.
- **OpenSpecification** (MIT, 31★): builder web estilo Kiro por formularios/chat, sin lienzo; sin tracción → espacio desatendido.
- **spec-kitty / Kiro / openspec-ui / spectatui**: visualizan o ejecutan, no construyen.
- **Figr / Relume / tldraw computer**: validan el paradigma canvas+tarjetas+IA en otros dominios (UX, sitemaps, workflows).

**Hueco exacto**: el "Relume de las specs" — lienzo donde una persona no técnica arrastra tarjetas Idea/Épica/Spec/Plan/Tarea, las une definiendo jerarquía y dependencias, la IA rellena contenido, el humano aprueba visualmente, y cada tarjeta se materializa como `specs/NNN/spec.md|plan.md|tasks.md` reales compatibles con Spec Kit/Claude/Cursor/Kiro.

## Stack recomendado (todo MIT)

- **Canvas**: React Flow (@xyflow/react) — el estándar (lo usan Flowise y Langflow); plantilla Workflow Editor de React Flow UI (shadcn) como punto de partida.
- **Drag de paleta y reorden de tareas**: @dnd-kit.
- **Fuente de verdad**: los .md (patrón obsidian-kanban) con gray-matter + remark (edición quirúrgica por AST); layout del canvas en `specs/board.canvas` (formato abierto JSON Canvas); IDs estables = carpetas `NNN-slug` que el template ya usa.
- **Distribución sin fricción**: servido por el servidor HTTP existente de `sdd-mcp` (puerto 3334) en `/builder`, junto al `/dashboard` actual; reutiliza `listSpecs`/`checkGate` de `sdd-core`. (File System Access API descartada como vía principal: solo Chrome/Edge.)

## Opciones

**A — MVP "SDD Board" (2-4 semanas):** canvas con tarjetas tipadas + uniones + paleta, sync canvas↔markdown al guardar, servido en `/builder`. Primeros pasos: spec 006 → módulo `board.ts` en sdd-core (tasks.md↔JSON + board.canvas, con tests) → front Vite+React Flow.

**B — Ambiciosa (6-9 semanas):** A + sync bidireccional en vivo (chokidar+WebSocket: editas el .md y la tarjeta se actualiza) + MCP App (SEP-1865) para una vista del board dentro de Claude/ChatGPT/VS Code + modo demo en Pages.

## Fuentes

Informes completos en la bitácora de sesión 2026-07-20. Principales: github.com/xyflow/xyflow · reactflow.dev/ui · github.com/mgmeyers/obsidian-kanban · jsoncanvas.org · traycer.ai · github.com/Pimzino/spec-workflow-mcp · github.com/spenceriam/OpenSpecification · github.com/Priivacy-ai/spec-kitty · kiro.dev/docs/specs · blog.modelcontextprotocol.io/posts/2026-01-26-mcp-apps
