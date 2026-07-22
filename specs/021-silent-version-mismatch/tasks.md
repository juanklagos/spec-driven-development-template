# Tareas 021 - El binario del lienzo no puede volver a fallar en silencio

- [ ] T1. Módulo de análisis de argumentos en `packages/sdd-mcp/src/`: `argv` → intención
      (`stdio` | `http` | `help` | `version` | `unknown`), con la versión del paquete leída
      desde `import.meta.url`.
- [ ] T2. `index.ts` despacha sobre la intención: `help`/`version` imprimen y salen 0;
      `unknown` escribe bandera + versión + cómo actualizar en stderr y sale distinto de 0
      sin arrancar transporte; sin argumentos, stdio idéntico a hoy.
- [ ] T3. Texto de `--help` con `--http`, `--version`, `SDD_PROJECT_ROOT` y
      `SDD_MCP_HTTP_PORT`, bilingüe como el resto de la salida de arranque.
- [ ] T4. `http.ts`: `server.on("error")` antes de `listen`; `EADDRINUSE` nombra el puerto
      y `SDD_MCP_HTTP_PORT` y sale distinto de 0.
- [ ] T5. El manejador de `uncaughtException` solo puede prometer «sigue corriendo» después
      del evento `listening`; antes, el fallo de arranque manda.
- [ ] T6. Comprobar que ninguna configuración MCP publicada en la guía 51 pasa banderas al
      binario (Claude Code, Codex, Gemini CLI) antes de convertir lo desconocido en error.
- [ ] T7. Smoke test del paquete empaquetado: bandera desconocida, `--help`, `--version`,
      `--http` con puerto ocupado, y no-regresión de stdio. Cada caso comprueba código de
      salida y salida no vacía.
- [ ] T8. Smoke test: en modo stdio, stdout no lleva ni un byte de texto humano.
- [ ] T9. `packages/sdd-mcp/README.md` con el uso real, incluido `--help`.
- [ ] T10. Verificación final contra el paquete **publicado** en el registro desde una
      carpeta limpia, no contra el checkout.
- [ ] T11. Registrar la decisión en `bitacora/decisiones/` (por qué se acota el manejador
      genérico en vez de retirarlo, y el coste aceptado de `@latest`).
