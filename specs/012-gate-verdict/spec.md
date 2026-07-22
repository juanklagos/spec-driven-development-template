# Especificación 012 - Veredicto de compuerta: que un verde signifique algo

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-21`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-21 — el autor respondió: *«arregla el fallo real, QUE RESPONDA TODO LO POSIBLE PARA EVITAR ERRORES Y QUE EL USUARIO SUFRA. REVISA COMO SOLVENTARLO, NO IMPORTA SI HAY QUE CAMBIAR ALGO EN GENERAL»*. Consentimiento en `.sdd/user-consent.log`.

## Contexto

La afirmación central de este proyecto es que la regla de oro —no hay código sin spec aprobada— se
verifica por máquina y no solo por prosa. Hoy es falsa, y de dos maneras distintas y verificadas.

**1. La compuerta pasa en verde con una spec sin aprobar.** Reproducido en un sandbox con sidecar:
spec `001-cobros` en `Pendiente`, un `src/payments.js` real con una función `chargeCard`, y
`./spec/scripts/check-sdd-gate.sh .` respondió `SDD Gate summary: 0 error(s), 2 warning(s)` con
código de salida `0`. Una spec sin aprobar solo produce avisos, y `exit 1` únicamente se dispara con
errores.

**2. El extractor de estado falla abierto.** `scripts/check-sdd-gate.sh:118` y
`scripts/validate-sdd.sh:151` usan un `sed` codicioso que se queda con el **último** par de comillas
invertidas de la línea. Sobre una línea con el formato de la propia plantilla:

```text
- Estado / Status: `Pendiente` (target: `approved`)
```

bash extrae `approved` mientras `packages/sdd-core/src/workspace.ts:251`, con una expresión perezosa,
extrae `Pendiente`. La misma línea, dos respuestas, y la de bash es la que abre la puerta.

Esta spec **no** construye el detector de código. Esa pieza (correlacionar los archivos cambiados
contra las specs aprobadas) necesita datos que hoy no existen y se especifica aparte. Lo
que sí hace esta spec es que un verde deje de poder significar «no comprobamos nada».

## Historia de usuario principal

Como responsable de un repositorio donde una IA escribe código, quiero que la compuerta distinga
entre «puedes implementar», «todavía no hay nada aprobado» y «hay errores», y que me diga en cada
ejecución qué comprobó de verdad, para no confundir un verde de disciplina cumplida con un verde de
comprobación ausente.

## Escenarios de aceptación

1. Dado un workspace sin ninguna spec aprobada, cuando ejecuto la compuerta, entonces obtengo
   veredicto `closed` con un motivo legible, y ni el dashboard ni el builder afirman que se puede
   implementar.
2. Dado un workspace con una spec aprobada y su consentimiento registrado, cuando ejecuto la
   compuerta, entonces obtengo veredicto `open` acompañado de la postura: qué comprobaciones estaban
   activas y cuáles no.
3. Dado un workspace con errores de validación, cuando ejecuto la compuerta, entonces obtengo
   veredicto `blocked`, y `blocked` prevalece sobre cualquier otra consideración.
4. Dada una línea de estado que contiene más de un par de comillas invertidas, cuando la leen el
   script de bash y el módulo de TypeScript, entonces ambos devuelven el mismo estado.
5. Dado un workspace recién clonado con el botón «Use this template», cuando ejecuto la compuerta,
   entonces me avisa de que las specs y los consentimientos que contiene son del template y no míos.
6. Dado que registro consentimiento a través de la tool MCP `sdd_record_user_consent` indicando una
   spec, cuando la compuerta evalúa esa spec, entonces reconoce el consentimiento como específico de
   esa spec y no como una línea heredada.

## Criterios de aceptación (formato EARS) / Acceptance criteria (EARS format)

- EL SISTEMA DEBERÁ exponer un campo `verdict` con valor `open`, `closed` o `blocked` tanto en
  `GateResult` como en `GateSummary`, incluido el retorno temprano de workspaces sin specs.
- CUANDO existan errores de compuerta o de validación, EL SISTEMA DEBERÁ devolver `verdict = "blocked"`.
- SI `ok` es `false`, ENTONCES EL SISTEMA DEBERÁ devolver `verdict = "blocked"`, sin excepción.
- CUANDO no exista ninguna spec aprobada y no haya errores, EL SISTEMA DEBERÁ devolver
  `verdict = "closed"`.
- EL SISTEMA DEBERÁ imprimir en cada ejecución una línea de postura que declare qué comprobaciones
  estuvieron activas, y esa línea NO DEBERÁ poder suprimirse por configuración ni por argumento.
- EL SISTEMA DEBERÁ extraer el estado de aprobación con el mismo resultado en bash y en TypeScript
  para toda línea de estado, incluidas las que contengan más de un par de comillas invertidas.
- CUANDO se invoque `sdd_record_user_consent` con un identificador de spec, EL SISTEMA DEBERÁ
  registrar el consentimiento asociado a esa spec.
- CUANDO un workspace contenga las specs de ejemplo del propio template, EL SISTEMA DEBERÁ emitir un
  aviso indicando que esas aprobaciones no son del usuario.
- CUANDO se ejecute `check-sdd-gate.sh --require-open`, EL SISTEMA DEBERÁ terminar con código 2 si el
  veredicto es `closed`.
- EL SISTEMA DEBERÁ aceptar una sección opcional `## Ámbito de archivos / File scope` en `spec.md`,
  parsearla y exponerla, SIN que su ausencia ni su contenido afecten al veredicto.
- SI la documentación afirma que una comprobación es automática, ENTONCES esa comprobación DEBERÁ
  existir en el código.

## Requisitos

- Los códigos de salida por defecto siguen siendo 0 y 1. El comportamiento de quien ya usa la Action
  no cambia salvo que pida `--require-open`.
- La línea de postura y el veredicto viajan por los cuatro consumidores: script de bash, tools MCP,
  API REST del builder y dashboard.
- Los textos de interfaz existen en español e inglés y se mantienen sincronizados entre
  `builder/src/i18n.ts` y `packages/sdd-mcp/src/dashboard.ts`.
- `## Ámbito de archivos / File scope` se siembra en la plantilla, en `new-spec.sh` y en el builder,
  pero no gobierna nada. Su único fin en esta spec es que los datos empiecen a acumularse para la 013.

## Fuera de alcance / Out of scope

- El detector de código (correlacionar archivos cambiados contra specs aprobadas). Va a una spec posterior (la 013 y la 014 fueron a otra cosa),
  que **se diseñó en paralelo a esta**, no aplazada indefinidamente: al aprobar la 012 el
  autor levantó la restricción con *«REVISA COMO SOLVENTARLO, NO IMPORTA SI HAY QUE CAMBIAR ALGO EN
  GENERAL»*, lo que autoriza expresamente cambios estructurales al framework (formatos, superficie de
  tools MCP, andamiadores, convenciones de git, plantilla de spec). Sale de la 012 por secuencia, no
  por descarte: el veredicto y el extractor son su cimiento.
- Cualquier escalón de configuración tipo `off/advisory/strict/paranoid`. Convierte una regla en una
  matriz de severidades duplicada en dos lenguajes, en un repo que ya cerró dos fallos abiertos por
  divergencia entre bash y TypeScript.
- Promover `spec-not-approved` de aviso a error de forma incondicional: pondría en rojo todo
  workspace en fase de redacción, que es el estado normal de un repo con SDD.
- Añadir la compuerta a `.githooks/pre-commit`: `blocked` cubre el caso de una spec aprobada aún sin
  línea de consentimiento, así que el commit que registra la aprobación quedaría bloqueado y la única
  salida sería `--no-verify`.

## Ámbito de archivos / File scope

<!-- Esta spec estrena la sección que ella misma introduce. / This spec dogfoods the section it adds. -->

- `packages/sdd-core/src/index.ts` — `verdict` en `GateResult` y `GateSummary`
- `packages/sdd-core/src/workspace.ts` — extracción de estado, unificada con bash
- `packages/sdd-mcp/src/server.ts` — `specId` en `sdd_record_user_consent`
- `packages/sdd-mcp/src/dashboard.ts` — tres estados y postura
- `builder/src/i18n.ts` — textos ES/EN de veredicto y postura
- `scripts/check-sdd-gate.sh` — veredicto, postura, `--require-open`, extracción
- `scripts/validate-sdd.sh` — extracción y rango de revisiones en modo estricto
- `scripts/new-spec.sh` — siembra de `## Ámbito de archivos`
- `scripts/install-spec-sidecar.sh` — aviso de specs heredadas
- `specs/_template/spec.md` — la sección nueva
- `scripts/test-mcp-integration.mjs` — fixtures y prueba de deriva entre extractores
- `.github/workflows/validate.yml` — `fetch-depth: 0`

## Propiedades de la spec / Spec properties

- Para toda línea de estado posible, EL SISTEMA DEBERÁ producir la misma extracción en bash y en
  TypeScript.
- Para todo resultado de compuerta, `ok === false` DEBERÁ implicar `verdict === "blocked"`.
- Para todo workspace, exactamente uno de `open`, `closed` o `blocked` DEBERÁ aplicar.

## Criterios de éxito

- El caso que originó esta spec queda cubierto: un workspace sin specs aprobadas ya no muestra
  «implementación permitida» en ninguna superficie.
- Las dos implementaciones del extractor coinciden sobre una tabla adversaria de líneas de estado, y
  esa coincidencia está cubierta por una prueba que falla si vuelven a divergir.
- Ninguna afirmación de la documentación sobre comprobación automática queda sin respaldo en código.
- Un `npx @juanklagos/sdd-mcp` recién instalado devuelve `verdict` en todas sus superficies.
