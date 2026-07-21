# Especificación 011 - one-command-launcher

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado`
- Fecha de aprobación / Approval date: `2026-07-21`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-21 — tras la pregunta explícita "¿sigo directo con `npx @juanklagos/sdd`?", el autor respondió "has lo mejor a corto y largo plazo". Decisión y evidencia en `bitacora/decisiones/2026-07-21-no-app-escritorio.md` y `idea/EVALUACION_DESKTOP_2026-07-21.md`. Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como persona que quiere usar el SDD Builder (técnica o no), quiero ejecutar **un solo comando** —o hacer doble clic— y que se abra el builder sobre mi proyecto, sin clonar el repositorio, sin compilar nada y sin configurar variables de entorno.

## Escenarios de aceptación

1. Dado un equipo con Node instalado y sin el repo clonado, cuando ejecuta `npx @juanklagos/sdd`, entonces se elige/crea el workspace de forma interactiva, arranca el servidor y se abre el navegador en el builder ya funcionando.
2. Dado que el puerto por defecto está ocupado, cuando arranca el lanzador, entonces elige otro puerto libre e informa cuál, en vez de fallar.
3. Dado un proyecto creado con `create-sdd-project`, cuando el usuario hace doble clic en el lanzador generado, entonces ocurre lo mismo que en el escenario 1.
4. Dado un usuario que solo quiere el servidor MCP, cuando usa `npx @juanklagos/sdd-mcp`, entonces sigue funcionando exactamente como hoy (sin regresión).

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO se publique `@juanklagos/sdd-mcp`, EL SISTEMA DEBERÁ incluir el frontend compilado del builder en el paquete, y `/builder` DEBERÁ servirlo desde la instalación de npm sin requerir clonar el repositorio.
- CUANDO el puerto solicitado esté ocupado, EL SISTEMA DEBERÁ seleccionar el siguiente puerto libre e imprimir la URL real.
- CUANDO se ejecute el lanzador sin `SDD_PROJECT_ROOT`, EL SISTEMA DEBERÁ ofrecer un selector interactivo de workspace (existente o nuevo) en lugar de fallar.
- CUANDO el entorno no sea interactivo (CI, `--yes`), EL SISTEMA DEBERÁ funcionar con banderas y sin prompts.
- EL SISTEMA DEBERÁ mantener el bind a loopback y las protecciones añadidas en los arreglos críticos (Origin, límite de body).
- EL SISTEMA DEBERÁ ser bilingüe (un idioma a la vez, detectado).

## Requisitos

- R1. Publicar `builder/dist` dentro de `@juanklagos/sdd-mcp` y resolver `BUILDER_DIST` correctamente desde `node_modules` (hoy `static.ts` lo declara "checkout-only by design"); mantener el fallback 503 con instrucciones si faltara.
- R2. Fallback de puerto en el transporte HTTP + imprimir la URL efectiva.
- R3. Apertura automática del navegador (macOS/Windows/Linux/WSL), desactivable con `--no-open`.
- R4. Selector interactivo de workspace (existente, o crear uno nuevo instalando el sidecar), con banderas para modo no interactivo.
- R5. Paquete `@juanklagos/sdd`: un único bin que orquesta R2-R4 y arranca el servidor; documentado en README (EN/ES) y guía 51.
- R6. `create-sdd-project` genera lanzadores locales de doble clic (`SDD.command` / `SDD.bat`) en el proyecto destino, con degradación limpia si el SO los bloquea.
- R7. Gate del `.mcpb`: script/documentación para empaquetar el server stdio como extensión de escritorio, y una verificación registrada de si la vista `ui://sdd/board.html` renderiza en Claude Desktop (bloqueadores conocidos: ext-apps #165 y #671).

## Fuera de alcance / Out of scope

App de escritorio (Electron/Tauri), extensión de VS Code, versión hospedada — ver la decisión registrada. Publicación efectiva en npm (la ejecuta el autor con su OTP).

## Criterios de éxito

- Instalación limpia en un directorio temporal sin el repo: un comando abre el builder funcionando sobre un workspace real.
- Builds, `mcp:test` y los 3 scripts SDD en verde; smoke del tarball empaquetado cubriendo el nuevo lanzador.
