# Tareas 032 - Conectar el agente en un paso

Orden TDD: cada bloque escribe primero sus pruebas.

## Fase 1 — Core: conectores

- [x] T1. Pruebas de `planConnect`/`applyConnect` en sdd-core contra un
      workspace desechable: destino nuevo (creado), destino con otros
      servidores MCP (merge preserva todo, R2), segunda ejecución
      (`unchanged`, R2), archivo corrupto (intacto + `error`, R3),
      `dryRun` no escribe nada (R8), sin clientes (lista vacía, R9).
- [x] T2. Implementar `connect.ts`: descriptores de los 7 clientes,
      detección, merge JSON, merge de la tabla TOML, escritura atómica
      (R1, R2, R3).
- [x] T3. Pruebas + implementación de la emisión de la skill portable
      SKILL.md a `skillsDir` de cada cliente y a `.agents/skills/` (R4), y
      de los comandos nativos TOML de Gemini y markdown de opencode (R5),
      todos servidos desde `SERVE_QUEUE_INSTRUCTIONS` (R6).

## Fase 2 — CLI

- [x] T4. Pruebas del parser de argumentos del CLI: `connect`, `--client`,
      `--dry-run`, `--global`, flag desconocido rechazado (mantener el
      contrato estricto actual de cli.ts).
- [x] T5. Implementar el subcomando `connect` con su resumen de resultados
      y el siguiente paso exacto (R11), incluida la salida sin clientes
      (R9). Actualizar `--help`.

## Fase 3 — MCP + plugin

- [x] T6. Prueba (smoke-test MCP): el prompt `sdd_serve_requests` existe y
      su texto contiene las tres llamadas del bucle y la prohibición de
      escribir en `specs/` (R7, R6).
- [x] T7. Registrar el prompt en `server.ts` reutilizando
      `SERVE_QUEUE_INSTRUCTIONS`.
- [x] T8. Comando `/sdd:serve` del plugin en `.claude/commands/sdd/serve.md`
      con el formato bilingüe de los otros seis.

## Fase 4 — Builder

- [x] T9. Extraer `CommandRow` de `App.tsx` a su propio módulo y montar
      `ConnectAgentModal` con pestañas por cliente (R10).
- [x] T10. Accesos: acción en ⌘K, enlace desde el estado "sin agente" del
      `AiAssistButton`, bloque en el estado vacío. Cadenas ES/EN en
      `i18n.ts`.

## Fase 5 — Cierre

- [x] T11. Documentación: tabla de clientes (archivo, formato, comando) en
      las guías 51 ES/EN y el prompt nuevo en la referencia 41 ES/EN.
      Actualizar las recetas de las guías 33/36, hoy desactualizadas
      (`node dist/index.js` en vez de `npx @latest`) y sin Gemini.
- [x] T12. Verificación end-to-end: ejecutar `connect --dry-run` y luego
      real contra un workspace de prueba con configuraciones preexistentes
      de varios clientes; comprobar merge, idempotencia y que el builder
      muestra el panel. Anotar resultados en `history.md`.
- [x] T13. `sdd_validate` + `specs/INDEX.md` + bitácora de decisiones.
