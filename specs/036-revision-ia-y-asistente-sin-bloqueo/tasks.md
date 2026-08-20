# Tareas 036 - Revisión de specs por IA, y un asistente que no se bloquea

Pruebas antes que implementación (TDD). Cada criterio de la spec tiene al
menos una tarea de prueba que lo verifica.

## Pruebas

- [x] T1 — Prueba: `applyBoardPlan` en modo `append` sobre un lienzo con
      nodos conserva todos los previos (id a id) y añade los nuevos. (R2)
- [x] T2 — Prueba: ninguna caja añadida intersecta ninguna caja previa;
      intersección 0 px² para todo par. (R3)
- [x] T3 — Prueba: fallo a mitad del lote deja las specs ya creadas, nombra la
      que falló y no deja el lienzo desincronizado. (R4) — más una que no estaba
      prevista: con CERO creadas no se escribe lienzo, para no dejar notas
      huérfanas en el tablero de alguien que no consiguió nada.
- [x] T4 — Prueba: `applyTemplate` sigue rechazando un workspace con specs.
      (fuera de alcance, pinchado para que no se caiga por accidente)
- [x] T5 — Prueba: el analizador de revisiones acepta JSON pelado y entre
      vallas, descarta hallazgos cuyo ancla no sea una de las 7 secciones, y
      devuelve `null` ante entrada no interpretable. (R7, R8)
- [x] T6 — Prueba: una petición `review-spec` recorre la cola del núcleo
      (crear → reclamar → responder → resolver) igual que las otras. (R5)
- [x] T7 — Prueba: con presencia > 5 min el panel ofrece prompt copiable y
      campo de pegado; con presencia fresca ofrece la cola. (R5, R6)
- [x] T8 — Prueba: la respuesta pegada y la llegada por cola producen la misma
      lista de hallazgos. (R6)
- [x] T9 — Prueba: recibir una revisión no dispara ninguna escritura
      (`POST /api/spec`, `PUT sections`, bitácora). (R10)
- [x] T10 — Prueba: `ai-surfaces.test.ts` declara el panel de revisión y sigue
      exigiendo que aprobación y consentimiento no monten IA. (R11)
- [x] T11 — Prueba: el asistente ofrece sus dos acciones con 0 specs y con 3.
      (R1)
- [x] T12 — Prueba: ninguna ruta nueva emite peticiones fuera de `127.0.0.1`
      ni lee o escribe credenciales. (R12)

## Implementación

- [x] T13 — `applyBoardPlan({ mode })` con fusión de lienzo y colocación por
      debajo de la envolvente existente. (R2, R3, R4)
- [x] T14 — Asistente: dos acciones siempre visibles; fuera la guardia
      `hasSpecs` y su aviso ámbar. (R1)
- [x] T15 — Tipo `review-spec` en `packages/sdd-core/src/requests.ts`, en los
      esquemas MCP y en `builder/src/requests.ts`. (R5)
- [x] T16 — `builder/src/review.ts`: analizador puro y sus tipos. (R7, R8)
- [x] T17 — `buildReviewPrompt` en `prompts.ts`, con el texto de la spec
      dentro y el contrato de formato. (R6)
- [x] T18 — `ReviewPanel.tsx`: los dos caminos, la máquina de estados y el
      render de hallazgos por sección con severidad. (R5, R6, R7, R8)
- [x] T19 — Atajo hallazgo → `AiAssistButton` de su sección con instrucción
      precargada. (R9)
- [x] T20 — Cadenas ES/EN en `i18n.ts` para todo lo anterior.

## Cierre

- [x] T21 — `npm run typecheck` y `npm test` en `builder/`, y las suites de
      `packages/sdd-core` y `packages/sdd-mcp`, en verde.
- [x] T22 — Verificación en el lienzo real: asistente sobre workspace poblado,
      revisión por cola y revisión pegada.
- [x] T23 — `./scripts/validate-sdd.sh . --strict` y `./scripts/check-sdd-gate.sh .`
      sin errores.
- [x] T24 — Entrada en la bitácora de decisiones: por qué no hay claves de API
      en el builder.
