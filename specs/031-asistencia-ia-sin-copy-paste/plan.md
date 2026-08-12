# Plan técnico 031 - Asistencia IA sin copy-paste

## Idea central

El builder nunca llama a una API de IA. Publica peticiones en una cola en
disco; la sesión de agente del usuario (ya conectada por MCP) las recoge, las
responde con propuestas, y el humano decide en la UI. Reutiliza las tres
piezas que ya existen: el core compartido (`@juanklagos/sdd-core`), la
paridad REST/MCP de la spec 028, y el hub SSE + watcher que ya refresca el
lienzo.

## Arquitectura

```
builder (React)                sdd-mcp server                 sesión de agente
  botón "Borrador IA"  ──POST /api/request──▶  .sdd/requests/xxx.json (pending)
  indicador estado    ◀──SSE change:request──┤
                                             │◀── MCP sdd_next_request (in_progress)
                                             │──▶ contexto: sección + indicación
                                             │◀── MCP sdd_respond_request (answered)
  diff Aceptar/Rechazar ◀──SSE──┤
  Aceptar ──PUT /api/spec/:id/sections──▶ escritura real (única)
```

## Componentes

### 1. Core: módulo `requests` (sdd-core) — cubre R1, R2, R3, R8 y las propiedades

- `createRequest(projectRoot, input)` → escribe `.sdd/requests/<ts>-<id>.json`
  con `{ id, type, target: { kind: "section" | "task" | "note" | "bitacora",
  specId?, ref }, currentText?, instruction, status: "pending", createdAt }`.
  `ref` identifica el campo dentro de su superficie (clave de sección, línea
  de tarea, id de nota, tipo+archivo de bitácora).
- `nextRequest(projectRoot, agent)` → la `pending` más antigua → `in_progress`
  (guarda `agent`, `startedAt`); devuelve `null` explícito si no hay.
- `respondRequest(projectRoot, id, proposal)` → adjunta `proposal` y pasa a
  `answered`. No importa nada de escritura de specs: la separación propuesta ≠
  escritura queda garantizada por diseño del módulo, no por disciplina.
- `resolveRequest(projectRoot, id, "accepted" | "rejected" | "cancelled")`.
- Máquina de estados validada en el módulo: transición ilegal → error.
- El watcher existente ya observa `.sdd/`; se añade el mapeo de
  `requests/` → evento SSE `{ kind: "request" }` en `events.ts`.

### 2. Transporte (sdd-mcp) — cubre R1, R2, R3

- REST (`api.ts`): `POST /api/request` (crear), `GET /api/requests`
  (activas), `POST /api/request/:id/resolve` (accept/reject/cancel).
- MCP (`server.ts`): `sdd_next_request` y `sdd_respond_request`, delegando en
  el core igual que el resto de herramientas. `sdd_next_request` incluye el
  texto actual de la sección (vía `readSpecDocument`/`sections`) para que el
  agente no tenga que buscarlo.

### 3. Builder UI — cubre R4, R5, R6, R7, R8

- `store.ts`: slice de peticiones activas, alimentado por `GET /api/requests`
  + refresco al evento SSE `request` (mismo patrón echo-guard que board).
- Componente compartido `AiAssistButton` + panel de diff (actual vs.
  propuesto, resaltado por líneas — diff simple propio; sin dependencia
  nueva): un solo widget reutilizado en cada superficie editable, para que
  añadir el botón a un campo sea una línea, no una implementación (R4b).
- Superficies (R4/R4b): `SectionEditor` (7 secciones → PUT sections),
  tareas en `SpecDrawer` (→ rutas de tareas), `NoteNode` (→ PUT board),
  formularios de `BitacoraModal` (→ POST bitácora). Cada aceptación escribe
  por la ruta que ya usa ese campo; ninguna ruta nueva de escritura.
- Exclusión dura: los formularios de aprobación y consentimiento no montan
  `AiAssistButton` (R4b); un test lo verifica por ausencia.
- `AssistantWizard`: campo braindump + "Estructurar con IA" tipo
  `structure-idea`; la propuesta rellena el preview editable ya existente; el
  flujo de creación no cambia.
- Estado del agente (R6): el server expone en `GET /api/requests` el último
  `board_connect` (`connectedAgent`, `lastSeenAt`); el builder muestra
  "agente: <nombre>" o "sin agente conectado" + PromptBox de fallback.
- Estancamiento (R8): el builder calcula `pending > 10 min` con el
  `createdAt` de la petición; badge "estancada" + acción cancelar.
- i18n: todas las cadenas nuevas en `i18n.ts` (ES/EN), como el resto.

### 4. Documentación

- Guía del builder: sección "modo conectado" — cómo dejar la sesión
  escuchando (`/loop` con `sdd_next_request`, o atender manualmente), y el
  contrato de las dos herramientas MCP.

## Decisiones y alternativas

- **Cola en disco vs. solo memoria**: disco. Sobrevive reinicios del server,
  es inspeccionable (`cat .sdd/requests/…`) y el watcher ya existe. Rechazada
  la cola en memoria por opaca y volátil.
- **El agente propone, el builder escribe**: rechazado que
  `sdd_respond_request` escriba specs directamente — rompería la garantía de
  aprobación humana y duplicaría la lógica del gate. La única escritura es la
  aceptación del usuario por las rutas ya probadas.
- **Diff propio vs. librería**: diff por líneas propio (~40 líneas); las
  secciones son cortas y el bundle del builder se mantiene sin dependencias
  nuevas.

## Riesgos

- Carrera petición cancelada / agente respondiendo: `respondRequest` sobre
  una petición `cancelled` falla con error claro; el agente lo ve y descarta.
- Peticiones huérfanas si el agente muere en `in_progress`: quedan visibles
  con su estado; el usuario puede cancelarlas (R8 cubre la percepción).

## Cobertura requisito → componente

| Requisito | Componente |
|---|---|
| R1 | core `createRequest` + REST + SSE |
| R2 | core `nextRequest` + MCP `sdd_next_request` |
| R3 | core `respondRequest` + MCP `sdd_respond_request` + SSE |
| R4 | `AiAssistButton` + diff (aceptar/rechazar) en cada superficie |
| R4b | montaje en las 4 superficies de contenido + exclusión aprobación/consentimiento |
| R5 | AssistantWizard (preview precargado) |
| R6 | estado de conexión en `GET /api/requests` + fallback PromptBox |
| R7 | slice de peticiones + SSE en el builder |
| R8 | badge estancada + cancelar + filtro en `nextRequest` |
