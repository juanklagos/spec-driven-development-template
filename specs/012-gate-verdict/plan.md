# Plan 012 - Veredicto de compuerta

## Resumen

Un solo cambio conceptual —la compuerta pasa de responder «sí/no» a responder «abierta / cerrada /
bloqueada», y declara qué comprobó— más los cuatro fallos que hacen que hoy no se pueda confiar en su
respuesta. Sin detector de código: eso es la 013.

El orden no es negociable. La unificación del extractor va **primera**, porque el veredicto se
calcula sobre lo que el extractor devuelve: construirlo encima de un extractor que falla abierto
sería darle una interfaz nueva al mismo error.

## Contexto técnico

Cuatro consumidores leen el estado de la compuerta y hay que moverlos juntos:

| Consumidor | Archivo | Qué cambia |
|---|---|---|
| Script de bash | `scripts/check-sdd-gate.sh` | Extracción, veredicto, postura, `--require-open` |
| Tools MCP | `packages/sdd-mcp/src/server.ts` | `verdict` en la salida; `specId` en el consentimiento |
| Dashboard | `packages/sdd-mcp/src/dashboard.ts` | Tres estados y línea de postura |
| Builder | `builder/src/i18n.ts` y componentes | Chip de tres estados, textos ES/EN |

La lógica vive en `packages/sdd-core` y los transportes son finos: ya está decidido en
`bitacora/decisiones/2026-07-20-logica-en-sdd-core-transportes-finos.md` y esta spec lo respeta. El
único cálculo duplicado que subsiste es el de bash, que no puede importar TypeScript; por eso la
prueba de deriva entre ambos extractores es un entregable y no un extra.

Trampa conocida: `getGateSummary` devuelve `ok: gate.ok && validation.ok`, y once puntos de la
interfaz ramifican sobre ese campo aplanado. Si `verdict` se calcula solo desde `checkGate`, se
descarta en silencio la mitad de `validateProject` y un workspace roto se pinta verde. Por eso
`verdict` debe existir en **ambos** tipos, y la implicación `ok === false ⟹ verdict === "blocked"`
debe estar aseverada en las pruebas.

Segunda trampa: el retorno temprano para workspaces sin specs en `packages/sdd-core/src/index.ts`
construye un literal. Si no se le añade `verdict`, todo workspace nuevo sirve `verdict: undefined`.

## Fases de implementación

1. **Extractor unificado.** Hacer perezoso el `sed` de bash para que coincida con la expresión de
   TypeScript, en `check-sdd-gate.sh` y en `validate-sdd.sh`. Extender la prueba de deriva de
   `scripts/test-mcp-integration.mjs` para que compare la **extracción** de ambas implementaciones
   sobre una tabla adversaria, no solo la igualdad byte a byte de las constantes ERE.
2. **`verdict` en el núcleo.** Añadirlo a `GateResult` y a `GateSummary`, incluido el literal del
   retorno temprano. Aserción `ok === false ⟹ verdict === "blocked"`.
3. **Bash: veredicto y postura.** Ambas líneas antes del resumen, insuprimibles. `--require-open` con
   un bucle de argumentos de verdad: hoy el script parsea por posición y
   `./scripts/check-sdd-gate.sh --require-open` falla con «not an SDD workspace». Replicar el parser
   en la copia del sidecar.
4. **Los tres fallos restantes.** `specId` en `sdd_record_user_consent`; rango de revisiones real en
   `validate-sdd.sh:127`, cuyo `git diff` sin rango nunca se ha disparado tras un checkout limpio; y
   `fetch-depth: 0` en `validate.yml`.
5. **Aprobaciones heredadas.** Restringido a lo que de verdad falla: la ruta de «Use this template» y
   `degit`. Verificado que el andamiador y `sdd_create_workspace` **no** heredan specs ni consent log.
   Documentar `reset-template.sh --confirm` como primer paso en QUICKSTART y ambos READMEs, y emitir
   un aviso de compuerta cuando el workspace todavía contiene las specs de ejemplo del template.
6. **`## Ámbito de archivos`.** Sección en `specs/_template/spec.md`, parser junto a
   `extractApprovalStatus`, siembra en `new-spec.sh` y en el builder, expuesta en `sdd_spec_coverage`.
   Sin gobernar nada. Solo el encabezado en la plantilla: cualquier prosa explicativa dentro de un
   archivo de plantilla sobrevive al `cp` y acaba dentro de la spec confidencial del usuario.
7. **Interfaz de tres estados.** Chip y tarjeta con el estado nuevo «cerrada pero no bloqueada», más
   la etiqueta de postura. Cuatro claves de i18n en cada idioma, en los dos archivos que ya se
   reflejan mutuamente.
8. **Afirmaciones falsas.** Reescribir las que dicen que algo se comprueba por máquina cuando no.
   Editar `scripts/generate-llms-txt.sh`, no `llms.txt`, o se revierte en la siguiente regeneración.
   No tocar las 47 apariciones de la frase de hard stop: enuncian la regla como instrucción a un
   agente, lo cual es cierto, y `check-sdd-policy.sh:112-116` verifica su redacción exacta.
9. **Fixtures y regeneración.** Constructor de workspace de layout completo junto al de sidecar;
   casos de cero specs, spec sin aprobar, aprobada y consentida, y una secuencia andamiador→compuerta
   que debe salir verde. Regenerar `demo.gif`, porque `demo.tape:25` mete la salida de la compuerta en
   la portada del README, y refrescar las capturas de la guía 51.

## Dependencias

- Ninguna externa. Todo el trabajo es sobre código ya presente en el repositorio.
- La spec 013 depende de esta: sin `## Ámbito de archivos` acumulando datos, el detector vuelve a ser
  un ejercicio de invención.

## Hitos

- **H1** — extractor unificado y prueba de deriva en verde (fase 1). Es el que cierra el fallo abierto.
- **H2** — `verdict` en las cuatro superficies con la interfaz de tres estados (fases 2, 3, 7).
- **H3** — fallos, herencia y ámbito de archivos (fases 4, 5, 6).
- **H4** — documentación alineada y activos regenerados (fases 8, 9).

## Riesgos

- **La postura cambia la salida.** Aparece en toda ejecución y afecta a cualquier script que parsee
  la salida. Mitigación: va antes del resumen, y la línea de resumen conserva su formato exacto.
- **Deriva bash/TypeScript otra vez.** Es la tercera vez que este repo la sufre. Mitigación: la
  prueba compara extracciones, no constantes, que es justo lo que la prueba anterior dejaba pasar.
- **`sdd.policy.yaml` se copia con `copy_if_absent`.** Ninguna clave de política nueva puede llegar a
  un workspace existente. Esta spec no introduce claves de política por ese motivo; la 013 tendrá que
  resolver la migración antes de necesitar una.
- **Alcance que se estira.** El detector de código es tentador y está fuera. Si aparece en una tarea,
  esa tarea pertenece a la 013.
