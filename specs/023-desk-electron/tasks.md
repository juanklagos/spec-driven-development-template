# Tareas 023 - SDD Desk (Electron)

- [x] T1 (R1, R2): extraer `createSddHttpServer({ projectRoot, port, host })` en `packages/sdd-mcp/src/http.ts` con fallback de puerto y `close()`; `http.ts` queda como guion delgado con la misma salida por consola.
- [x] T2 (H1): verificar sin regresión — `npm run build`, `npm run typecheck`, `mcp:test`, `mcp:http:smoke` y los tres scripts SDD; marcar `011` T2 como satisfecho por esta spec.
- [x] T3 (R3): crear `desk/` hermana de `builder/` (`package.json`, `tsconfig.json`, scripts `dev`/`build`/`dist`) con el main de Electron que llama la factoría y abre la ventana en la URL efectiva.
- [x] T4 (R6): endurecer el renderer (`contextIsolation`, `nodeIntegration: false`, `sandbox`, `setWindowOpenHandler`, `will-navigate` → `shell.openExternal`) y verificar explícitamente que la ventana carga por `http://127.0.0.1` y que una escritura del builder llega al disco.
- [x] T5 (R4): selector de workspace nativo, persistencia entre sesiones, y cambio en caliente reiniciando el servidor contra la nueva raíz.
- [x] T6 (R5): panel de conexión MCP con la URL efectiva y el fragmento de configuración copiable.
- [x] T7 (R7): menús nativos bilingües y atajos.
- [ ] T8 (H3, H4): verificar paridad con el builder en el navegador sobre el mismo proyecto, y un agente externo escribiendo por la URL MCP con la ventana reflejándolo sin recarga.
- [ ] T9 (R8): `electron-builder` para macOS (`.dmg` universal, firmado y notarizado), Windows (NSIS firmado) y Linux (AppImage, `.deb`).
- [ ] T10 (R9): auto-actualización con `electron-updater` contra GitHub Releases, con aviso y sin forzar.
- [x] T11 (R10): workflow de CI por tag para las tres plataformas, con los secretos de firma.
- [x] T12 (R11): documentación EN/ES — instalación, conexión de agentes al MCP de la app, y diferencia con `npx @juanklagos/sdd-mcp --http`.
- [ ] T13 (H5): verificación end-to-end en una máquina limpia sin Node, y registro del resultado en `history.md`.
