# Decisión clave - El binario del lienzo falla en voz alta: se acota el manejador genérico en vez de retirarlo, y `@latest` se acepta como el costo del silencio evitado / Key decision - The binary fails loud; the generic handler is scoped, not removed

## Date / Fecha

2026-07-23

## Context / Contexto

El propietario instaló el sidecar en `~/www/larepolla` y ejecutó el comando que la guía 51 le daba, `npx @juanklagos/sdd-mcp --http`. Recibió **cero bytes de salida y código de salida 0** — «este comando no funciona». La causa se reprodujo (spec 021, D1): npx tenía en caché la 2.2.0, `--http` llegó en la 2.2.1, la 2.2.0 no la reconoció, arrancó el transporte stdio, no encontró stdin y terminó. Medido contra la 2.2.1, `--help`, `--htp` y `--version` producían todos lo mismo: 0 bytes, exit 0 — o, con un pipe abierto, un cuelgue indefinido.

La spec 021 no ataca el desajuste de versión (circunstancial, ya rodeado con `@latest` en los comandos publicados). Ataca **lo que convirtió el desajuste en «no funciona»: el binario no decía nada**.

## Decision / Decisión

**1. Un solo sitio decide qué se pidió.** `packages/sdd-mcp/src/cli.ts` (`parseCliArgs`) mapea argv a una intención (`stdio | http | help | version | unknown`) y `index.ts` despacha sobre ella. Antes, `index.ts` solo miraba `.includes("--http")` y todo lo demás caía al transporte stdio. Ahora un argumento desconocido se escribe en stderr —nombrando el argumento y **la versión en ejecución**, que es lo que habría cerrado el reporte en un segundo— y sale con código distinto de 0 **sin arrancar transporte**. `--help`/`--version` imprimen y salen 0. Sin argumentos, stdio idéntico a hoy, con stdout limpio (es el canal del protocolo).

**2. El manejador genérico de `uncaughtException` se acota, no se retira.** El texto «(server keeps running)» era falso en el arranque: un `EADDRINUSE` de `listen` salía por ahí y el proceso moría con exit 0 (D2). La corrección **no elimina** el manejador —sigue siendo correcto para un fallo en caliente después de escuchar, donde un request malo no debe tumbar el servidor— sino que lo **instala solo después de que `startSddHttpServer` resuelve** (`packages/sdd-mcp/src/http.ts`). Antes de escuchar, el fallo de arranque manda: se imprime un mensaje que nombra el puerto y `SDD_MCP_HTTP_PORT`, y se sale con `process.exit(1)`.

**3. `@latest` se acepta como el costo del silencio evitado.** No se añade un chequeo de versión en red ni un auto-update. La defensa es que el binario **diga su versión** cuando no reconoce algo; el usuario decide fijar `@latest`. Todos los comandos publicados ya lo hacen.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Retirar el manejador de `uncaughtException`** | Perdería la garantía legítima que da en caliente (un request malformado no tumba el servidor, spec previa). El problema no era el manejador, era **cuándo** se instalaba: antes de escuchar mentía |
| **Tratar cualquier arg extra junto a `--http` como benigno** | Es la clase entera de fallo silencioso que la spec cierra: una bandera de una versión futura junto a `--http` volvería a desaparecer. `parseCliArgs` marca `unknown` si hay cualquier stray junto a `--http` |
| **Chequeo de versión contra el registro / auto-update** | Añade red y una dependencia de disponibilidad a un arranque local-first. Nombrar la versión en el error da el 90% del valor sin nada de eso |
| **Imprimir el error de arranque por stdout** | stdout es el canal del protocolo MCP. Todos los mensajes humanos van por stderr; stdout solo lleva protocolo (verificado en el smoke: modo stdio, stdout 0 bytes) |

## Consequences / Consecuencias

**A favor**
- Ninguna invocación produce ya 0 bytes + exit 0 sin haber arrancado un transporte. Verificado ejecutando, no leyendo: `--help`/`--version` (exit 0, uso/versión en stdout), `--htp` (exit 1, mensaje en stderr con la versión, stdout vacío), `--http` con el rango de puertos ocupado (exit 1, sin «keeps running»), stdio sin args (exit 0, stdout limpio).
- El smoke del paquete **empaquetado** (`scripts/smoke-test-npm-package.mjs`) cubre los cuatro casos + la no-regresión de stdio, así que la próxima bandera que se añada no puede volver a fallar callada. `parseCliArgs` tiene además prueba unitaria (`cli.test.ts`, Vitest de la spec 024).

**Costos aceptados**
- **`@latest` sigue siendo la defensa contra el desajuste de versión**, no un mecanismo del binario. Si alguien ejecuta una versión vieja sin `@latest` y con una bandera nueva, ahora **lo sabrá** (el error nombra su versión), pero seguirá teniendo que actualizar a mano.
- El bin `sdd-mcp-http` conserva su comportamiento (documentado fuera del repo, en configs MCP de usuarios — decisión de la spec 020): no gana el parseo de `--help`/`--version`, porque su contrato es «arranca el HTTP y ya».

**Lo que no se pudo verificar aquí**
- **T10**: la verificación final contra el paquete **publicado** desde una carpeta limpia la ejecuta el propietario con su OTP al publicar. El smoke prueba el tarball empaquetado localmente (`npm pack` + install), que es lo más cerca sin publicar.

**Cuándo revisar esta decisión**
- Si aparecen reportes de usuarios con banderas nuevas contra versiones viejas pese al mensaje: señal de que nombrar la versión no basta y habría que sopesar un chequeo de versión opt-in.
- Si el manejador acotado vuelve a tragarse un fallo de arranque (p. ej. un `listen` que falle de forma asíncrona tras resolver): el flag de «ya escuchando» necesitaría atarse al evento `listening` real, no a la resolución de la promesa.
