# Decisión clave - La compuerta responde en tres estados y declara su alcance; el detector de código se especifica aparte / Key decision - Three-state gate verdict, code detector deferred

## Date / Fecha

2026-07-21

Spec asociada: [`specs/012-gate-verdict/`](../../specs/012-gate-verdict/), aprobada por el autor en
chat el 2026-07-21, consentimiento en `.sdd/user-consent.log`.

## Context / Contexto

La afirmación central del proyecto era que la regla de oro —no hay código sin spec aprobada— se
verifica por máquina. Era falsa, y de dos maneras distintas, ambas reproducidas antes de escribir
una línea de código:

1. **La compuerta pasaba en verde con una spec sin aprobar.** Sandbox con sidecar, spec `001-cobros`
   en `Pendiente`, un `src/payments.js` con una función `chargeCard` real:
   `SDD Gate summary: 0 error(s), 2 warning(s)`, código de salida `0`. Una spec sin aprobar solo
   generaba avisos, y `exit 1` dependía únicamente de los errores.
2. **El extractor de estado fallaba abierto.** `check-sdd-gate.sh:118` y `validate-sdd.sh:151`
   llevaban cada uno su copia de un `sed` codicioso que captura el **último** par de comillas
   invertidas. Sobre `- Estado / Status: \`Pendiente\` (target: \`approved\`)`, bash extraía
   `approved` y `workspace.ts:251` extraía `Pendiente`.

El origen del punto 1 es más profundo que un `exit`: `ok` era un booleano que no distinguía «puedes
implementar» de «no hay nada aprobado, así que no hay nada que implementar». Los dos casos eran
verdes, y `dashboard.ts` le decía «Implementación permitida» a un usuario con cero specs aprobadas.

## Decision / Decisión

**1. La compuerta responde `open` / `closed` / `blocked`, no un booleano.** Una sola regla,
`computeVerdict` en `sdd-core`, de la que derivan las cuatro superficies. Los errores siempre ganan.
`closed` deja de pintarse en rojo: no es un fallo, es el estado normal de un proyecto que empieza, y
pintarlo de rojo enseña a ignorar el color.

**2. La compuerta declara su propio alcance en cada ejecución, sin posibilidad de suprimirlo.**

```
Comprobado / Checked: politica, estructura de specs, estado de aprobacion, consentimiento, dependencias.
NO comprobado / NOT checked: si el codigo del proyecto corresponde a una spec aprobada.
```

Esta es la pieza que evita reincidir. Un verde ya no puede significar «no comprobamos nada», porque
la propia compuerta dice qué no comprobó.

**3. El detector de código sale de la 012 y se especifica aparte.** Se diseñó y se descartó una
versión ingenua —«fallar si hay código y cero specs aprobadas»— que tres revisiones adversariales
independientes rompieron por la misma vía. El mecanismo elegido para la spec posterior es distinto:
cada spec declara qué rutas gobierna, la compuerta juzga **el diff del pull request** y no el árbol
entero, y la declaración se genera desde git en vez de escribirse a mano.

**4. Las promesas se ajustan a lo verificado.** No a lo que suena mejor. La frase que queda es más
estrecha y es cierta: la compuerta no se abre hasta que hay spec aprobada, plan consistente y
consentimiento registrado.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué se rechazó |
| :--- | :--- |
| **Detector «código presente + cero specs aprobadas»** | La condición es permanentemente falsa en la ruta de entrada principal: `.sdd/user-consent.log` está versionado y las specs vienen aprobadas, así que «Use this template» entrega aprobaciones ajenas. Se burla además creando una spec señuelo, aprobándola y consintiéndola: reproducido en noventa segundos. Y su primera víctima habría sido el propio andamiador del proyecto. |
| **Escalón de configuración `off/advisory/strict/paranoid`** | Convierte una regla en una matriz de severidades duplicada en dos lenguajes, en un repo que ya cerró dos fallos abiertos por divergencia bash/TypeScript. Sus dos mejores ideas —imprimir la postura, y que CI solo pueda subir el listón— se injertaron; la matriz no. |
| **Promover `spec-not-approved` de aviso a error sin condiciones** | El arreglo de dos líneas, y el de mayor tasa de falsos positivos: pondría en rojo todo workspace en fase de redacción, que es el estado normal de un repo con SDD. |
| **Ablandar el discurso sin tocar código** | Más caro, no menos: `check-sdd-policy.sh:112-116` verifica la redacción exacta de la frase de hard stop en nueve archivos de reglas, y el registro del 2026-03-14 ya listaba «dejar el hard stop solo como prosa» entre sus alternativas rechazadas. |
| **Añadir la compuerta a un hook de pre-commit** | `blocked` cubre el caso de una spec aprobada aún sin consentimiento, así que el commit que registra la aprobación quedaría bloqueado y la única salida sería `--no-verify`. |

## Consequences / Consecuencias

**Lo que se gana:** el escenario original ya no ocurre en ninguna superficie. `--require-open` da
salida 2 para quien quiera que muerda en CI, sin cambiar los códigos por defecto, así que ningún
consumidor actual de la Action se pone en rojo. Cuatro fallos independientes cerrados de paso: el
extractor codicioso, el `specId` que faltaba en `sdd_record_user_consent` (todo consentimiento por
MCP caía como línea heredada), el `git diff` sin rango en modo estricto (no se había disparado nunca
en CI) y el consentimiento heredado por «Use this template».

**Lo que se cede:** la afirmación pública se queda más estrecha que el eslogan hasta que el detector
exista. La compuerta sigue sin poder ver código.

**Deuda deliberada:** `## Ámbito de archivos / File scope` se parsea y se expone sin gobernar nada.
Se acepta a sabiendas de que mucha gente la dejará vacía mientras no obligue: el objetivo es que los
datos empiecen a acumularse antes de que exista la regla que los consume, no al revés.

## Cuándo revisar esta decisión / When to revisit

- Cuando diez o más specs de proyectos reales lleven `## Ámbito de archivos` con contenido: esa es la
  señal de que el detector tiene datos sobre los que construirse en vez de convenciones inventadas.
- Si el primer issue externo que reciba este repositorio es sobre la compuerta equivocándose:
  actuar de inmediato. No hay telemetría, así que ese issue sería el único canal de realimentación.
- Si `sdd.policy.yaml` gana una vía de migración —hoy se copia con `copy_if_absent`, así que una
  clave de política nueva no puede llegar jamás a un workspace existente—, que es requisito previo
  para cualquier exigencia configurable por proyecto.
- Si se decide que `closed` deba bloquear por defecto: hoy no lo hace a propósito, y cambiarlo rompe
  a todo consumidor actual de la Action.
