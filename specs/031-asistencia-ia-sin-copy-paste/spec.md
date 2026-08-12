# Especificación 031 - Asistencia IA sin copy-paste

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-12`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-08-12: "aprobada, sigue con lo que haga falta" tras revisar alcance ampliado (todo campo editable, R4b exclusión aprobación/consentimiento)

## Historia de usuario principal

Como persona que redacta specs en el builder, quiero pedirle ayuda a mi agente
(Claude Code u otro conectado por MCP) directamente desde el lienzo — ampliar
o redactar cualquier campo editable (secciones de la spec, tareas, notas,
entradas de bitácora), o convertir mi idea en desorden en una spec
estructurada — sin copiar prompts a la terminal ni pegar respuestas de
vuelta, y aprobando yo cada cambio antes de que toque el disco. La IA amplía
mis ideas; no decide por mí.

El builder no llama a ninguna API de IA por sí mismo: publica **peticiones**
que la sesión de agente del usuario recoge por MCP y responde con
**propuestas**. El humano acepta o rechaza en la UI; solo al aceptar se
escribe la spec por las rutas ya existentes. El gate y el consentimiento no
cambian.

## Escenarios de aceptación

1. Dado un agente escuchando la cola (`sdd_next_request`) y una spec abierta en el
   drawer, cuando pulso "Ampliar con IA" en cualquier campo editable de
   contenido (una de las 7 secciones, una tarea, una nota del lienzo o una
   entrada de bitácora en borrador) y escribo una indicación, entonces la
   petición aparece como "pendiente" en la UI sin que yo copie nada, el
   agente la recoge, y al llegar la respuesta veo la propuesta como diff
   (texto actual vs. propuesto) con botones Aceptar y Rechazar.
2. Dado el diff de una propuesta, cuando pulso Aceptar, entonces el builder
   escribe solo esa sección vía `PUT /api/spec/:id/sections`, la tarjeta se
   actualiza en vivo y la petición queda "atendida"; cuando pulso Rechazar,
   el archivo no cambia y la petición queda "rechazada".
3. Dado el asistente de nueva spec, cuando pego mi idea en bruto (braindump)
   y pulso "Estructurar con IA", entonces recibo una propuesta con las
   secciones del template (historia, escenarios, criterios EARS, requisitos)
   ya mapeadas, editable en el preview existente antes de crear la spec.
4. Dado que ningún agente está conectado, cuando pulso cualquier botón de IA,
   entonces el builder me lo dice en el momento y me ofrece el flujo clásico
   de copiar el prompt (PromptBox), sin dejarme esperando.
5. Dada una sesión de Claude Code conectada al tablero, cuando ejecuto la
   herramienta MCP de atender peticiones, entonces recibo la petición más
   antigua pendiente con todo su contexto (spec, sección, texto actual,
   indicación del usuario) y puedo responder con una propuesta sin tocar
   archivos de specs.

## Criterios de aceptación (formato EARS recomendado)

- R1 — CUANDO el usuario envíe una petición de IA desde el builder, EL
  SISTEMA DEBERÁ persistirla en `.sdd/requests/` con id único, tipo
  (`draft-field` | `structure-idea`), objetivo (`{ kind: section | task |
  note | bitacora, specId?, ref }`), texto actual, indicación del usuario y
  estado `pending`, y emitirla por SSE en menos de 2 segundos.
- R2 — CUANDO un agente llame a la herramienta MCP `sdd_next_request`, EL
  SISTEMA DEBERÁ devolver la petición `pending` más antigua marcándola
  `in_progress`, incluyendo el contenido actual de la sección objetivo; SI no
  hay peticiones pendientes, ENTONCES DEBERÁ devolver una respuesta vacía
  explícita (no un error).
- R3 — CUANDO un agente llame a `sdd_respond_request` con una propuesta, EL
  SISTEMA DEBERÁ guardar la propuesta en la petición (estado `answered`) SIN
  modificar ningún archivo bajo `specs/`, y notificar al builder por SSE en
  menos de 2 segundos.
- R4 — CUANDO llegue una respuesta a una petición `draft-field`, EL BUILDER
  DEBERÁ mostrar un diff entre el texto actual y el propuesto, con acciones
  Aceptar y Rechazar; CUANDO el usuario acepte, EL SISTEMA DEBERÁ escribir
  únicamente el campo afectado vía su ruta de escritura ya existente
  (secciones, tareas, nota del canvas o bitácora); CUANDO rechace, EL
  SISTEMA DEBERÁ dejar los archivos intactos y marcar la petición
  `rejected`.
- R4b — EL BUILDER DEBERÁ ofrecer "Ampliar con IA" en el 100% de los campos
  editables de contenido (las 7 secciones de spec.md, texto de tareas, notas
  del lienzo y entradas de bitácora en borrador) y en NINGÚN campo de
  aprobación o consentimiento (aprobador, evidencia, resumen de consenso):
  esos siguen siendo entrada humana exclusiva.
- R5 — CUANDO llegue una respuesta a una petición `structure-idea`, EL
  BUILDER DEBERÁ precargar el preview editable del asistente (AssistantWizard)
  con las secciones propuestas, y la spec solo se creará cuando el usuario
  confirme, por la ruta `POST /api/spec` + secciones existente.
- R6 — SI ningún agente ha consultado la cola (`sdd_next_request`) en los
  últimos 5 minutos, ENTONCES EL BUILDER DEBERÁ mostrar el estado "sin
  agente conectado" junto a los botones de IA y ofrecer el prompt copiable
  clásico como alternativa en la misma vista.
- R7 — CUANDO exista al menos una petición `pending` o `in_progress`, EL
  BUILDER DEBERÁ mostrar su estado (pendiente / en curso / atendida) visible
  sin abrir menús, actualizado por SSE sin recargar la página.
- R8 — CUANDO una petición lleve más de 10 minutos sin pasar de `pending`,
  EL BUILDER DEBERÁ marcarla visualmente como estancada y ofrecer cancelarla;
  CUANDO el usuario cancele, EL SISTEMA DEBERÁ marcarla `cancelled` y el
  agente no DEBERÁ recibirla en `sdd_next_request`.

## Requisitos

- Cola de peticiones en disco (`.sdd/requests/*.json`), legible por humanos,
  con ciclo de vida `pending → in_progress → answered → accepted/rejected`
  (o `cancelled`).
- Dos herramientas MCP nuevas: `sdd_next_request` y `sdd_respond_request`,
  registradas en el mismo servidor que el resto (misma paridad REST/MCP que
  estableció la spec 028).
- Rutas REST espejo para el builder: crear petición, listar activas,
  aceptar/rechazar/cancelar.
- Las propuestas nunca escriben specs: la escritura solo ocurre al aceptar,
  por `updateSpecSections` / `createSpec` existentes. El gate no se toca.
- UI: botón "Ampliar con IA" en todo campo editable de contenido
  (`SectionEditor`, tareas del `SpecDrawer`, `NoteNode`, formularios de
  `BitacoraModal`), "Estructurar con IA" en `AssistantWizard`, indicador de
  peticiones activas, y fallback al PromptBox clásico cuando no hay agente.
- Los campos de aprobación y consentimiento quedan explícitamente sin botón
  de IA (R4b): son la firma humana del gate.
- Documentar en la guía del builder cómo dejar una sesión "escuchando el
  tablero" (por ejemplo `/loop` + `sdd_next_request`).

## Fuera de alcance / Out of scope

- Chat embebido o agente hosteado por el builder (Agent SDK): queda para una
  spec futura; esta spec construye el canal sobre el que se montaría.
- Llamadas directas del builder a APIs de IA (no hay API keys en el builder).
- Presencia rica del agente en el lienzo (qué spec toca, última acción):
  solo el binario conectado/no conectado de R6.
- Dictado por voz para el braindump.
- Multi-agente: una cola única, orden FIFO, sin prioridades.

## Propiedades de la spec (opcional, puente a specs ejecutables)

- Para toda petición en cualquier estado, EL SISTEMA nunca DEBERÁ haber
  modificado archivos bajo `specs/` antes de que esa petición esté
  `accepted`.
- Para toda transición de estado, EL SISTEMA DEBERÁ aceptar solo las del
  ciclo de vida declarado (p. ej. `answered` no puede volver a `pending`).

## Ámbito de archivos / File scope

- `packages/sdd-core/src/` — cola de peticiones (nuevo módulo `requests`)
- `packages/sdd-mcp/src/api.ts` — rutas REST de peticiones
- `packages/sdd-mcp/src/server.ts` — herramientas MCP nuevas
- `builder/src/` — SectionEditor, AssistantWizard, store, api, live

## Criterios de éxito

- Redactar una sección con ayuda del agente sin usar el portapapeles ni la
  terminal (salvo la sesión de agente ya abierta): 0 copy-paste.
- Una idea en bruto de ≥3 frases se convierte en borrador de spec con las 4
  secciones principales pobladas, listo para editar, en un solo ciclo
  petición→propuesta→confirmación.
- Con el agente desconectado, ningún botón de IA deja al usuario esperando:
  el fallback copiable aparece de inmediato.
