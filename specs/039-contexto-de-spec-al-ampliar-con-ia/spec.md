# Especificación 039 - Ampliar con IA ve la spec, no solo el campo

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-20`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobado en sesión del 2026-08-20: alcance A+D de las cuatro opciones presentadas — bajar al botón el contexto de la spec que el cajón ya tiene cargado, hacerlo viajar por los dos caminos, e instruir a la skill a leer el workspace cuando le falte. Quedan fuera el brief de proyecto y la selección de decisiones (opciones B y C), que se evaluarán aparte.

## Objetivo

Que una propuesta de «Ampliar con IA» esté alineada con la spec que la pide.
Hoy el modelo redacta los criterios de aceptación sin haber visto la historia
de usuario que está tres centímetros más arriba en la misma pantalla.

## Historia de usuario principal

Como persona redactando una spec, quiero que la IA que amplía un campo conozca
el resto de la spec, para que lo que proponga use su vocabulario, respete su
alcance y no contradiga lo que ya escribí.

## Contexto (medido, no supuesto)

Leído en el código el 2026-08-20:

- **La petición lleva tres cosas**: `target`, `currentText` e `instruction`
  (`packages/sdd-core/src/requests.ts:44`). Nada más.
- **El contexto que falta ya está cargado.** `SpecDrawer` llama a
  `api.getSpec(specId)` (`SpecDrawer.tsx:702`), que devuelve `SpecDetail.docs`
  con `spec`, `plan` y `tasks` en crudo. El `AiAssistButton` recibe solo
  `kind`, `specId`, `refId` y `currentText` (`AiAssistButton.tsx:26`): el
  contexto está en memoria, un nivel más arriba, y nadie lo baja.
- **Tamaños reales**, medidos sobre cinco specs: `spec.md` entre 4.9 KB y
  10.5 KB, `plan.md` entre 2.3 KB y 5.8 KB. Trivial para un agente por MCP;
  no trivial para el prompt copiable, que una persona pega a mano.
- **Cinco puntos de montaje** del botón: dos en `SectionEditor`, uno en
  `SpecDrawer`, uno en `NoteNode` y uno en `BitacoraModal`. Solo los tres
  primeros tienen una spec detrás; las notas del lienzo y la bitácora no.
- **La skill permite leer, pero no lo pide.** `SERVE_QUEUE_INSTRUCTIONS`
  (`packages/sdd-core/src/connect.ts:36`) dice «no inventes contexto que no
  esté en la petición ni en el workspace». Autoriza el workspace; no instruye
  a consultarlo.
- **Las copias de la skill pueden divergir.** `.claude/skills/sdd-serve/SKILL.md`
  y `.agents/skills/sdd-serve/SKILL.md` están versionadas y se generan desde
  `connect.ts`, pero ninguna prueba comprueba que sigan a su fuente:
  `connect.test.ts:223` verifica el contenido de las constantes, no el de los
  archivos.

## Decisiones que esta spec fija

1. **El contexto es un campo propio, no parte de la instrucción.** `context`
   es material de fondo, de solo lectura; `instruction` es lo que la persona
   pide. Mezclarlos invita al modelo a tratar la spec como si fuera una orden.
2. **La sección que se edita no se duplica.** Ya viaja como `currentText`;
   repetirla en el contexto gasta presupuesto y confunde sobre qué hay que
   reescribir.
3. **Los dos caminos llevan lo mismo.** Igual que la 036 hizo con la revisión:
   el prompt copiable y la petición de cola comparten contenido, o las dos
   puertas dejan de dar el mismo producto.
4. **Con presupuesto explícito.** El contexto se recorta a un tope declarado, y
   cuando se recorta se dice en el propio texto.

## Escenarios de aceptación

1. Dada una spec con historia de usuario escrita, cuando pido ampliar los
   criterios de aceptación, entonces la petición incluye esa historia como
   contexto.
2. Dado ese mismo caso, cuando la spec supera el presupuesto, entonces el
   contexto llega recortado y el texto declara que se recortó.
3. Dada una nota del lienzo o una entrada de bitácora, cuando pido ampliar,
   entonces no se envía contexto de spec, porque no hay spec.
4. Dado que no hay agente conectado, cuando uso el prompt copiable, entonces
   contiene el mismo contexto que llevaría la petición.
5. Dada la sección que estoy editando, cuando reviso el contexto enviado,
   entonces esa sección no aparece duplicada.

## Criterios de aceptación (formato EARS recomendado)

- CUANDO se cree una petición desde una superficie con spec, EL SISTEMA DEBERÁ
  adjuntar el resto de la spec y su plan como `context`.
- CUANDO el contexto supere el tope declarado, EL SISTEMA DEBERÁ recortarlo y
  marcar el recorte en el texto.
- SI la superficie no pertenece a una spec, ENTONCES EL SISTEMA DEBERÁ omitir
  `context`.
- CUANDO se genere el prompt copiable, EL SISTEMA DEBERÁ incluir el mismo
  contexto que la petición equivalente.
- CUANDO un agente reclame una petición, EL SISTEMA DEBERÁ indicarle que
  `context` es material de fondo y que puede leer el workspace si necesita más.

## Requisitos

- R1 — Campo `context` opcional en `AiRequest` y en `CreateAiRequestInput`
  (`sdd-core`), en el esquema zod del MCP y en el JSON persistido.
- R2 — El builder lo compone desde `SpecDetail.docs`, ya en memoria, excluyendo
  la sección en edición.
- R3 — Presupuesto de tamaño declarado como constante, con marca de recorte.
- R4 — `buildFieldPrompt` incluye el mismo contexto.
- R5 — `SERVE_QUEUE_INSTRUCTIONS` instruye: usar `context` como fondo de solo
  lectura, y leer el workspace cuando falte algo.
- R6 — Prueba que comprueba que las copias versionadas de `SKILL.md` siguen a
  su fuente.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/requests.ts` — el campo
- `packages/sdd-core/src/connect.ts` — las instrucciones de la skill
- `packages/sdd-mcp/src/server.ts` — el esquema
- `builder/src/components/AiAssistButton.tsx` — recibe y envía
- `builder/src/components/SectionEditor.tsx`, `SpecDrawer.tsx` — lo pasan
- `builder/src/prompts.ts` — el camino copiable

## Criterios de éxito

- Ampliar un campo de una spec propone texto que usa su vocabulario y respeta
  su alcance.
- Ninguna superficie sin spec envía contexto.
- El payload nunca supera el tope, y cuando lo roza, lo dice.
- Las copias de la skill no pueden divergir sin poner una prueba en rojo.
