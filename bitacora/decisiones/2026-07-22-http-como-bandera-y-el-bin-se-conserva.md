# Decisión clave - `--http` se añade al binario principal y `sdd-mcp-http` se conserva; la intermitencia de npx se rodea, no se diagnostica / Key decision - `--http` added, `sdd-mcp-http` kept, npx flakiness designed around rather than diagnosed

## Date / Fecha

2026-07-22

Spec asociada: [`specs/020-front-door-two-commands/`](../../specs/020-front-door-two-commands/),
aprobada por el autor en chat el 2026-07-22 («arreglalo»), consentimiento en
`.sdd/user-consent.log`.

## Context / Contexto

El comando documentado para abrir el lienzo era
`npx -p @juanklagos/sdd-mcp sdd-mcp-http`. Durante la verificación de la 2.2.0 falló 3
veces con `sh: sdd-mcp-http: command not found` y funcionó 6 veces, el mismo comando en
la misma máquina, en el mismo cuarto de hora.

Se descartaron por experimento, no por razonamiento:

- **La bandera `-y`.** La había añadido yo en el intento de reproducción; no está en la
  documentación. Sin ella también falló.
- **El caché de npx.** Se borró `~/.npm/_npx` entre intentos. Tras un fallo, el caché
  quedaba vacío: npx no llegó a instalar nada y fue directo a `sh -c`.
- **Un `node_modules` en el árbol de directorios.** Se probó en directorio aislado, en un
  proyecto con `node_modules`, y en un subdirectorio de ese proyecto. Los tres sirvieron.

No se identificó el patrón. `npm i -g @juanklagos/sdd-mcp && sdd-mcp-http` funcionó
siempre.

## Decision / Decisión

Se añade `--http` al binario `sdd-mcp`, el que lleva el nombre del paquete, de modo que
`npx @juanklagos/sdd-mcp --http` llegue al lienzo. `http.js` arranca el servidor como
efecto de su importación, así que la implementación es un `await import("./http.js")` bajo
la bandera: no se duplica lógica de arranque.

`sdd-mcp-http` se conserva sin cambios.

**No se persigue la causa de la intermitencia.** Es una decisión de diseño y no un
diagnóstico: se elimina de la ruta la pieza que fallaba —que npx resuelva un binario
distinto del que da nombre al paquete— en lugar de explicarla.

## Alternatives considered / Alternativas consideradas

- **Seguir investigando npx hasta encontrar la causa.** Rechazada por coste contra
  beneficio: el síntoma es de npm, no del paquete, y aunque se encontrase la causa el
  arreglo seguiría estando fuera de este repositorio. La bandera cierra el problema del
  usuario hoy, con o sin diagnóstico.
- **Retirar `sdd-mcp-http` y dejar solo la bandera.** Rechazada. El binario aparece en
  documentación publicada fuera de este repositorio y puede estar en configuraciones MCP
  de terceros. Quitarlo rompería a quien ya nos usa, a cambio de nada.
- **Documentar `npm i -g` como vía recomendada.** Rechazada como recomendación por
  defecto: instalar algo global es más intrusivo que ejecutar un `npx`, y para alguien no
  técnico es una decisión que no debería tener que tomar en su primer minuto.
- **Abrir el navegador automáticamente al arrancar.** Rechazada. El servidor puede correr
  en un contenedor o en una sesión remota, y abrir ventanas sin permiso es peor que no
  abrirlas. Se imprime la URL y decide la persona.

## Consequences / Consecuencias

- Hay dos formas de llegar al mismo servidor. Es duplicidad deliberada, y el README del
  paquete lo dice explícitamente para que nadie la lea como un descuido.
- La documentación pasa a usar `--http` en todas partes. La forma vieja solo sobrevive
  donde es historia: el CHANGELOG de la 2.2.0 y la investigación de esta spec.
- Si la intermitencia de npx afectaba también a otros paquetes del ecosistema, aquí no
  queda constancia de la causa. Quien se la encuentre después empezará de cero.

## Cuándo revisar esta decisión / When to revisit

- Si npm publica un arreglo o una explicación de la resolución de binarios con `-p`, y
  `sdd-mcp-http` deja de ser una vía de segunda.
- Si la telemetría o las issues muestran que nadie usa `sdd-mcp-http`, retirarlo pasa a
  ser barato y la duplicidad deja de estar justificada.
- Si aparece un tercer transporte, porque entonces `--http` como bandera suelta se queda
  corto y toca un subcomando de verdad.
