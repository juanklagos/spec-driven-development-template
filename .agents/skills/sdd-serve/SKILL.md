---
name: sdd-serve
description: Serve the SDD Builder's AI request queue: claim requests with sdd_next_request, draft the proposal, answer with sdd_respond_request. Never writes spec files — the user accepts each proposal in the builder. Use when the user asks to attend, serve or listen to the SDD board queue. / Atiende la cola de peticiones del SDD Builder.
---

# Serve the SDD queue / Atiende la cola SDD

Serve the SDD Builder's AI request queue.

Loop:
1. Call `sdd_next_request` (projectRoot: the current workspace, agent: your name).
2. If it returns `request: null` there is no work: say so in one line and poll again when the user asks (or on the next cycle if you are looping).
3. If it returns a request, read all of it: `target` says which field it is (spec.md section, task, note or logbook entry), `currentText` is what exists today and `instruction` is what the person asked for.
4. Draft ONLY the proposed text for that field, in the language of the current text and in its format (a list returns one line per item; criteria keep the EARS pattern "WHEN … THE SYSTEM SHALL …"). For `structure-idea` requests, return exactly the JSON the instruction asks for, with no markdown around it.
5. Answer with `sdd_respond_request` (the request id, proposal: your text).
6. Repeat from step 1.

Hard rules:
- Do NOT write any file under `specs/` and do not use the spec-writing tools. Your proposal is not applied: the person reviews it as a diff in the builder and only their acceptance writes.
- Do not invent context that is not in the request or the workspace; if something is ambiguous, propose the best version and say so in one sentence at the end.
- Do not ask for permission between requests: the permission IS the builder's Accept button.

---

Atiende la cola de peticiones de IA del SDD Builder.

Bucle:
1. Llama a `sdd_next_request` (projectRoot: el workspace actual, agent: tu nombre).
2. Si devuelve `request: null`, no hay trabajo: dilo en una línea y vuelve a consultar cuando el usuario te lo pida (o en el siguiente ciclo si estás en bucle).
3. Si devuelve una petición, léela entera: `target` dice qué campo es (sección de spec.md, tarea, nota o entrada de bitácora), `currentText` es lo que hay hoy e `instruction` es lo que pide la persona.
4. Redacta SOLO el texto propuesto para ese campo, en el idioma del texto actual y con su mismo formato (si es una lista, devuelve una línea por elemento; si son criterios, respeta el patrón EARS «CUANDO … EL SISTEMA DEBERÁ …»). Para peticiones `structure-idea`, devuelve exactamente el JSON que pide la indicación, sin markdown alrededor.
5. Responde con `sdd_respond_request` (id de la petición, proposal: tu texto).
6. Repite desde el paso 1.

Reglas duras:
- NO escribas ningún archivo bajo `specs/` ni uses las tools de escritura de specs. Tu propuesta no se aplica: la persona la revisa como diff en el builder y solo su aceptación escribe.
- No inventes contexto que no esté en la petición ni en el workspace; si algo es ambiguo, propón la mejor versión y dilo en una frase al final de la propuesta.
- No pidas permiso entre peticiones: el permiso ya es el botón Aceptar del builder.
