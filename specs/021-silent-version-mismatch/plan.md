# Plan 021 - El binario del lienzo no puede volver a fallar en silencio

## Resumen

Dos cambios acotados en `packages/sdd-mcp`, más la red que impide que vuelvan a
perderse: un analizador de argumentos único que nunca deja caer una bandera al transporte
stdio por accidente, y un fallo de `listen` que se trata como fallo de arranque en vez de
como excepción en caliente. Cierra con cobertura sobre el paquete **empaquetado**, que es
donde estos defectos viven y donde los smoke tests actuales no miran.

## Contexto técnico

- `src/index.ts` decide hoy con `process.argv.slice(2).includes("--http")`. Un `includes`
  no puede distinguir «no me pidieron nada» de «me pidieron algo que no entiendo»: todo lo
  que no sea `--http` cae al `else` implícito, que es stdio.
- `src/http.ts` arranca por efecto de import y llama a `server.listen(port, host)` sin
  `server.on("error")`. El fallo llega como `uncaughtException` al manejador de `:107`,
  cuyo texto promete que el servidor sigue vivo.
- La versión del paquete hay que leerla en tiempo de ejecución. `dist/` está un nivel bajo
  la raíz del paquete, así que se resuelve desde `import.meta.url`, no con un literal que
  se quedaría desincronizado en la próxima release.
- stdout es el canal del protocolo MCP en modo stdio. Toda la salida humana va a stderr.
- `scripts/smoke-test-npm-package.mjs` ya empaqueta con `npm pack` y ejecuta el bin; ahí
  se enganchan los casos nuevos. La lección de la 2.2.0 —el frontend vacío se publicó en
  verde porque los tests corrían `node dist/...` y no el paquete como paquete— es
  exactamente la que aplica aquí.

## Fases de implementación

1. **Analizador de argumentos compartido.** Un módulo nuevo en `src/` que reciba
   `argv` y devuelva una intención: `stdio`, `http`, `help`, `version` o
   `unknown(arg)`. Sin dependencias. Lee la versión del `package.json` del paquete.
2. **`index.ts` despacha sobre esa intención.** `help` y `version` imprimen y salen 0.
   `unknown` escribe en stderr la bandera, la versión en ejecución y la vía de
   actualización, y sale con código distinto de cero sin tocar ningún transporte.
   Sin argumentos sigue siendo stdio, byte por byte como hoy.
3. **`listen` deja de ser una excepción no capturada.** `server.on("error")` antes de
   escuchar: `EADDRINUSE` produce un mensaje que nombra el puerto y
   `SDD_MCP_HTTP_PORT`, y sale con código distinto de cero. El manejador genérico de
   `uncaughtException` se conserva pero solo puede hablar de «sigue corriendo» una vez
   que el `listening` ha ocurrido.
4. **`sdd-mcp-http` sin regresión.** Ese bin no analiza banderas y no debe empezar a
   hacerlo; solo hereda el arreglo de `listen`.
5. **Cobertura en el paquete empaquetado.** Casos en
   `scripts/smoke-test-npm-package.mjs`: bandera desconocida, `--help`, `--version`,
   `--http` con puerto ocupado, y la no-regresión de stdio. Todos comprueban código de
   salida **y** que la salida no está vacía.
6. **README del paquete** con el uso real, incluido `--help`.

## Dependencias

- Ninguna nueva. Node ya expone todo lo necesario (`import.meta.url`, `server.on`).
- Se apoya en la spec 020: `--http` en el binario principal es lo que esta spec protege.

## Hitos

- H1: analizador único, con `help`, `version` y `unknown` cubiertos.
- H2: `listen` falla con mensaje y código honestos.
- H3: smoke test sobre el tarball verde con los cinco casos.
- H4: release publicada; verificación **contra el registro**, no contra el checkout.

## Riesgos

- **Romper el arranque stdio de quien ya nos usa.** Es el riesgo serio: `sdd-mcp` vive en
  configuraciones MCP de terceros. Mitigación: la ruta sin argumentos no cambia, y el
  smoke test la afirma explícitamente.
- **Que un cliente MCP pase banderas propias** que hoy se ignoran y mañana serían un
  error de arranque. Mitigación: revisar las configuraciones publicadas en la guía 51
  antes de cerrar; ninguna pasa banderas hoy, y esa comprobación es parte del trabajo.
- **Ensuciar stdout en modo stdio** y corromper el protocolo. Mitigación: toda la salida
  humana por stderr, comprobado en el smoke test.
- **El arreglo no llega a quien tiene caché vieja**: seguirá ejecutando el binario mudo
  hasta que actualice. Es inherente y no se puede arreglar hacia atrás; por eso el
  `@latest` de la documentación es la mitad del remedio y va por delante.
