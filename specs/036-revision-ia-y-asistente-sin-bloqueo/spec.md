# Especificación 036 - Revisión de specs por IA, y un asistente que no se bloquea

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-19`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-08-19: «si me parece, cubre todo nivel senior con solid» — aprobación del alcance completo, con SOLID como restricción de diseño de la implementación (ver plan.md)

## Objetivo

Que el asistente sirva también en un proyecto que ya tiene specs, y que
cualquier IA pueda revisar una spec desde el propio lienzo — con agente MCP
conectado o sin él.

## Historia de usuario principal

Como persona que ya tiene specs escritas, quiero seguir usando el asistente
para añadir trabajo nuevo, y quiero que una IA me diga qué le falta a una
spec antes de aprobarla, sin abrir una terminal ni entregar una clave.

## Contexto (medido, no supuesto)

Leído en el código el 2026-08-19, no supuesto:

- **El asistente se bloquea con specs.** `AssistantWizard.tsx` pinta un aviso
  ámbar (`assistant.hasSpecs`: «el asistente solo se aplica en un workspace
  vacío») y deshabilita el CTA con `disabled={busy || hasSpecs || …}`. Debajo,
  `store.ts:492` (`applyBoardPlan`) lanza `error.templatesNonEmpty` en cuanto
  `board.specs.length > 0`. Resultado: puedes escribir la descripción y ver la
  propuesta, pero el botón de crear nunca se enciende. Un callejón sin salida
  con vista previa.
- **La otra mitad del asistente sí funciona con specs**: `createStructured`
  (ruta «Estructurar con IA», spec 031 R5) crea la spec con
  `POST /api/spec` + `PUT sections` y no consulta `hasSpecs`. Es decir, el
  producto ya sabe añadir una spec a un workspace poblado; solo la ruta del
  board completo lo prohíbe.
- **La cola de IA ya está construida y probada** (spec 031): tipos
  `draft-field` y `structure-idea`, rutas `POST /api/request`,
  `GET /api/requests` (lista + presencia) y `POST /api/request/:id/resolve`,
  presencia fresca a 5 min (`AGENT_FRESH_MS`) y petición estancada a 10 min
  (`STALLED_MS`), y el ciclo instrucción → propuesta → diff → **acepta la
  persona**.
- **Reclamar y responder es hoy solo MCP**: `sdd_next_request` y
  `sdd_respond_request` (`packages/sdd-mcp/src/server.ts:1121` y `:1145`).
  `AGENT_CLIENTS` (`packages/sdd-core/src/connect.ts:144`) trae 7 clientes:
  Claude Code, Codex, Cursor, VS Code, Windsurf, Gemini CLI y opencode. Una IA
  que no sea uno de esos siete no tiene por dónde entrar.
- **El prompt copiable existe; el viaje de vuelta no.** `PromptBox`,
  `buildFieldPrompt` y `buildOrchestratorPrompt` ya permiten llevarse el
  trabajo a cualquier IA sin API ni MCP. Lo que no hay es forma de traer la
  respuesta de vuelta al builder: se queda en el chat.
- **La IA ya llega a todas las superficies de contenido**: `ai-surfaces.test.ts`
  fija el contrato — las 7 secciones de la plantilla, tareas, notas y bitácora
  montan `AiAssistButton`; aprobación y consentimiento no montan nada, por
  diseño. El hueco no es *qué* se puede pedir, es *quién* puede atender.
- **Ya existe señal de calidad por sección**: `scoreSpec` y
  `lintEarsCriterion` (duplicado a propósito en `builder/src/ears.ts`) producen
  avisos anclados. Una revisión por IA se puede presentar con ese mismo idioma
  visual en vez de inventar otro.

## Decisiones que esta spec fija

1. **No hay claves de API en el builder.** Es la única opción que guardaría un
   secreto en disco y convertiría un servidor que hoy solo toca ficheros en uno
   con salida a internet (`packages/sdd-mcp/src/security.ts` está escrito para
   lo primero). No compra nada que los dos caminos elegidos no den.
2. **Dos caminos para la revisión**: la cola cuando hay agente (reutiliza todo
   lo de la spec 031) y **pegar la respuesta** cuando no lo hay. El segundo es
   el que hace verdad «cualquier IA»: funciona con las que ni siquiera tienen
   API.
3. **La revisión devuelve hallazgos, no reescrituras.** El parche existe, pero
   como atajo al «Ampliar con IA» de esa sección, que ya pasa por diff y firma
   humana. Así no nace un segundo camino de escritura.

## Escenarios de aceptación

1. Dado un workspace con 3 specs, cuando abro el asistente y describo trabajo
   nuevo, entonces puedo elegir entre proponer una spec o proponer un board
   completo, y el botón de crear está activo.
2. Dado ese mismo workspace, cuando acepto la propuesta, entonces las specs y
   los nodos nuevos se añaden y los 3 anteriores siguen igual, con su
   numeración y su posición intactas.
3. Dado un workspace vacío, cuando uso el asistente, entonces se comporta como
   hasta hoy: idea, épicas y specs conectadas.
4. Dada una spec abierta y un agente atendiendo la cola, cuando pulso «Revisar
   con IA», entonces la petición aparece como pendiente y la revisión llega
   sola al panel.
5. Dada una spec abierta y ningún agente conectado, cuando pulso «Revisar con
   IA», entonces obtengo el prompt completo copiable y un campo donde pegar la
   respuesta de la IA que yo quiera.
6. Dada una revisión recibida por cualquiera de los dos caminos, cuando la
   leo, entonces veo hallazgos anclados a su sección, con severidad y motivo, y
   ninguno ha tocado el disco.
7. Dado un hallazgo sobre «criterios», cuando pulso su acción, entonces se abre
   el «Ampliar con IA» de esa sección con la instrucción ya escrita, y sigue
   haciendo falta que yo acepte el diff.

## Criterios de aceptación (formato EARS recomendado)

- R1 — CUANDO el usuario abra el asistente, EL SISTEMA DEBERÁ ofrecer sus dos
  acciones («proponer una spec» y «proponer board completo») tanto con 0 specs
  en el workspace como con 1 o más.
- R2 — CUANDO el usuario acepte una propuesta del asistente sobre un workspace
  que ya tiene specs, EL SISTEMA DEBERÁ añadir lo nuevo sin borrar, renombrar
  ni renumerar ninguna spec existente, y sin quitar ningún nodo ni arista del
  lienzo.
- R3 — CUANDO el asistente añada nodos a un lienzo que ya tiene nodos, EL
  SISTEMA DEBERÁ colocarlos de forma que ninguna caja nueva se solape con
  ninguna existente: la intersección de rectángulos DEBERÁ ser 0 px².
- R4 — SI la creación de una spec del lote falla a mitad, ENTONCES EL SISTEMA
  DEBERÁ conservar las ya creadas, nombrar la que falló y dejar el lienzo
  coherente con lo que hay en disco.
- R5 — CUANDO el usuario pida revisar una spec y exista presencia de agente más
  fresca que 5 minutos, EL SISTEMA DEBERÁ publicar una petición de tipo
  `review-spec` en la cola existente y mostrar su estado con los mismos
  umbrales que el resto (pendiente, en curso, estancada a los 10 minutos).
- R6 — CUANDO no exista presencia de agente fresca, EL SISTEMA DEBERÁ ofrecer
  el prompt de revisión completo y copiable, con el texto de la spec dentro, y
  un campo donde pegar la respuesta de cualquier IA, que DEBERÁ interpretarse
  con el mismo analizador que la respuesta llegada por la cola.
- R7 — CUANDO llegue una revisión por cualquiera de los dos caminos, EL SISTEMA
  DEBERÁ presentarla como lista de hallazgos, cada uno anclado a una de las 7
  secciones de la plantilla, con severidad y motivo.
- R8 — SI la respuesta no se puede interpretar como hallazgos, ENTONCES EL
  SISTEMA DEBERÁ decirlo y permitir pedir o pegar de nuevo, sin perder lo que
  el usuario ya tenga escrito en pantalla.
- R9 — CUANDO el usuario actúe sobre un hallazgo, EL SISTEMA DEBERÁ abrir el
  «Ampliar con IA» de esa sección con la instrucción precargada, de modo que
  toda escritura siga pasando por el diff que la persona acepta.
- R10 — CUANDO se reciba una revisión, EL SISTEMA NO DEBERÁ escribir por su
  cuenta en `spec.md`, `tasks.md` ni en la bitácora.
- R11 — CUANDO se muestre el panel de aprobación o el de consentimiento, EL
  SISTEMA NO DEBERÁ ofrecer ninguna acción de IA, manteniendo el contrato que
  `ai-surfaces.test.ts` ya defiende.
- R12 — CUANDO se use cualquiera de los dos caminos de revisión, EL SISTEMA NO
  DEBERÁ guardar claves de API ni emitir peticiones a servidores externos desde
  el servidor local.

## Requisitos

- `applyBoardPlan` con modo de adición: crea specs nuevas y fusiona el lienzo
  en vez de exigirlo vacío.
- Colocación de los nodos nuevos por debajo del contenido existente, calculada
  a partir de las cajas presentes.
- Dos acciones explícitas en el asistente, disponibles siempre.
- Tipo de petición `review-spec` en la cola (núcleo, MCP y builder).
- Panel de revisión en el drawer de la spec, con los dos caminos.
- Analizador puro de la respuesta, compartido por cola y pegado.
- Atajo de hallazgo → «Ampliar con IA» de su sección.

## Fuera de alcance / Out of scope

- Claves de API, adaptadores de proveedor y cualquier salida de red del
  servidor local (decisión 1; se revisará si aparece una razón que hoy no hay).
- Desbloquear la galería de plantillas: una plantilla es un board de arranque
  y su guardia de workspace vacío se queda como está.
- IA en aprobación y consentimiento.
- Aplicar una revisión entera de golpe.
- Ampliar el catálogo de clientes MCP más allá de los 7 actuales.
- Revisar varias specs a la vez o el proyecto entero.

## Propiedades de la spec

- Para todo hallazgo mostrado, DEBERÁ existir la sección a la que ancla, y esa
  sección DEBERÁ ser una de las 7 de la plantilla.
- Para toda propuesta aceptada del asistente, el número de specs en disco
  DEBERÁ ser el previo más el número de specs de la propuesta.
- Para todo par de cajas del lienzo tras añadir, la intersección DEBERÁ ser
  0 px².

## Ámbito de archivos / File scope

- `builder/src/components/AssistantWizard.tsx`
- `builder/src/components/SpecDrawer.tsx`
- `builder/src/components/ReviewPanel.tsx` — nuevo
- `builder/src/review.ts` — nuevo, analizador puro
- `builder/src/store.ts`
- `builder/src/requests.ts`
- `builder/src/prompts.ts`
- `builder/src/assistant.ts`
- `builder/src/i18n.ts`
- `packages/sdd-core/src/requests.ts`
- `packages/sdd-mcp/src/server.ts`
- `packages/sdd-mcp/src/schemas.ts`

## Criterios de éxito

- El asistente crea trabajo nuevo en un proyecto poblado sin tocar lo anterior.
- Una IA sin MCP y sin API revisa una spec y su revisión entra en el builder.
- Ninguna revisión escribe en disco por sí sola.
- No hay secretos nuevos en disco ni tráfico saliente nuevo.
