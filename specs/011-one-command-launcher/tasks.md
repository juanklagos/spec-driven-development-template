# Tareas 011 - one-command-launcher

> Auditoría 2026-07-23: tres tareas estaban hechas y sin marcar, porque las
> implementó otra spec. Ver `history.md` (bloque 2026-07-23) y
> `bitacora/decisiones/2026-07-23-alcance-restante-de-011-tras-el-escritorio.md`.

- [x] T1 (R1): publicar `builder/dist` en el paquete y resolver `BUILDER_DIST` desde node_modules; smoke del tarball.
- [x] T2 (R2): fallback de puerto + URL efectiva impresa. **Hecho por la spec 023 (T1, commit `ec7c091`)**, que declaró el requisito compartido en su propio R2 (*"Es el mismo requisito que 011 R2 — se implementa una vez y sirve a ambos"*). Evidencia: `DEFAULT_PORT_ATTEMPTS = 10` en `packages/sdd-mcp/src/http-server.ts:39` y el aviso de puerto ocupado en `packages/sdd-mcp/src/http.ts:42-44`.
- [ ] T3 (R3): apertura automática del navegador con `--no-open`. **Sin implementar en la ruta CLI.** El escritorio (spec 023) abre su propia ventana, así que esta tarea ya solo cubre a quien usa `npx`.
- [ ] T4 (R4): selector interactivo de workspace + banderas no interactivas. **Sin implementar en la ruta CLI.** El escritorio tiene selector nativo (`desk/src/main/dialogs.ts`, `desk/src/main/workspace.ts`), pero es de Electron: no lo hereda el CLI.
- [ ] T5 (R5): paquete `@juanklagos/sdd` + README (EN/ES) + guía 51. **Sin implementar** — `packages/` solo contiene `sdd-core`, `sdd-mcp` y `create-sdd-project`.
- [ ] T6 (R6): lanzadores de doble clic generados por `create-sdd-project`. **Sin implementar** — no existe `SDD.command` ni `SDD.bat` en el repo.
- [x] T7 (R7): gate del `.mcpb` (empaquetado + verificación registrada en history). **Empaquetado hecho** por el commit `3db6619`, que se atribuye a esta tarea: `scripts/pack-mcpb.mjs` y `scripts/probe-mcpb-stdio.mjs`. **Cabo suelto declarado:** el veredicto de host (¿renderiza `ui://sdd/board.html` en Claude Desktop?) sigue sin obtenerse — `bitacora/diaria/2026-07-23.md` lo dice con todas sus letras: *"Sigue abierto de la 011: el spike del `.mcpb` no tiene veredicto de host"*. Se marca la tarea porque el entregable que pedía (empaquetado + verificación registrada) existe y la parte no obtenida está registrada como tal, no escondida.
- [ ] T8: verificación end-to-end en directorio limpio, validaciones y trazabilidad. Depende de T3-T6.
