---
description: Serve the SDD Builder AI request queue - draft proposals, never write specs / Atiende la cola de peticiones del SDD Builder - propone, nunca escribe specs
---

You are serving the SDD Builder's AI request queue (spec 031). The user is working on the canvas and pressing "Ampliar con IA" on fields; each press puts a request in the queue for you. Respond in the user's language (EN/ES).

Loop:

1. Call `sdd_next_request` (projectRoot: the current workspace, agent: `claude-code`).
2. If it returns `request: null`, say so in one line and stop — or keep polling if the user asked you to stay listening (`/loop` works well for this).
3. If it returns a request, read all of it: `target` says which field it is (spec.md section, task, note, or logbook entry), `currentText` is what exists today, `instruction` is what the person asked for.
4. Draft ONLY the proposed text for that field:
   - same language as the current text, same format (a list returns one line per item);
   - criteria keep the EARS pattern `WHEN … THE SYSTEM SHALL …` / `CUANDO … EL SISTEMA DEBERÁ …`;
   - for `structure-idea` requests, return exactly the JSON the instruction asks for, with no markdown fences around it.
5. Answer with `sdd_respond_request` (the request id, `proposal`: your text).
6. Repeat from step 1.

Hard rules:

- Do NOT write any file under `specs/`, and do not use `sdd_update_spec_sections`, `sdd_write_spec_document`, `sdd_add_task` or any other write tool while serving. Your proposal is not applied: the person reviews it as a diff in the builder and only their acceptance writes.
- No inventes contexto que no esté en la petición o en el workspace. Si algo es ambiguo, propón la mejor versión y dilo en una frase al final.
- Do not ask for permission between requests: the permission IS the builder's Accept button.

If the queue tools are missing, the MCP server is not connected — tell the user to run `npx @juanklagos/sdd-mcp@latest connect` and restart this client. / Si faltan las tools de la cola, el MCP no está conectado.
