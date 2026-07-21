# Decisión clave - Una sola regla de estado de spec (`specTone` en sdd-core) y la aprobación manda / Key decision - One spec-state rule, approval first

## Date / Fecha

2026-07-21

## Context / Contexto

El disparador no fue un principio abstracto: fue un hallazgo durante la verificación del rediseño del `/dashboard`, registrado en `specs/010-builder-v5-pro-ux/history.md`, bloque **«2026-07-21 (seguimiento: el dashboard y la regla de estado)»**. La regla que decide si una spec está pendiente, aprobada o hecha estaba **duplicada en cuatro sitios y divergía**:

> «`SpecNode` usaba `/aprobado|approved/i` (no reconocía "Aprobada"), el kanban `/aprobad[oa]|approved/i`, el drawer una tercera copia para habilitar "Implementar con agente", y el dashboard exigía aprobación para "hecha".»

Consecuencias observadas en la misma entrada, no hipotéticas:

- Una spec **`Aprobada`** salía **pendiente en el lienzo** pero **aprobada en el kanban**.
- Una spec con **todas las tareas marcadas y sin aprobar** salía **«Hecha» en el lienzo** y **«Pendiente» en el dashboard**.

Lo grave está escrito en el propio código (`packages/sdd-core/src/board.ts`): la copia **más estricta** era la de la compuerta, así que una spec etiquetada `Aprobada` estaba verde y con «Implementar» habilitado en el builder mientras el gate contaba **cero specs aprobadas** y por tanto **saltaba todos los chequeos de calidad de aprobación** — fecha placeholder, aprobador placeholder, evidencia vacía, plan inconsistente, tareas ausentes y log de consentimiento. El comentario lo nombra sin adornos: *«Failing that way round means the product's core promise silently failed open»* (`packages/sdd-core/src/board.ts:405-406`, árbol de trabajo; ver «Cabo suelto»).

## Decision / Decisión

**Colapsar la regla en `sdd-core`** como un par de predicados:

- `isApprovedStatus(status)` — `packages/sdd-core/src/board.ts:293` en HEAD (`9ff2ecb`).
- `specTone(status, tasks)` — `packages/sdd-core/src/board.ts:303-306` en HEAD.

El resultado se calcula **una vez** en `getBoardView` (`board.ts:302`, `tone: specTone(spec.status, tasks)`) y viaja como **`BoardSpecCard.tone`** por la API REST y las tools MCP (`packages/sdd-mcp/src/schemas.ts:81`, `tone: z.enum(["pending", "ok", "done"])`, ya commiteado). Lienzo, kanban, drawer y dashboard **solo lo pintan**, sin recalcular:

- `builder/src/components/SpecNode.tsx:22` — `const tone = spec?.tone ?? "pending"`.
- `builder/src/components/KanbanBoard.tsx:33-38` — *«Column from the tone computed once in sdd-core»*.
- `builder/src/components/SpecDrawer.tsx:459-461` — `const isApproved = summary ? summary.tone !== "pending" : false`.
- `packages/sdd-mcp/src/dashboard.ts:742` y `packages/sdd-mcp/src/app-ui.ts:119-122` — *«This view only paints it»*.

**La aprobación se evalúa primero.** `specTone` devuelve `"pending"` antes de mirar el progreso: una spec con todas las tareas marcadas pero sin aprobar **nunca** es «Hecha». La razón está escrita al lado del código (`board.ts:297-302`):

> «under the golden rule a spec that was never approved is not "done" no matter how many boxes are ticked — that combination is precisely the anti-pattern this template exists to surface.»

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Arreglar las cuatro regex por separado** | Se eligió fuente única porque la divergencia **sobrevivió tres releases de features** (specs 007, 008, 009) sin que nadie la notara: cuatro copias correctas hoy vuelven a divergir mañana |
| **Derivar «hecha» solo del progreso de tareas** | Es exactamente el anti-patrón que el hard stop del template existe para bloquear: marcar casillas no aprueba nada |
| **Espejo único aceptado** | `builder/src/sections.ts:145-148` conserva una copia para la pestaña que lee markdown crudo (el bundle del builder no importa `sdd-core`), anotada *«Mirror of sdd-core `isApprovedStatus` — keep in sync»*. Excepción documentada, no descuido |

Regla emparentada que se mantiene, de `specs/009-builder-v4-teams/spec.md:25`: **arrastrar entre columnas del kanban NO cambia la aprobación** — el drag es lectura de estado con CTA al botón Aprobar.

## Consequences / Consecuencias

**A favor**
- Un solo lugar donde discutir qué significa «aprobada» y qué significa «hecha».
- El fallo peligroso (verde en la UI, invisible para el gate) deja de ser posible por construcción en TypeScript.
- Asserts de regresión de los dos casos borde añadidos a `npm run mcp:test`, y `tone` incluido en el esquema de salida de las tools MCP (`schemas.ts:81`).

**Cabo suelto — lo que NO está cerrado en lo commiteado**
- En HEAD (**commit `9ff2ecb`, 2026-07-21 10:44:59 -0500**) la unificación cubre **solo TypeScript**. `scripts/check-sdd-gate.sh:106` sigue usando su propia expresión anclada:
  ```sh
  if echo "$status_value" | grep -E -i -q "^(Aprobado|Approved)$"; then
  ```
  que **no casa** con `Aprobada` ni con `Aprobado / Approved`. **La divergencia TS↔bash aún no está cerrada en lo commiteado.**
- La constante compartida `APPROVED_STATUS_ERE = "aprobad[oa]|approved"` (con su comentario *«KEEP IN SYNC with `SDD_APPROVED_STATUS_ERE` in scripts/check-sdd-gate.sh»*), el `SDD_APPROVED_STATUS_ERE` del script y el assert de deriva de `scripts/test-mcp-integration.mjs:829-835` existen **solo en el árbol de trabajo, sin commitear** (trabajo en curso de otro flujo). Verificado: `git show HEAD:scripts/check-sdd-gate.sh` y `git show HEAD:scripts/test-mcp-integration.mjs` no contienen esas constantes. **No presentar el cierre como hecho hasta que aterrice.**

**Vigencia**
- Vigente. Ningún registro posterior la reemplaza.

**Cuándo revisar esta decisión / When to revisit**
- **Cuando aterrice el commit** que lleva `APPROVED_STATUS_ERE` al script bash: entonces este registro debe actualizarse para retirar el cabo suelto (y solo entonces).
- Si aparece **una quinta superficie** que necesite decidir estado (extensión de editor, CLI, GitHub Action) y no pueda importar `sdd-core`: cada nuevo espejo obliga a reevaluar el mecanismo de sincronización, no a añadir otra regex en silencio.
- Si el vocabulario de estados **deja de ser binario** (p. ej. «Aprobada con reservas», «Obsoleta»): `specTone` con tres tonos ya no alcanza y la regla debe rediseñarse, no parchearse.
- Si alguna vez se pide que el kanban **apruebe al arrastrar**: eso rompe el orden aprobación-primero y exige revisar esta decisión junto con la de la spec 009.
- Si el assert de deriva de `mcp:test` empieza a fallar de forma recurrente: señal de que el pareo TS↔bash por constante literal no es suficiente y hace falta generar el script desde la fuente única.
