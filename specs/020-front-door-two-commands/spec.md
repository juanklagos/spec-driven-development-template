# Especificación 020 - Dos comandos hasta el lienzo, y que ninguno falle con quien los ejecuta

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-22`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-22 — tras publicar la 2.2.0 el autor preguntó *«para los usuarios las intrucciones y el uso es facil?»*, y ante los cuatro hallazgos verificados a mano respondió *«arreglalo»*. Consentimiento en `.sdd/user-consent.log`.

## Contexto

La 2.2.0 salió y el builder por fin viaja dentro del paquete. Pero el camino que lleva
a alguien hasta ese lienzo sigue teniendo cuatro tropiezos, y los cuatro se verificaron
ejecutando, no leyendo.

**1. El primer comando de la puerta no técnica falla cuando lo ejecuta un agente.**
`npx @juanklagos/create-sdd-project mi-app` pregunta el modo por stdin. Sin terminal
interactiva muere con `Warning: Detected unsettled top-level await at .../index.mjs:54`
y no crea nada. Con `--mode=sidecar` o alimentando stdin funciona sin problema, así que
una persona en su terminal no lo nota. Pero `START_HERE_NON_TECH.md:21` le dice
textualmente a la IA: *«If my project is new, scaffold it for me with
`npx @juanklagos/create-sdd-project`»*. Un agente corre comandos sin TTY. La puerta que
más presumimos manda a la IA a ejecutar el comando exacto que revienta en su contexto, y
el usuario recibe un error que nombra un archivo interno y un número de línea.

**2. El servidor no dice dónde está el lienzo.** `sdd-mcp-http` imprime una sola línea:
`SDD MCP Streamable HTTP server listening on http://127.0.0.1:3334/mcp`. Nunca menciona
`/builder` ni `/dashboard`, y no abre nada. El `START_HERE` promete que «se abre en
`http://127.0.0.1:3334/builder`»; el programa ni lo abre ni lo nombra. Quien sigue las
instrucciones ve una URL que acaba en `/mcp`, la abre, y encuentra un endpoint de
protocolo en lugar del tablero. El proceso funciona perfectamente y aun así la
experiencia es «no funciona».

**3. La puerta de desarrollador ignora el camino corto.** `QUICKSTART.md` se anuncia como
«Developer — about five minutes» y tiene 13 bloques de comandos repartidos en 8 pasos.
Empieza clonando el template entero y sigue con `reset-template.sh --confirm` para borrar
las specs del propio template. El andamiador de un comando —publicado, funcionando— no
aparece ni una sola vez en ese archivo: solo sale en `README.md:153` y dentro del prompt
no técnico. Quien abre la puerta rotulada «cinco minutos» hace ocho pasos existiendo uno.

**4. La forma del comando del lienzo es frágil.** `npx -p @juanklagos/sdd-mcp sdd-mcp-http`
depende de que npx resuelva un binario que no es el que da nombre al paquete. Durante la
verificación falló 3 veces con `sh: sdd-mcp-http: command not found` y funcionó 6 veces,
el mismo comando en la misma máquina. No se identificó el patrón y no se afirma la causa.
Lo que sí es firme es que la forma tiene una pieza móvil que no necesita tener, y que
cuando falla el mensaje no ayuda a nadie.

## Historia de usuario principal

Como alguien que acaba de encontrar este repositorio, quiero llegar a ver mis specs en el
lienzo con dos comandos que no dependan de si los escribo yo o los ejecuta mi agente,
para no abandonar en el primer error.

## Escenarios de aceptación

1. Un agente IA, sin TTY, ejecuta `npx @juanklagos/create-sdd-project mi-app` y el
   proyecto queda creado en modo sidecar sin intervención humana.
2. Una persona ejecuta el mismo comando en su terminal y sigue viendo la pregunta
   interactiva de siempre.
3. Alguien arranca el servidor HTTP y la salida le dice, sin ambigüedad, en qué URL está
   el lienzo.
4. Alguien que abre `QUICKSTART.md` encuentra el camino de un comando antes que el largo.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO `process.stdin.isTTY` sea falso y no se haya pasado `--mode`, EL ANDAMIADOR
  DEBERÁ usar los valores por defecto sin leer de stdin, y DEBERÁ anunciar en su salida
  qué valores asumió.
- MIENTRAS `process.stdin.isTTY` sea verdadero, EL ANDAMIADOR DEBERÁ conservar el
  comportamiento interactivo actual, incluida la bandera `--yes`.
- CUANDO el servidor HTTP quede escuchando, EL SISTEMA DEBERÁ imprimir las URLs de
  `/builder`, `/dashboard` y `/mcp`, con el lienzo en primer lugar.
- CUANDO se invoque el binario principal con `--http`, EL SISTEMA DEBERÁ arrancar el
  servidor HTTP, de modo que `npx @juanklagos/sdd-mcp --http` sea equivalente a
  `npx -p @juanklagos/sdd-mcp sdd-mcp-http`.
- CUANDO no se pase `--http`, EL SISTEMA DEBERÁ arrancar el transporte stdio como hoy.
- EL BINARIO `sdd-mcp-http` DEBERÁ seguir existiendo y funcionando: hay documentación
  publicada y configuraciones de usuario que lo nombran.

## Requisitos

- No romper ninguna invocación que hoy funcione. Todo es aditivo.
- La salida nueva del servidor va a stderr, como la actual, para no contaminar stdout.
- Nada de abrir el navegador automáticamente: el servidor puede correr en un contenedor o
  en una sesión remota, y abrir ventanas sin permiso es peor que no abrirlas.

## Ámbito de archivos / File scope

- `packages/create-sdd-project/index.mjs` — la lectura de stdin
- `packages/sdd-mcp/src/http.ts` — la línea de arranque
- `packages/sdd-mcp/src/index.ts` — la bandera `--http`
- `QUICKSTART.md` — el orden de los caminos
- `START_HERE_NON_TECH.md` — el comando del lienzo

## Criterios de éxito

- `npx @juanklagos/create-sdd-project mi-app < /dev/null` crea el proyecto y sale con 0.
- El mismo comando en una terminal sigue preguntando.
- La salida del servidor nombra `/builder` en la primera línea.
- `npx @juanklagos/sdd-mcp --http` levanta el lienzo.
- De cero a ver el tablero: dos comandos documentados.
