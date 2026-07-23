# Ideas Builder v3 — 2026-07-23

> Backlog nuevo tras la evaluación del builder y un barrido de tendencias con IA
> (solicitado por el propietario). Al aprobarse una idea, se convierte en spec
> numerada. Continúa `IDEAS_BUILDER_V2_2026-07-20.md`, cuyos paquetes v2/v3/v4 ya
> se implementaron (specs 007-010).
>
> **Eje que emergió del barrido:** todo el mercado de SDD (Spec Kit ~90k★,
> OpenSpec ~52k★, Kiro, BMAD, Tessl, Cursor Plan Mode, Antigravity) converge en
> «markdown + slash commands + un agente». **Ninguno tiene lienzo.** Ese es el
> foso del template y hoy se usa poco. El otro hueco que todos admiten: la
> **deriva spec↔código**, que todos resuelven con comandos que hay que recordar.
>
> Fuentes del barrido (2026-07-23): augmentcode.com/tools/best-spec-driven-development-tools;
> dev.to/willtorber (Spec Kit vs BMAD vs OpenSpec); intent-driven.dev/knowledge/spec-kit-vs-openspec;
> claude-codex.fr/en/future/trends-2026; modelcontextprotocol.io/specification/draft/deprecated.

## Ya promovidas a spec (2026-07-23)

- **Spec 024 — Núcleo con pruebas.** Vitest sobre `convert`, `board.specTone`, `ears` + espejo `sections.ts`. Cierra la incoherencia «predica criterios verificables, no tiene ninguno ejecutable». Fundacional. [alta]
- **Spec 025 — Semáforo de deriva spec↔código.** Cruce ámbito de archivos × `git log` × fecha de aprobación → chip ámbar en la tarjeta, sin LLM ni red. El diferencial del lienzo aplicado al problema no resuelto del sector. [alta]

## A. Cerrar el círculo spec→código (el diferencial)

1. **Trazabilidad criterio EARS → prueba → commit.** Cada criterio con un chip: sin prueba / roja / verde. Es lo que Kiro y Tessl venden como «specs ejecutables». Reusa `ears.ts` (probado tras la 024) y el runner de la 024. Puente natural desde el 025. [medio-alto]
2. **Modo delta para proyectos existentes** (proposal → apply → archive, estilo OpenSpec). El modelo de spec numerada permanente sirve para empezar de cero; el sidecar `spec/` en repos reales necesita el flujo de cambios. Es el terreno donde OpenSpec gana hoy. [alto]
3. **«Reconciliar con agente» desde una tarjeta derivada.** El 025 detecta; esto entrega al agente el prompt para decidir quién tiene razón (spec o código), arrancando por `/sdd:gate`. Detectar es local; juzgar se delega — mismo principio que el asistente ✨. [medio]

## B. Lo que el lienzo puede llevar y hoy no

4. **Las decisiones como nodos.** `bitacora/decisiones/` es el mejor material del repo y vive invisible en markdown suelto. Nodos anclados a las specs que restringen, con la fecha de «cuándo revisar» como alerta viva — el board avisaría que la revisión de MCP App vence el 2026-07-28. [medio]
5. **Diff del board entre commits:** qué cambió en el plan desde la última release. [medio]
6. **Capa de arquitectura:** nodos de archivo/módulo real enlazados a specs, alimentados del repo (reusa la consulta git de la 025). Mapa vivo, sin modelo. [medio-alto]
7. **Export estático del board** (HTML/SVG autocontenido) para el README o un cliente. Complementa el PNG que ya existe. [bajo]
8. **Burn-down real** desde `tasks.md` + git, en vez de la tabla estática de `STATUS.md`. [bajo-medio]
9. **Export Mermaid** del grafo (ítem 18 del backlog v2, sigue pendiente) para docs. [bajo]

## C. Herramientas / integraciones

10. **Publicar `sdd-mcp` en el registro MCP** (ahora bajo la Linux Foundation) con anotaciones read-only/destructive en las tools `sdd_*`. Descubribilidad gratis; los agentes lo encuentran en runtime. [bajo-medio]
11. **Generar `AGENTS.md` + skills pack** en cada proyecto creado por `create-sdd-project`. Es el estándar de facto multi-agente 2026; el template ya tiene las skills `sdd:*`. [medio]
12. **Sync bidireccional con GitHub Issues/Projects.** Hoy `api.ts` solo crea issues; leer su estado de vuelta cerraría el lazo (tareas ↔ issues). [medio]
13. **Higiene del estándar MCP (revisión 2026-07-28).** Verificado 2026-07-23: `Roots`, `Logging` y `Sampling` deprecados (SEP-2577); `HTTP+SSE` deprecado (SEP-2596) — el builder **ya** usa Streamable HTTP, sin deuda ahí. Tarea: al publicarse la spec final, confirmar que nada del server usa Roots/Logging y actualizar el `.mcpb`/peer si aplica. [bajo]

## D. Descartado (con motivo)

- **Migrar `@xyflow/react` → tldraw.** tldraw tiene starter kits de agentes excelentes, pero el lienzo del template es un grafo tipado (idea/épica/spec/edges semánticos), no dibujo libre. El cambio cuesta más de lo que aporta. Revisar solo si aparece una necesidad de canvas libre que xyflow no cubra.
- **Spike de MCP sampling** para el asistente ✨. Descartado: sampling quedó deprecado (SEP-2577) nueve días antes de esta nota. Ver `bitacora/decisiones/2026-07-23-sampling-deprecado-confirma-el-copy-first.md`.

## Paquetes sugeridos

- **v6 «Confianza» (en curso)**: 024 (pruebas) → 025 (deriva). El orden importa: 025 depende de 024 en duro.
- **v7 «Trazabilidad»**: 1 (EARS→prueba→commit) + 4 (decisiones como nodos) + 6 (capa de arquitectura). Todo apoyado en 024/025.
- **v8 «Repos reales»**: 2 (modo delta) + 3 (reconciliar con agente) + 12 (sync GitHub). El terreno donde OpenSpec gana hoy.
- **Transversal, barato**: 10 (registro MCP) + 11 (AGENTS.md) + 13 (higiene MCP) + 7/9 (exports).
