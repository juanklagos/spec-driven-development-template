# Investigación 012 - Veredicto de compuerta

Fuente: workflow de 25 agentes del 2026-07-21 (6 investigaciones, 3 diseños, 3 jueces, 3 atacantes,
síntesis), más reproducción directa en sandbox. Todo hallazgo de abajo está verificado contra el
código o contra una ejecución real, no inferido.

## Hallazgos

### 1. La compuerta pasa en verde con una spec sin aprobar

Sandbox con sidecar, spec `001-cobros` en `Pendiente`, `src/payments.js` con una función `chargeCard`
real. `./spec/scripts/check-sdd-gate.sh .` → `SDD Gate summary: 0 error(s), 2 warning(s)`, salida `0`.
Causa: una spec sin aprobar solo genera avisos, y el `exit 1` de `check-sdd-gate.sh` depende solo de
los errores. El script nunca mira el código ni el diff.

### 2. El extractor de estado falla abierto

`scripts/check-sdd-gate.sh:118` y `scripts/validate-sdd.sh:151` usan `sed -E 's/.*\`([^\`]*)\`.*/\1/'`.
El `.*` inicial es codicioso, así que captura el **último** par de comillas invertidas. Comprobado:

```text
entrada: - Estado / Status: `Pendiente` (target: `approved`)
bash   → approved
TS     → Pendiente     (workspace.ts:251, expresión perezosa)
```

La prueba de deriva existente compara las constantes ERE byte a byte, no el resultado de extraer, así
que este caso le pasa por debajo.

### 3. El diseño que iba a resolverlo no se sostiene

Se evaluó «fallar cuando hay código y cero specs aprobadas». Tres revisiones adversariales
independientes lo rompieron igual:

- `.sdd/user-consent.log` está versionado con 26 líneas y las 11 specs vienen `Aprobado`, así que el
  botón «Use this template» y `degit` entregan aprobaciones y consentimientos ajenos. La condición
  «cero specs aprobadas» sería falsa para siempre en la ruta de entrada principal.
- La condición se burla creando una spec señuelo, aprobándola y consintiéndola: a partir de ahí queda
  autorizado código ilimitado y sin relación.
- El ámbito era conceptualmente erróneo: emparejaba el conteo de aprobaciones del workspace externo
  con el código del workspace interno, ignorando que `scripts/lib/sdd-root.sh` ya expone
  `sdd_governed_tree()` para esa distinción.

### 4. Corrección al hallazgo anterior, verificada después

Se comprobó en una instalación limpia desde npm: `sdd_create_workspace` con perfil `full` produce un
workspace con solo `INDEX.md`, `README.md` y `_template` en `specs/`, y **sin** `.sdd/user-consent.log`.
El andamiador y el MCP no heredan nada. El problema de aprobaciones heredadas se limita a la ruta de
«Use this template» y `degit`, lo que abarata esa parte del trabajo.

### 5. Tres fallos independientes que erosionan la confianza en la respuesta

- `sdd_record_user_consent` (`packages/sdd-mcp/src/server.ts:171-192`) no declara `specId` en su
  esquema y nunca pasa el tercer argumento que `recordUserConsent` acepta. Todo consentimiento
  registrado por la interfaz de agente principal del propio proyecto queda como línea heredada, lo
  que degrada la exigencia por spec a un aviso.
- `scripts/validate-sdd.sh:127` y `:131` llaman a `git diff --name-only` sin rango de revisiones. Tras
  un checkout limpio en CI el árbol de trabajo está limpio, así que siempre devuelve vacío: esa
  comprobación de modo estricto no se ha disparado nunca.
- `.github/workflows/validate.yml:14` usa `actions/checkout@v5` sin `fetch-depth`, es decir con clon
  superficial, lo que impide cualquier comparación contra la rama base.

### 6. `getGateSummary` aplana dos resultados en un solo booleano

Devuelve `ok: gate.ok && validation.ok`, y once puntos de la interfaz ramifican sobre ese campo. Un
`verdict` calculado solo desde `checkGate` descartaría en silencio la mitad de `validateProject`.

### 7. Prior art: el bot de changesets

Es el análogo más cercano que existe («tocaste código y no escribiste el documento acompañante»). Lo
que lo hace tolerable no es el rigor sino tres cosas: la salida es visible y revisable (un archivo en
el PR), la escapatoria es explícita y queda registrada (changeset vacío), y la configuración declara
qué cuenta como fuente. La lección aplicada aquí es la segunda: una comprobación sin escapatoria
honesta se borra la primera vez que se pone en rojo en una fecha límite.

### 8. La postura es el mejor mecanismo antideshonestidad de todos los diseños evaluados

Apareció en el diseño del escalón de configuración, que fue descartado. La idea que sobrevive: un
chip verde nunca debe poder significar «no comprobamos». Hoy `dashboard.ts:58` y
`builder/src/i18n.ts:346` le dicen a un usuario con cero specs aprobadas que la implementación está
permitida.

### 9. `## Ámbito de archivos` es el vocabulario que falta

Hoy el único sitio donde un bundle de spec menciona archivos es una columna en prosa sin parsear en
`specs/_template/history.md:3`. Esa ausencia es la razón de que todo diseño ambicioso de compuerta se
convierta en un ejercicio de invención: no hay dato sobre qué archivos gobierna cada spec.

## Decisiones derivadas de los hallazgos

1. **El detector de código sale del alcance** y pasa a la spec 013, después de que `## Ámbito de
   archivos` acumule datos. Un detector sin ese dato es heurística frágil (hallazgo 3, 9).
2. **La unificación del extractor va primera**, antes del veredicto, porque el veredicto se calcula
   sobre su salida (hallazgo 2).
3. **`verdict` se define en `GateResult` y en `GateSummary`**, con aserción explícita de que
   `ok === false` implica `blocked` (hallazgo 6).
4. **La postura se imprime siempre y no se puede suprimir** (hallazgo 8).
5. **La escapatoria queda para la 013**, junto con el detector: sin comprobación que bloquee no hay
   nada de lo que escapar, y diseñarla antes sería especular (hallazgo 7).
6. **El trabajo de aprobaciones heredadas se restringe** a la ruta de «Use this template» y `degit`
   (hallazgo 4).
7. **Los tres fallos del hallazgo 5 entran en esta spec**, no en un ticket aparte: sin ellos el
   veredicto se calcula sobre datos en los que no se puede confiar.
