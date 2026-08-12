# Investigación 031 - Asistencia IA sin copy-paste

## Estado actual (2026-08-11)

- El flujo IA del builder es copy-first: `AssistantWizard.tsx` y
  `ImplementModal.tsx` generan prompts y los copian al portapapeles
  (`PromptBox.tsx`, spec 008 R1/R2). No hay `fetch` a ninguna API de IA.
- La dirección agente → builder ya funciona: las herramientas MCP escriben en
  disco, el watcher del server emite SSE (`/api/events`) y el lienzo se
  refresca (echo-guard en `builder/src/store.ts`).
- La dirección builder → agente es el hueco: hoy es el portapapeles del
  usuario.
- `packages/sdd-mcp/src/api.ts` delega todo en `@juanklagos/sdd-core` — la
  misma capa que usan las herramientas MCP (paridad establecida en spec 028).
  La cola de peticiones debe vivir en el core por la misma razón.
- `sdd_board_connect` ya existe: sirve de base para el estado
  conectado/desconectado (R6).

## Alternativas evaluadas y decisiones

- **Decisión: cola de peticiones en disco (`.sdd/requests/`)**, no en
  memoria. Por qué: sobrevive reinicios del server, es inspeccionable con
  cualquier editor, y el watcher + SSE ya existen para propagar cambios de
  disco. Rechazada la cola en memoria por volátil y opaca.
- **Decisión: el agente propone, solo el humano escribe.** Por qué: si
  `sdd_respond_request` escribiera specs directamente se perdería la garantía
  de aprobación humana y habría dos caminos de escritura que mantener. La
  aceptación del usuario reutiliza `updateSpecSections`/`createSpec` ya
  probados. Rechazada la escritura directa del agente.
- **Decisión: diff por líneas propio.** Por qué: las secciones son textos
  cortos; una función pura de ~40 líneas evita una dependencia nueva en el
  bundle del builder. Rechazadas librerías de diff externas.
- **Decisión: canal genérico (outbox) antes que chat embebido.** Por qué: el
  chat con Agent SDK exigiría hostear un agente con credenciales en el
  builder; el outbox reutiliza la sesión de agente que el usuario ya tiene
  abierta y sirve de base para ese chat futuro. Rechazado (por ahora) el
  agente embebido — queda registrado como fuera de alcance en la spec.
