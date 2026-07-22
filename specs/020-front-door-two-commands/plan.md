# Plan 020 - Dos comandos hasta el lienzo

## Resumen

Cuatro cambios pequeños y aditivos. Ninguno rompe una invocación existente: el binario
`sdd-mcp-http` sigue ahí, la pregunta interactiva sigue ahí, y el transporte stdio sigue
siendo el comportamiento por defecto.

## Contexto técnico

- `packages/create-sdd-project/index.mjs:46-48` — `ask()` ya respeta `--yes` devolviendo
  el fallback. El arreglo es una segunda condición sobre `process.stdin.isTTY`, no una
  reescritura. El `createInterface` se sigue creando y cerrando igual; lo que evitamos es
  llamar a `rl.question()` cuando nadie puede responder.
- `packages/sdd-mcp/src/http.ts:81-83` — el `listen` ya imprime la dirección real a la que
  se ató, no una supuesta. Añadimos dos líneas más usando el mismo `hostForUrl(host)`.
- `packages/sdd-mcp/src/index.ts` — el entrypoint stdio. `http.ts` ejecuta sus efectos al
  importarse, así que un `await import("./http.js")` bajo la bandera basta y no duplica
  lógica de arranque.

## Fases de implementación

1. Andamiador: defaults sin TTY, anunciando lo asumido.
2. Servidor: las tres URLs, el lienzo primero.
3. Bandera `--http` en el binario principal.
4. Documentación: QUICKSTART abre con el camino corto; START_HERE usa la forma nueva.

## Dependencias

- Ninguna nueva. No se añade ni un paquete.

## Hitos

- Verificación con stdin cerrado y con stdin interactivo, ambas ejecutadas de verdad.
- Verificación de que `sdd-mcp-http` sigue funcionando tras añadir la bandera.

## Riesgos

- **Que `isTTY` sea `undefined` en algún entorno.** Es `undefined`, no `false`, cuando
  stdin no es un stream de terminal. La condición se escribe como negación
  (`!process.stdin.isTTY`) precisamente para cubrir ambos.
- **Que asumir defaults en silencio sorprenda a alguien.** Por eso el criterio de
  aceptación exige anunciar los valores asumidos, no solo usarlos.
- **Que `--http` colisione con un argumento del SDK de MCP.** Se comprueba antes de
  conectar el transporte y no se reenvía.
