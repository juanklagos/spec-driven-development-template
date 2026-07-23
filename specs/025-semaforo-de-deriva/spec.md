# Especificación 025 - semáforo de deriva spec↔código

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-23`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-23 — tras cerrar la 024 y la 026, el propietario respondió «continue» a la pregunta explícita «¿Sigo con la 025 (semáforo de deriva)?». Consentimiento en `.sdd/user-consent.log`.

## Objetivo / Objective

Detectar y mostrar en el lienzo, sin LLM ni red, la deriva entre una spec aprobada y el código que gobierna, cruzando su ámbito de archivos con el historial de git desde la fecha de aprobación. / Detect and surface on the canvas, with no LLM and no network, the drift between an approved spec and the code it governs, by crossing its file scope with git history since the approval date.

## Historia de usuario principal

Como persona que mantiene un proyecto con SDD, quiero que **el lienzo me avise cuando el código gobernado por una spec aprobada cambió después de aprobarla**, para enterarme de que la spec y el código se separaron sin tener que acordarme de correr un comando — el lienzo lo muestra solo, en la tarjeta afectada.

## Contexto y oportunidad (verificado)

Todo el mercado de SDD reconoce la deriva spec↔código como el problema no resuelto: Spec Kit añadió `/speckit.reconcile` y `/speckit.sync.analyze`, OpenSpec `/opsx:sync`. La crítica repetida (búsquedas 2026-07-23, DEV/intent-driven.dev) es que **ninguno es automático — hay que acordarse de dispararlo, y es el paso que los equipos saltan hasta que las specs llevan seis meses desactualizadas**.

El template ya tiene la pieza que a los demás les falta: **un lienzo**. Y ya tiene el dato: la plantilla de spec incluye una sección **«Ámbito de archivos / File scope»** (`specs/_template/spec.md`) con las rutas que gobierna cada spec, y la 011/023 la usan. Cruzar ese ámbito con `git log` desde la fecha de aprobación es deriva calculable **sin ningún LLM** y **sin red** — coherente con `bitacora/decisiones/2026-07-20-builder-sin-llamadas-a-llm.md`.

Este es el diferencial visual más claro del proyecto: no un comando que hay que recordar, sino un color que aparece solo.

## Escenarios de aceptación

1. Dada una spec `Aprobada` el día D con `File scope: src/pagos/`, cuando hay commits que tocan `src/pagos/` con fecha posterior a D, entonces la tarjeta de esa spec muestra un indicador de deriva (ámbar) en el lienzo.
2. Dada la misma spec sin commits posteriores a D en su ámbito, cuando se pinta el board, entonces la tarjeta no muestra deriva.
3. Dada una spec sin sección «Ámbito de archivos», cuando se calcula la deriva, entonces la tarjeta muestra estado «ámbito no declarado» (neutro, distinto de verde y de ámbar) e invita a declararlo, en vez de fingir que no hay deriva.
4. Dada una tarjeta con deriva, cuando la persona la abre, entonces el drawer lista los commits posteriores a la aprobación que tocaron el ámbito (hash, fecha, resumen), como evidencia concreta.
5. Dada una spec `Pendiente` (no aprobada), cuando se calcula la deriva, entonces no aplica: sin aprobación no hay línea base contra la cual derivar (coherente con la regla de estado de `sdd-core`).
6. Dado un workspace que no es un repo git, cuando se calcula la deriva, entonces el sistema degrada limpio (sin indicador, sin error) y lo dice una vez.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO una spec esté aprobada y su ámbito de archivos tenga commits con fecha posterior a la fecha de aprobación, EL SISTEMA DEBERÁ marcar la tarjeta como derivada.
- CUANDO una spec aprobada no declare ámbito de archivos, EL SISTEMA DEBERÁ mostrar un estado neutro «ámbito no declarado», distinto de «sin deriva».
- CUANDO la persona abra una tarjeta derivada, EL SISTEMA DEBERÁ listar los commits responsables (hash corto, fecha ISO, primera línea del mensaje).
- SI el workspace no es un repositorio git, ENTONCES EL SISTEMA DEBERÁ omitir el cálculo sin fallar y comunicarlo una sola vez.
- EL SISTEMA NO DEBERÁ llamar a ningún LLM ni a la red para calcular la deriva: es `git log` + rutas + comparación de fechas, en `sdd-core`.
- EL SISTEMA DEBERÁ calcular la deriva en el servidor (`sdd-core`) y enviarla como un campo del board, igual que `tone`; el lienzo, el kanban y el drawer solo la pintan.

## Requisitos

- R1. **Parser del ámbito de archivos.** Leer la sección «Ámbito de archivos / File scope» del `spec.md` y extraer las rutas entre comillas invertidas. Vive en `sdd-core` (junto a `board.ts`).
- R2. **Fecha base = fecha de aprobación.** Tomar «Fecha de aprobación» del bloque de estado. Si es el placeholder sin rellenar (el formato de fecha vacío de la plantilla) y el estado es aprobado, degradar a «no calculable» en vez de comparar contra una fecha falsa.
- R3. **Consulta git acotada.** `git log --since=<fecha> -- <rutas>` desde `projectRoot`, con timeout y límite de resultados. Reusar el patrón de `execFile` que ya usa `packages/sdd-mcp/src/github.ts` (no `exec` con shell).
- R4. **Campo nuevo en el board.** Añadir `drift` a `BoardSpecCard` (por ejemplo `{ state: "clean"|"drifted"|"unscoped"|"unknown", commits?: [...] }`), calculado una vez en `getBoardView` y transportado por API REST y tools MCP, como `tone` (referencia: la decisión de una sola regla de estado, 2026-07-21).
- R5. **Pintado en el builder.** Chip de deriva en `SpecNode` y lista de commits en `SpecDrawer`. Sin recalcular en el cliente. Respetar dark/light y el idioma único de la UI.
- R6. **Pruebas** (depende de la spec 024): ámbito con/sin commits, ámbito no declarado, fecha placeholder, workspace no-git. Deriva es lógica pura sobre entradas controladas → property-friendly.
- R7. **Exponer también en el dashboard y en la tool MCP del board**, para que un agente conectado «vea» la deriva y pueda proponer reconciliar (sin ejecutarla: el hard stop sigue mandando).
- R8. **Documentación** EN/ES en la guía 51: qué significa cada color, y que la deriva es una señal, no un veredicto — decidir si la spec o el código tiene razón sigue siendo humano.

## Propiedades de la spec (opcional, puente a specs ejecutables) / Spec properties (optional)

- Para toda spec aprobada con ámbito no vacío: `drift.state = "drifted"` si y solo si existe al menos un commit con fecha > fecha de aprobación que toca el ámbito.
- Para toda spec no aprobada: `drift` no aplica (la línea base no existe).
- El cálculo de deriva es una función pura de (ámbito, fecha de aprobación, git log) — sin efectos, sin red, sin modelo.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/board.ts` — cálculo de deriva y campo `drift`
- `packages/sdd-core/src/*` — parser del ámbito y consulta git acotada (módulo nuevo si conviene)
- `packages/sdd-mcp/src/schemas.ts` — el campo `drift` en el esquema del board
- `builder/src/components/SpecNode.tsx` — chip de deriva
- `builder/src/components/SpecDrawer.tsx` — lista de commits derivados
- `docs/es/51-guia-visual-sdd-builder.md`, `docs/en/51-sdd-builder-visual-guide.md` — significado de los colores

## Fuera de alcance / Out of scope

- **Reconciliar** automáticamente (reescribir la spec o revertir el código): esta spec **detecta**, no resuelve. Reconciliar toca el hard stop y merece su propia spec.
- Análisis semántico de si el cambio de código realmente contradice la spec: eso sí necesitaría un modelo, y lo delega el agente del usuario (mismo principio que el asistente ✨).
- Deriva a nivel de criterio EARS individual (ese es el puente a specs ejecutables, backlog aparte).
- Integración con GitHub para leer PRs: la fuente es `git log` local.

## Criterios de éxito

- En un repo real, aprobar una spec, tocar un archivo de su ámbito, recargar el board: la tarjeta se pone ámbar sola, sin correr ningún comando.
- El drawer muestra el commit exacto que causó la deriva.
- Cero llamadas a LLM y cero red en el cálculo (verificable por inspección y por prueba).
- Degradación limpia en workspace no-git y con fecha de aprobación placeholder.
