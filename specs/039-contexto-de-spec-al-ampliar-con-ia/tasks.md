# Tareas 039 - Ampliar con IA ve la spec, no solo el campo

Estado: `- [ ]` pendiente · `- [x]` hecha

## Pruebas

- [x] T1 — El compositor excluye la sección en edición del contexto. (R2)
- [x] T2 — El compositor respeta el tope y marca el recorte. (R3)
- [x] T3 — Una superficie sin spec (nota, bitácora) no produce contexto. (R2)
- [x] T4 — El prompt copiable y la petición llevan el mismo contexto. (R4)
- [x] T5 — Una petición sin `context` sigue siendo válida en el esquema. (R1)
- [x] T6 — Las copias versionadas de `SKILL.md` coinciden con su fuente. (R6)
- [x] T7 — Suite completa, typecheck y build en verde.

## Implementación

- [x] T8 — Campo `context` en `AiRequest` y `CreateAiRequestInput`. (R1)
- [x] T9 — Campo en el esquema zod del MCP y en la ruta de creación. (R1)
- [x] T10 — Compositor puro con su presupuesto. (R2, R3)
- [x] T11 — `AiAssistButton` acepta y envía el contexto. (R2)
- [x] T12 — `SectionEditor` y `SpecDrawer` lo pasan. (R2)
- [x] T13 — `buildFieldPrompt` incluye el bloque. (R4)
- [x] T14 — `SERVE_QUEUE_INSTRUCTIONS` actualizadas y copias regeneradas. (R5)

## Cierre

- [x] T15 — Pasada real en el lienzo: ampliar un campo y comprobar el contexto.
- [ ] T16 — Compuerta y bitácora del día.
