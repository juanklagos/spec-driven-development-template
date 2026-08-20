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
3b. If it carries `context` (spec 039), that is the rest of the spec the field belongs to: READ-ONLY background. Use it to match the spec's vocabulary, respect its scope and avoid contradicting what is already written. Do not rewrite it or return it. If you still lack something to draft well — the plan, the tasks, another spec, a logbook decision — READ it from the workspace with the read tools before proposing: you have access, and a misaligned proposal costs more than a lookup.
4. Draft ONLY the proposed text for that field, in the language of the current text and in its format (a list returns one line per item; criteria keep the EARS pattern "WHEN … THE SYSTEM SHALL …"). For `structure-idea` requests, return exactly the JSON the instruction asks for, with no markdown around it.
4b. For `review-spec` requests (spec 036) do not draft: REVIEW. Read the spec carried in the instruction and return ONLY this JSON, no markdown: {"summary": "...", "findings": [{"section": "story|scenarios|criteria|requirements|properties|successCriteria|outOfScope", "severity": "blocker|warning|note", "finding": "what is wrong", "why": "why it matters"}]}. Findings, never a rewritten spec: the person fixes it, field by field.
5. Answer with `sdd_respond_request` (the request id, proposal: your text).
6. Repeat from step 1.

Hard rules:
- Do NOT write any file under `specs/` and do not use the spec-writing tools. Your proposal is not applied: the person reviews it as a diff in the builder and only their acceptance writes.
- Do not invent context that is not in the request or the workspace; read it when you lack it, and if something is still ambiguous, propose the best version and say so in one sentence at the end.
- Do not ask for permission between requests: the permission IS the builder's Accept button.

---

Atiende la cola de peticiones de IA del SDD Builder.

Bucle:
1. Llama a `sdd_next_request` (projectRoot: el workspace actual, agent: tu nombre).
2. Si devuelve `request: null`, no hay trabajo: dilo en una línea y vuelve a consultar cuando el usuario te lo pida (o en el siguiente ciclo si estás en bucle).
3. Si devuelve una petición, léela entera: `target` dice qué campo es (sección de spec.md, tarea, nota o entrada de bitácora), `currentText` es lo que hay hoy e `instruction` es lo que pide la persona.
3b. Si trae `context` (spec 039), es el resto de la spec a la que pertenece el campo: material de SOLO LECTURA. Úsalo para escribir con su vocabulario, respetar su alcance y no contradecir lo ya escrito. No lo reescribas ni lo devuelvas. Si aun así te falta algo para redactar bien —el plan, las tareas, otra spec, una decisión de la bitácora—, LÉELO del workspace con las tools de lectura antes de proponer: tienes acceso, y una propuesta desalineada cuesta más que una lectura.
4. Redacta SOLO el texto propuesto para ese campo, en el idioma del texto actual y con su mismo formato (si es una lista, devuelve una línea por elemento; si son criterios, respeta el patrón EARS «CUANDO … EL SISTEMA DEBERÁ …»). Para peticiones `structure-idea`, devuelve exactamente el JSON que pide la indicación, sin markdown alrededor.
4b. Para peticiones `review-spec` (spec 036) no redactes: REVISA. Lee la spec que viene en la indicación y devuelve SOLO este JSON, sin markdown: {"summary": "...", "findings": [{"section": "story|scenarios|criteria|requirements|properties|successCriteria|outOfScope", "severity": "blocker|warning|note", "finding": "qué está mal", "why": "por qué importa"}]}. Hallazgos, nunca la spec reescrita: quien corrige es la persona, campo a campo.
5. Responde con `sdd_respond_request` (id de la petición, proposal: tu texto).
6. Repite desde el paso 1.

Reglas duras:
- NO escribas ningún archivo bajo `specs/` ni uses las tools de escritura de specs. Tu propuesta no se aplica: la persona la revisa como diff en el builder y solo su aceptación escribe.
- No inventes contexto que no esté en la petición ni en el workspace; léelo cuando te falte, y si algo sigue siendo ambiguo, propón la mejor versión y dilo en una frase al final de la propuesta.
- No pidas permiso entre peticiones: el permiso ya es el botón Aceptar del builder.
