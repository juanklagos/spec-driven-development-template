# Historial 032 - Conectar el agente en un paso

- 2026-08-12 (implementación + verificación) — T1-T13 completadas. Pruebas:
  sdd-core 96/96 (16 nuevas de `connect`), sdd-mcp 18/18 (4 nuevas del verbo
  CLI), builder 47/47, smoke test MCP con 37 tools y 10 prompts (el nuevo
  `sdd_serve_requests` se verifica por nombre y por contenido del bucle).
  Verificación real contra un workspace de prueba con configuración
  preexistente: `.cursor/mcp.json` conservó su servidor `github` y su clave
  ajena, `.codex/config.toml` conservó `model` y `[mcp_servers.otro]`, un
  `.vscode/mcp.json` con JSON inválido quedó byte a byte igual y se reportó
  como ERROR sin abortar el resto, y la segunda pasada reportó "sin cambios"
  en todos los destinos. Panel del builder verificado en navegador (⌘K →
  Conectar agente), incluido el cambio de cliente Claude Code → Codex, que
  muestra JSON y TOML respectivamente.
  Dos bugs cazados por las pruebas y uno por la verificación:
  1. `\Z` no existe en regex de JavaScript (se interpretaba como una «Z»
     literal), así que una tabla TOML al final del archivo no se detectaba y
     `connect` la duplicaba.
  2. El merge dejaba un salto de línea extra, rompiendo la idempotencia
     (cada pasada reportaba "actualizado").
  3. En proyectos con sidecar, usar `resolveSddRoot` como destino escribía
     las configs de cliente dentro de `spec/` y registraba esa ruta como
     `SDD_PROJECT_ROOT`. Ahora se valida con `resolveSddRoot` pero se
     registra y escribe en la raíz del proyecto; hay prueba dedicada.
  Ajuste de nomenclatura ya anotado arriba (`sdd-serve`).

- 2026-08-12 (aprobación) — Aprobada con la instrucción explícita del usuario
  como evidencia; consentimiento registrado. Corrección de nomenclatura antes
  de implementar: la skill se llama `sdd-serve` (no `sdd-atender`), para
  seguir la convención en inglés de los comandos existentes del plugin
  (`/sdd:new`, `/sdd:gate`, …). Solo cambia el nombre; el comportamiento
  descrito es el mismo.

- 2026-08-12 — Creación. Origen: tras cerrar la 031 el usuario preguntó
  cómo conecta el usuario con un agente, y aprobó las dos mejoras
  propuestas con el requisito de cubrir todas las formas posibles y hacerlas
  lo más automáticas que se pueda, investigando Codex, Claude, opencode y
  demás clientes. Alcance resultante: tres caminos coexistiendo (CLI que
  escribe la config, skill portable + comandos nativos, prompt MCP), porque
  la investigación mostró que ninguno cubre solo los siete clientes en 2026
  (Codex no expone prompts MCP — openai/codex#8342; Gemini y opencode no
  leen SKILL.md). Fuera de alcance deliberado: lanzar el agente como
  subproceso desde el builder o el servidor.
- 2026-08-20 — Evidencia de aprobación reescrita: registra qué se aprobó y contra qué fuente, sin transcribir el chat. No cambia qué se aprobó, quién ni cuándo (spec 037).
