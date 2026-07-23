# Tareas 021 - El binario del lienzo no puede volver a fallar en silencio

> Aprobada y consentida el 2026-07-23 («crea commits y sigue con lo que falte»).

- [x] T1. Módulo de análisis de argumentos: `packages/sdd-mcp/src/cli.ts` — `parseCliArgs(argv)` → `stdio | http | help | version | unknown`, con `packageVersion()` leída desde `import.meta.url`.
- [x] T2. `index.ts` despacha sobre la intención: `help`/`version` imprimen y salen 0; `unknown` escribe bandera + versión + cómo actualizar en stderr y sale ≠ 0 sin arrancar transporte; sin argumentos, stdio idéntico a hoy (stdout limpio).
- [x] T3. `helpText()` bilingüe con `--http`, `--version`, `SDD_PROJECT_ROOT` y `SDD_MCP_HTTP_PORT`.
- [x] T4. `http.ts`: la resolución de `startSddHttpServer` se envuelve en try/catch; el fallo de arranque imprime un mensaje que nombra el puerto y `SDD_MCP_HTTP_PORT` y sale con `process.exit(1)`.
- [x] T5. El manejador de `uncaughtException` se instala **después** de que el servidor está escuchando; antes, el fallo de arranque manda (el texto «keeps running» ya no puede mentir en el arranque).
- [x] T6. Verificado por inspección: ninguna config MCP de la guía 51 pasa una bandera al binario. Claude Code (`npx -y @juanklagos/sdd-mcp@latest`), Codex TOML y JSON (`args: ["-y", "@juanklagos/sdd-mcp@latest"]`) — el `-y` y `@latest` son de npx; el binario recibe `[]` (stdio) o `--http`.
- [x] T7. Smoke del paquete empaquetado (`scripts/smoke-test-npm-package.mjs`): bandera desconocida (exit≠0, stderr nombra el arg, stdout vacío), `--help` (exit 0, documenta `--http`), `--version` (exit 0, imprime versión), `--http` con el rango de puertos ocupado (exit≠0, sin «keeps running»), y no-regresión stdio.
- [x] T8. Smoke: en modo stdio (sin args, stdin cerrado), stdout es 0 bytes. Verificado en el mismo script.
- [x] T9. `packages/sdd-mcp/README.md`: sección «fails loud, never silent» con `--help`/`--version` y la garantía.
- [~] T10. Verificación contra el paquete **publicado** desde una carpeta limpia: la ejecuta el propietario con su OTP al publicar. El smoke prueba el tarball empaquetado localmente (`npm pack` + install), lo más cerca sin publicar. Anotado en la decisión.
- [x] T11. `bitacora/decisiones/2026-07-23-el-binario-falla-en-voz-alta.md` — por qué se acota el manejador genérico en vez de retirarlo, y el costo aceptado de `@latest`.
