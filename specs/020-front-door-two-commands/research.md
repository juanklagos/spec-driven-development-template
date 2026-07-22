# Investigación 020 - Dos comandos hasta el lienzo

## Hallazgos

- `npx @juanklagos/create-sdd-project mi-app` sin TTY: sale con
  `Warning: Detected unsettled top-level await at .../index.mjs:54` y no crea nada.
  Con `--mode=sidecar` y con stdin alimentado (`printf "sidecar\n" | ...`) funciona.
  Verificado contra el paquete publicado 2.2.0, no contra el checkout.
- La salida completa de `sdd-mcp-http` al arrancar es una sola línea, la del `/mcp`.
  Verificado ejecutando el binario instalado globalmente desde el registro.
- `QUICKSTART.md`: 13 bloques `bash`, 8 pasos, cero menciones a `create-sdd-project`.
  `README.md` lo menciona una vez, en la línea 153. `START_HERE_NON_TECH.md`, dos veces,
  dentro del prompt que se le pasa a la IA.
- `npx -p @juanklagos/sdd-mcp sdd-mcp-http`: 3 fallos con
  `sh: sdd-mcp-http: command not found` y 6 éxitos, mismo comando y misma máquina.
  Se descartaron por experimento: la bandera `-y` (no está en la documentación), el caché
  de npx, y la presencia de un `node_modules` en el árbol de directorios. No se identificó
  la causa y no se afirma ninguna.
- `npm i -g @juanklagos/sdd-mcp && sdd-mcp-http` funcionó siempre.

## Decisiones derivadas de los hallazgos

- **No se persigue la causa de la intermitencia de npx.** Se elimina la dependencia:
  con `--http` sobre el binario que da nombre al paquete, la resolución que fallaba deja
  de estar en el camino. Es una decisión de diseño, no un diagnóstico.
- **No se abre el navegador automáticamente.** El servidor puede estar en un contenedor o
  en una sesión remota. Se imprime la URL y decide la persona.
- **`sdd-mcp-http` no se retira.** Está documentado fuera de este repositorio y puede
  estar en configuraciones MCP de usuarios. Quitarlo sería romper a quien ya nos usa.
