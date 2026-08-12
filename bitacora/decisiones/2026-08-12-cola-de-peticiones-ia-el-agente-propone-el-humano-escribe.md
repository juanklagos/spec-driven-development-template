# Cola de peticiones IA: el agente propone, solo el humano escribe

- Fecha: 2026-08-12
- Spec: 031-asistencia-ia-sin-copy-paste
- Estado: adoptada

## Qué se decidió

La asistencia IA del builder viaja por una cola en disco (`.sdd/requests/`):
el builder publica peticiones, la sesión de agente del usuario las reclama
por MCP (`sdd_next_request`) y responde con propuestas
(`sdd_respond_request`) que **nunca escriben specs**. La única escritura es
la aceptación del usuario en la UI, por las rutas ya existentes
(`updateSpecSections`, `createSpec`, tareas, board, bitácora).

## Por qué

- Fuente: `specs/031-asistencia-ia-sin-copy-paste/plan.md` (sección
  «Decisiones y alternativas») y `research.md`; implementación en
  `packages/sdd-core/src/requests.ts` (el módulo no importa ningún writer de
  specs — la garantía es estructural, no disciplinaria).
- Preserva el hard stop de SDD: la aprobación humana sigue siendo la única
  puerta de escritura; el gate no se tocó.
- El builder no necesita API keys: reutiliza la sesión de agente que el
  usuario ya tiene conectada.

## Alternativas rechazadas

- **Escritura directa del agente** (`sdd_respond_request` escribe spec.md):
  rompería la garantía de aprobación humana y duplicaría el camino de
  escritura.
- **Cola en memoria**: volátil y opaca; la cola en disco sobrevive
  reinicios, es inspeccionable y el watcher SSE ya existía.
- **Chat embebido (Agent SDK)**: exigiría credenciales en el builder; queda
  como evolución futura sobre este mismo canal (fuera de alcance en la 031).

## Cuándo revisitarla

- Si aparece la spec del chat embebido: evaluar si el canal outbox se
  mantiene como transporte o se sustituye.
- Si se necesita multi-agente o prioridades en la cola (hoy: FIFO, un solo
  agente de presencia).
- Si la escritura por aceptación resulta lenta para propuestas grandes
  (hoy las secciones son cortas por diseño del template).
