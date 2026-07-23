# Decisión clave - La 011 no se cierra ni se deja como estaba: su resto pasa a ser la ruta `npx`, y baja de prioridad / Key decision - Spec 011 is re-scoped to the CLI route, not closed

## Date / Fecha

2026-07-23

## Context / Contexto

La spec 011 («one-command-launcher») fue aprobada el 2026-07-21 con una promesa concreta: *"ejecutar **un solo comando** —o hacer doble clic— y que se abra el builder sobre mi proyecto"* (`specs/011-one-command-launcher/spec.md`, historia de usuario). Nació de la evaluación que en ese momento **rechazaba** la app de escritorio (`bitacora/decisiones/2026-07-21-no-app-escritorio.md`), cuya Fase 1 se titulaba «Quitar la terminal en días».

Un día después esa decisión se revirtió (`bitacora/decisiones/2026-07-22-app-escritorio-electron.md`) y la spec 023 se construyó, se aprobó y se publicó — SDD Desk 0.1.0 en las tres plataformas — **antes de que se tocara T3-T6 de la 011**.

La auditoría del 2026-07-23 encontró que el registro de la 011 era falso en dos direcciones a la vez:

- Decía `Draft / Borrador` en `specs/INDEX.md` cuando la spec estaba **aprobada** desde el 2026-07-21 y con trabajo en `main`.
- Decía 7 de 8 tareas pendientes cuando **tres estaban hechas**: T1 (registrada), T2 (la hizo la spec 023 en el commit `ec7c091`, y la propia 023 lo había anunciado en su R2: *"Es el mismo requisito que 011 R2 — se implementa una vez y sirve a ambos"*) y T7 (commit `3db6619`, titulado literalmente «spec 011 T7»).

Es decir: el trabajo se hizo y la contabilidad no se movió. En un repositorio cuyo producto **es** la trazabilidad, eso no es un detalle administrativo.

## Decision / Decisión

**La 011 no se cierra por superada, y tampoco se deja como estaba.** Se re-alcanza:

1. **T2 y T7 se marcan hechas**, con la evidencia y la spec que las hizo escrita al lado de cada casilla (`specs/011-one-command-launcher/tasks.md`). El cabo suelto de T7 —el veredicto de host del `.mcpb`— queda declarado en la propia tarea, no escondido detrás de la marca.
2. **Lo que queda (T3-T6, T8) deja de ser «quitar la terminal» y pasa a ser explícitamente la ruta `npx`.** El escritorio ya sirve al público sin terminal; el CLI sigue sirviendo a quien ya tiene Node y prefiere no instalar una app. Son dos públicos, no dos intentos del mismo.
3. **La prioridad baja de Alta a Media.** La promesa urgente («que una persona no técnica abra el builder») la cumple el escritorio hoy. Lo que queda es comodidad para el público que ya podía hacerlo.
4. **El estado en `specs/INDEX.md` pasa a `In Progress`**, con el detalle de qué queda.

Lo que **no** cambia: los requisitos R3-R6 siguen escritos como estaban. No se reescribe la spec aprobada; se corrige su contabilidad y se anota a quién sirve ahora.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Cerrar la 011 como superada por la 023** | El hueco real sigue ahí: quien ejecuta `npx @juanklagos/sdd-mcp --http` sin `SDD_PROJECT_ROOT` no tiene selector de workspace ni apertura de navegador. El selector nativo de `desk/src/main/dialogs.ts` es de Electron y el CLI no lo hereda. Cerrarla sería declarar resuelto algo que no lo está |
| **Dejarla como estaba** | El registro era falso en dos direcciones. Mantenerlo cuesta más que corregirlo: la próxima persona que lea `tasks.md` volvería a implementar el fallback de puerto que ya existe |
| **Disolver el resto en una spec nueva** | Los requisitos R3-R6 siguen siendo válidos tal como se escribieron y ya están aprobados. Una spec nueva solo repetiría el texto y perdería el hilo de la aprobación del 2026-07-21 |
| **Marcar T7 como pendiente por el cabo suelto** | El entregable que T7 pedía —empaquetado del `.mcpb` + verificación registrada— existe. Lo que falta es un veredicto que depende de un host de terceros con bloqueadores conocidos (ext-apps #165, #671). Dejar la tarea abierta por algo que no depende del proyecto convierte la lista en ruido |

## Consequences / Consecuencias

**A favor**
- `tasks.md`, `INDEX.md` y `STATUS.md` vuelven a describir la realidad, y cada casilla marcada apunta al commit que la hizo.
- Se documenta el patrón que causó el desfase —una spec implementando el requisito de otra— para que la próxima vez la casilla se marque en el momento.

**Costos aceptados**
- La ruta `npx` queda formalmente en segundo plano. Quien la use seguirá encontrando el hueco del selector de workspace hasta que T4 se implemente.
- El paquete `@juanklagos/sdd` (T5) sigue sin existir, y la documentación que lo prometa —si la hay— sigue siendo una promesa. **Verificado:** no aparece en `packages/`.

**Cuándo revisar esta decisión**
- Si llegan reportes de usuarios de `npx` tropezando con el arranque: la prioridad Media deja de ser correcta.
- Si el escritorio absorbe también al público técnico (medible: descargas de SDD Desk contra descargas del paquete npm), entonces sí procede cerrar la 011 por superada, y esta decisión debe reemplazarse, no editarse.
- Si vuelve a ocurrir que una spec implementa el requisito de otra sin marcarlo: la corrección puntual no bastó y hace falta un chequeo mecánico (por ejemplo, que `check-sdd-gate.sh` avise cuando un commit nombre una tarea de una spec distinta a la activa).
