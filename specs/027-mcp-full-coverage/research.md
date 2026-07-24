# Investigación 027 - cobertura completa de comandos MCP

## Pregunta

¿Qué comandos/capacidades del template faltan en el servidor MCP y cómo
exponerlos sin duplicar lógica?

## Hallazgos (auditoría 2026-07-23, sesión de chat)

- Inventario actual: 21 herramientas en `server.ts`, más 9 resources y 10
  prompts (una auditoría anterior en la misma sesión los dio por inexistentes
  por buscar `registerResource`/`registerPrompt`; el SDK usa `server.resource()`
  y `server.prompt()`).
- El patrón dominante: cada asimetría es de lectura. La bitácora se escribe por
  4 herramientas y no se lee por ninguna; las specs se aprueban/editan pero no
  se leen; la deriva se calcula pero solo viaja dentro del payload del board.
- Por stdio el agente compensa leyendo archivos; por HTTP (SDD Desk, `npx`) no
  hay filesystem: la asimetría se vuelve bloqueo real.

## Decisiones derivadas de los hallazgos

- **Reutilizar, no duplicar**: toda herramienta nueva delega en core
  (`readSpecDocument`, `computeSpecDrift`, `validateEarsCriterion`,
  `mutateSpecDocument`). Rationale: spec 024 estableció que el invariante vive
  en core con pruebas; una segunda implementación en el MCP lo rompería.
- **`sdd_read_bitacora` una sola herramienta (list+read)** en vez de dos:
  misma superficie de permisos, semántica clara (sin `fileName` = listar).
- **Score portado a TS** (no execFile del bash): el bash depende de `rg`, que
  no se puede asumir en la máquina del usuario de npm/Desk. Paridad de
  heurísticas declarada en la spec.
- **Sidecar vía execFile del script** (no port): 364 líneas de bash probadas
  en producción; `createWorkspace` ya estableció el patrón execFile y el
  payload npm ya distribuye `scripts/`. Portarlo sería la opción cara y
  arriesgada. Rechazado: portar a TS (se reconsiderará si el script crece).
- **Fuera de alcance**: dependencias (ya en `gate_summary`), resources/prompts
  para `projectRoot` arbitrario (spec futura).

## Referencias

- `packages/sdd-mcp/src/server.ts` (patrón de registro)
- `packages/sdd-core/src/{board.ts,drift.ts,workspace.ts,spec-actions.ts}`
- `scripts/score-spec.sh`, `scripts/install-spec-sidecar.sh`
- Spec 024 (núcleo con pruebas), spec 025 (deriva)
