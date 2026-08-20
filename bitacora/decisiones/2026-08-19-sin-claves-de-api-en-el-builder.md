# Decisión importante - La revisión por IA no trae claves de API al builder

## Date / Fecha

2026-08-19 — decidido en el chat de la spec 036, antes de escribir código
(`specs/036-revision-ia-y-asistente-sin-bloqueo/history.md`, fila del
2026-08-19 «Decision / Decisión»).

## Context / Contexto

El propietario pidió «que los usuarios puedan conectar IA para que revisen las
specs, ojalá desde el mismo builder». Ese *ojalá desde el mismo builder* admitía
dos lecturas incompatibles, y se le preguntó cuál era. Su respuesta fue
«ayúdame a decidir cuál es la mejor opción en base a las herramientas que ya
existen y la facilidad para el usuario».

Lo que ya existía, leído en el código el mismo día (`research.md` de la 036):

- La cola de peticiones completa (spec 031): `POST /api/request`,
  `GET /api/requests` con presencia, `POST /api/request/:id/resolve`, el ciclo
  instrucción → propuesta → diff → acepta la persona, y presencia fresca a 5
  minutos (`AGENT_FRESH_MS` en `builder/src/requests.ts`).
- `sdd-mcp connect` (spec 032), que deja configurados 7 clientes MCP en un
  comando (`AGENT_CLIENTS`, `packages/sdd-core/src/connect.ts:144`).
- El prompt copiable (`buildFieldPrompt`, `PromptBox`), que ya permitía
  llevarse el trabajo a cualquier IA sin API ni MCP — pero sin viaje de vuelta.

La fricción real que el propietario describía no era dónde vive una clave: era
tener que abrir terminal, reiniciar el cliente y mantener viva una sesión con
`/sdd-serve`.

## Decision / Decisión

**El builder no guarda claves de API ni llama a ningún proveedor.** La revisión
de specs se sirve por dos caminos, los dos sin secretos: la cola de agentes
cuando hay uno escuchando, y **pegar la respuesta** de cualquier IA cuando no lo
hay.

Aterrizó en `builder/src/components/ReviewPanel.tsx` (las dos puertas),
`builder/src/review.ts` (el analizador único que ambas comparten) y
`builder/src/prompts.ts` (`buildReviewPrompt`, el mismo texto para las dos).
La prohibición no queda en prosa: `builder/src/review-surface.test.ts` falla si
aparece una credencial, un `fetch` o una URL externa en esos módulos.

## Alternatives considered / Alternativas consideradas

1. **Clave de proveedor en el builder** (Anthropic, OpenAI, compatible o local).
   Rechazada por tres costes que los otros caminos no tienen: un secreto en
   disco, con su decisión de dónde vive y qué pasa al compartir el workspace;
   salida a internet desde un servidor que hoy solo toca ficheros
   (`packages/sdd-mcp/src/security.ts` está escrito para lo primero, y añadir
   egress cambia el modelo de amenaza del producto entero, no de esta función);
   y adaptadores por proveedor —modelos, límites, errores, coste— como trabajo
   permanente. A cambio no compra nada que los dos caminos elegidos no den.
2. **Solo la cola MCP.** Rechazada por insuficiente: deja fuera exactamente a
   las IA que motivaron la petición, las que no son uno de los 7 clientes.
3. **Solo ampliar el catálogo de clientes MCP.** Rechazada: sigue siendo una
   lista cerrada. La IA que no esté, no entra.

También se decidió que la revisión devuelve **hallazgos anclados, no
reescrituras**. El parche existe como atajo al «Ampliar con IA» de esa sección,
que ya pasa por diff y firma humana; así no nace un segundo camino de escritura
ni se invita a aceptar una spec entera a ciegas.

## Consequences / Consecuencias

- Cualquier IA sirve, incluidas las que no tienen API: el camino de pegado no
  pide nada más que copiar y pegar.
- El servidor local sigue sin tráfico saliente y sin secretos. La postura de
  seguridad no cambia por esta funcionalidad.
- A cambio: el camino de pegado tiene dos pasos manuales que una clave habría
  ahorrado. Es el trade-off aceptado.
- El analizador (`parseReview`) queda como frontera: es tolerante con el
  formato pero estricto con el ancla, porque una IA cualquiera puede inventar
  secciones y un hallazgo sin ancla no lleva a ninguna parte.

## When to revisit / Cuándo revisar esta decisión

Cuando se cumpla alguna:

- El camino de pegado se demuestre insuficiente con uso real —no con
  suposición—: gente que abandona la revisión por los dos pasos manuales.
- Aparezca una forma de delegar la llamada sin que el secreto viva en el
  workspace (por ejemplo, que el cliente MCP ya autenticado haga de puente).
- El producto adquiera salida a internet por otra razón, de modo que el coste 2
  deje de ser marginal y pase a estar ya pagado.
