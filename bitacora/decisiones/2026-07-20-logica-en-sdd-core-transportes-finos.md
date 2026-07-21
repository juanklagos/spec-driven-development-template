# Decisión clave - Toda la lógica de negocio vive en `sdd-core`; REST, MCP y dashboard son transportes finos / Key decision - All business logic in sdd-core, thin transports

## Date / Fecha

2026-07-20

## Context / Contexto

El autor pidió una **revisión de coherencia y SOLID** del SDD Builder recién entregado. El hallazgo que la disparó no fue un principio abstracto sino un agujero concreto, registrado en `specs/006-visual-spec-builder/history.md` (bloque «2026-07-20 — revisión de coherencia y SOLID a pedido del autor»):

> **Coherencia MCP (el hallazgo principal)**: el board solo existía como API REST; un agente conectado por MCP no podía verlo ni tocarlo.

El board había salido **ese mismo día**, unas horas antes, en v1.6.0 (`2ba804b`, 2026-07-20 09:14:49 -0500). El refactor llegó a las 10:47. *(Corrección de registro: no pasaron días entre una cosa y la otra, pasaron ~90 minutos.)*

La revisión destapó además dos problemas estructurales:
- **Ciclo de imports latente en `sdd-core`**: `board.ts` importaba de `./index.js`, que a su vez reexporta `board.js` — verificable en `git show a655e2e^:packages/sdd-core/src/board.ts` línea 7. Según la historia de la spec, *"funcionaba solo por hoisting"*.
- **Artefactos compilados obsoletos versionados dentro de `src/`**: `index.js` (542 líneas), `index.js.map` e `index.d.ts` de la era v1.0, borrados en el mismo commit.

## Decision / Decisión

**La lógica compuesta vive en `sdd-core`. REST, MCP, `/builder` y `/dashboard` son superficies finas que la consumen.** Regla literal de la historia de la spec: *"REST y MCP consumen exactamente las mismas funciones: cero lógica duplicada entre transportes"*.

Ejecución en tres frentes (commit `a655e2e`, 2026-07-20 10:47:17 -0500):

1. **Capa compartida en `packages/sdd-core/src/board.ts`**: lo que vivía dentro del handler HTTP (canvas + specs + conteo de tareas; leer→toggle→escribir→releer) se movió a `getBoardView` (`board.ts:291`), `readSpecTasks` (`:267`), `setSpecTaskDone` (`:275`) y `connectBoardCards` idempotente (`:312`).
2. **5 tools MCP** en `packages/sdd-mcp/src/server.ts` sobre esas mismas funciones: `sdd_board_read` (`:366`), `sdd_board_write` (`:389`), `sdd_board_connect` (`:415`), `sdd_read_tasks` (`:441`), `sdd_set_task_done` (`:465`).
3. **Partición del monolito `http.ts`**: de **475 líneas a 68** (verificado con `git show a655e2e^:…/http.ts | wc -l` = 475 y `git show a655e2e:…/http.ts | wc -l` = 68), repartidas en módulos cohesivos — `workspace.ts`, `events.ts` (hub SSE como factory con `dispose()`), `dashboard.ts`, `api.ts` (handler REST como factory con dependencias explícitas), `static.ts`, `transport.ts`, `http-utils.ts`. Mismas rutas, mismos formatos, mismos códigos de estado.

En paralelo se rompió el ciclo extrayendo las primitivas compartidas (`resolveSddRoot`, `listSpecs`, `getFrameworkRoot`, `ensureProjectRootAllowed`) a un módulo interno `packages/sdd-core/src/workspace.ts`.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Dejar el board como API REST exclusiva del frontend** | Es exactamente el estado que se corrigió — lo que había salido en v1.6.0 esa misma mañana. Deja fuera al usuario principal del template: el agente conectado por MCP |
| **Duplicar la lógica en cada transporte** | Rechazada explícitamente en la historia de la spec: *"cero lógica duplicada entre transportes"*. Dos copias de la regla de tareas divergen en la primera corrección de bug |
| **Dejar `http.ts` monolítico y solo añadir las tools** | Habría resuelto la coherencia MCP sin resolver la causa: la lógica seguía dentro del handler HTTP y no había desde dónde llamarla sin arrastrar el transporte |

No consta una evaluación formal de alternativas ni un documento de investigación en `idea/` para esta decisión. Fue una pasada de refactor pedida por el autor y ejecutada en una sesión; las «alternativas» de arriba son las que la evidencia deja ver como descartadas (el estado previo y la duplicación nombrada), no un análisis comparativo que haya existido.

## Consequences / Consecuencias

**A favor**
- El patrón se volvió el default de todo lo que vino después. `specs/007-builder-v2-easy/history.md:9` lo cita literalmente — *"siguiendo el patrón SOLID de spec 006: lógica de negocio en `sdd-core` (`getGateSummary`, `approveSpec` + `updateSpecSections`), transportes finos"*. `specs/008-builder-v3-ai/history.md:9`: *"siguiendo el patrón SOLID de specs 006/007"*. `specs/009-builder-v4-teams/history.md` lo llama *"el patrón de capas de specs 006-008"*. La spec 010 no lo nombra, pero lo aplica (`updateSpecSections` en core, API + tools MCP como espejos).
- Pagó dividendo concreto en la spec 010: cuando la regla de estado de una spec apareció **duplicada en cuatro sitios y divergiendo**, había un sitio obvio donde consolidarla (`specTone` en `sdd-core`) y los cuatro consumidores solo la pintan.
- Es la materialización tardía de la decisión del **2026-03-18** (`bitacora/decisiones/2026-03-18-separacion-sdd-core-y-sdd-mcp.md`): la separación existía en el árbol de paquetes desde marzo, pero el board de julio la había saltado.

**Costos aceptados**
- Cada feature nueva paga el peaje de pasar por `sdd-core` aunque solo la consuma una superficie.
- Hay que extender `scripts/test-mcp-integration.mjs` con cada tool nueva (el board añadió cobertura desde la línea 304).
- El monolito no desapareció, se movió: `dashboard.ts` tiene hoy 928 líneas. `http.ts` volvió a crecer de 68 a 111 tras las specs 007-010.

**Dónde está escrita la regla — y dónde no**
- Está en `specs/006-visual-spec-builder/history.md` y en `CHANGELOG.md:90-94` (v1.6.1).
- **No** está enunciada como regla de arquitectura en `docs/` ni en `template-context/`: `docs/es/42-mapa-organizacion-proyecto.md:221` dice solo que *"`sdd-core` contiene la lógica reusable"*. Lo más cercano a una regla escrita en código son los comentarios de cabecera de `packages/sdd-mcp/src/github.ts:2` y `security.ts:5`, ambos posteriores.

**Verificación (commit `a655e2e`)**
- Build + typecheck del monorepo en verde; `npm run mcp:test` extendido con las 5 tools del board (nodo y conteos verificados, toggle escrito a disco, edge persistida en `board.canvas`); 3 scripts SDD en 0 errores; smoke REST contra sandbox sidecar sin regresión.
- Publicado en `ff47335` — *release: prepare v1.6.1 - MCP board tools + SOLID refactor* (2026-07-20 10:57:26 -0500).

## Cuándo revisar esta decisión / When to revisit

Esta decisión **está vigente** y es hoy la regla de arquitectura más citada del proyecto. Conviene reabrirla si:

- **`sdd-core` se convierte en el nuevo monolito.** Si el paquete deja de ser un conjunto de módulos cohesivos y pasa a ser un cajón de sastre, la respuesta no es abandonar la regla sino partir `sdd-core` (ya empezó: `board.ts`, `spec-actions.ts`, `workspace.ts`).
- **Aparece un transporte que no encaja.** Un cliente que necesite streaming, estado de sesión o autorización propia puede requerir lógica que no tiene sentido en un core sin transporte. El precedente ya existe en la dirección contraria: `github.ts` y `security.ts` viven en `sdd-mcp` **a propósito** porque son transporte.
- **El peaje empieza a frenar features.** Si varias features seguidas ponen en `sdd-core` funciones que un solo consumidor usa y que nunca se comparten, la regla está cobrando sin devolver.
- **La regla se documenta de verdad.** Hoy vive en historias de spec y en el CHANGELOG. Al escribirla en `docs/42` o en `template-context/core-instructions/`, revisar si el enunciado sigue siendo el correcto o si la práctica de las specs 007-010 ya lo matizó.
- **`dashboard.ts` (928 líneas) se toca en serio.** Es la pieza que hoy contradice el espíritu del refactor; cualquier trabajo grande ahí es el momento natural de aplicarle la misma partición.
