# Especificación 021 - El binario del lienzo no puede volver a fallar en silencio

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-23`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-23 — «crea commits y sigue con lo que falte». La 021 era el borrador pendiente de mayor valor (bug reportado por el propietario: el binario del lienzo fallaba en silencio). Consentimiento en `.sdd/user-consent.log`.

## Contexto

El autor instaló el sidecar en `~/www/larepolla` y ejecutó el comando que la guía 51 le
daba, `npx @juanklagos/sdd-mcp --http`. Reportó: *«este comando no funciona»*. Lo que
recibió fue **cero bytes de salida y código de salida 0**. Ni un error, ni una URL, ni
una traza. El comando volvía al prompt como si hubiera hecho su trabajo.

La causa se encontró reproduciendo, no leyendo: npx tenía en caché
`@juanklagos/sdd-mcp` **2.2.0**, y la bandera `--http` llegó en la **2.2.1** (spec 020).
La 2.2.0 recibió `--http`, no la reconoció, arrancó el transporte stdio, no encontró
stdin y terminó. Verificado: el `dist/index.js` de la 2.2.0 en
`~/.npm/_npx/24a5525279ad76b1/` no contiene la cadena `http` ni una vez. Con
`npx @juanklagos/sdd-mcp@2.2.1 --http` el lienzo arrancó a la primera en esa misma
carpeta, `/builder` respondió 200 y `/api/board` devolvió
`projectRoot: /Users/juanklagos/www/larepolla`.

El desajuste de versión es circunstancial y ya se rodeó por documentación (todos los
comandos publicados fijan `@latest`, sin spec porque no es código). **Lo que esta spec
ataca es lo que convirtió ese desajuste en «no funciona»: el binario no dice nada.**

**D1. Cualquier argumento que el binario no conoce desaparece sin dejar rastro.**
No es un defecto solo de la 2.2.0. Medido hoy contra la **2.2.1**, la última publicada:

| Invocación | Salida | Código |
|---|---|---|
| `sdd-mcp --htp < /dev/null` | 0 bytes | 0 |
| `sdd-mcp --help < /dev/null` | 0 bytes | 0 |

`--help` no imprime ayuda. Y cuando stdin es una tubería abierta en vez de `/dev/null`
—que es el caso normal cuando un agente o un script lo lanza— el proceso **no termina**:
se queda colgado indefinidamente esperando tráfico stdio. Un comando mal escrito, una
bandera de una versión futura o una bandera de una versión pasada producen todos el mismo
resultado: silencio, o silencio colgado.

**D2. Cuando el puerto está ocupado, el binario miente y luego dice que todo fue bien.**
Con un servidor ya escuchando en 3334, un segundo `--http` imprime:

```
[sdd-mcp] uncaught exception (server keeps running): Error: listen EADDRINUSE ...
```

Dos cosas mal en una línea. El servidor **no** sigue corriendo: el proceso muere. Y muere
con **código de salida 0**, así que cualquier script, CI o agente que compruebe el código
concluye que el lienzo está arriba cuando no llegó a escuchar. El texto sale de
`packages/sdd-mcp/src/http.ts:107` y `:110`, un manejador genérico de `uncaughtException`
pensado para errores en caliente que también atrapa el fallo de arranque, donde su promesa
es falsa.

## Historia de usuario principal

Como alguien que ejecuta el comando del lienzo y no obtiene un lienzo, quiero que el
programa me diga qué pasó y me deje un código de salida honesto, para no tener que
adivinar si el fallo es mío, de mi carpeta o de la versión que se instaló.

## Escenarios de aceptación

1. Alguien con una versión antigua en caché ejecuta `sdd-mcp --http`, esa versión no
   conoce la bandera, y en vez de silencio recibe un mensaje que nombra la bandera, la
   versión que está corriendo y cómo actualizar.
2. Alguien escribe `--htp` por error y el programa se lo dice en vez de quedarse callado.
3. Alguien ejecuta `--help` y recibe ayuda.
4. Alguien arranca el lienzo con el puerto ya ocupado, lee un mensaje que dice qué puerto
   y cómo cambiarlo, y el comando sale con código distinto de cero.
5. Un script que comprueba el código de salida del comando del lienzo distingue
   correctamente un arranque bueno de uno fallido.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO se invoque el binario con un argumento que no reconozca, EL SISTEMA DEBERÁ
  escribir en stderr el argumento recibido y la versión que está ejecutando, y DEBERÁ
  salir con código distinto de cero, sin arrancar ningún transporte.
- CUANDO se invoque el binario con `--help` o `-h`, EL SISTEMA DEBERÁ imprimir el uso,
  incluida `--http`, y DEBERÁ salir con código 0.
- CUANDO se invoque el binario con `--version` o `-V`, EL SISTEMA DEBERÁ imprimir la
  versión del paquete y salir con código 0.
- MIENTRAS no se pase ningún argumento, EL SISTEMA DEBERÁ arrancar el transporte stdio
  exactamente como hoy, sin salida añadida en stdout (es un canal de protocolo).
- SI el puerto de escucha está ocupado, ENTONCES EL SISTEMA DEBERÁ escribir un mensaje
  que nombre el puerto y la variable `SDD_MCP_HTTP_PORT`, y DEBERÁ salir con código
  distinto de cero.
- SI el servidor HTTP falla antes de quedar escuchando, ENTONCES EL SISTEMA NUNCA DEBERÁ
  afirmar que sigue corriendo.
- MIENTRAS el servidor ya esté escuchando, EL SISTEMA DEBERÁ conservar el comportamiento
  actual ante una excepción no capturada: registrarla y seguir sirviendo.

## Requisitos

- El análisis de argumentos vive en un solo sitio y lo comparten `index.ts` y `http.ts`;
  no se duplica una lista de banderas en dos archivos que puedan divergir.
- El bin `sdd-mcp-http` conserva su comportamiento: está documentado fuera de este
  repositorio y vive en configuraciones MCP de usuarios (decisión de la spec 020).
- El mensaje de bandera desconocida nombra la versión en ejecución. Es lo que habría
  cerrado este caso en un segundo en vez de en una sesión de depuración.
- Los mensajes salen por stderr, nunca por stdout: stdout es el canal del protocolo MCP.
- Bilingüe donde ya lo es el resto de la salida del arranque HTTP.

## Ámbito de archivos / File scope

- `packages/sdd-mcp/src/index.ts` — análisis de argumentos y despacho
- `packages/sdd-mcp/src/http.ts` — arranque, `listen`, manejadores de excepción
- `packages/sdd-mcp/README.md` — uso publicado del binario
- `scripts/smoke-test-npm-package.mjs` — cobertura contra el paquete empaquetado

## Criterios de éxito

- Ninguna invocación del binario produce cero bytes de salida y código 0 sin haber
  arrancado un transporte. Verificado ejecutando, no leyendo.
- `--http` con el puerto ocupado sale con código distinto de cero y sin la frase
  «server keeps running».
- El smoke test del paquete empaquetado cubre bandera desconocida, `--help` y puerto
  ocupado, de modo que la próxima bandera que se añada no pueda volver a fallar callada.
- Sin regresión: el arranque stdio sin argumentos y el arranque `--http` con puerto libre
  siguen comportándose como hoy.
