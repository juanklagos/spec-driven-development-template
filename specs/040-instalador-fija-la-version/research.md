# Investigación 040 - El instalador entrega la versión que dice entregar

Todo lo de abajo se midió el 2026-08-25 sobre el repositorio en HEAD `1756603`,
sobre los tarballs publicados de `@juanklagos/create-sdd-project@2.6.0`,
`@juanklagos/sdd-mcp@2.6.0` y `@juanklagos/sdd-core@2.6.0`, y sobre una
instalación real en `/Users/juanklagos/www/El-MERDN`.

## R1. El síntoma, tal como lo ve un usuario

`sdd-mcp upgrade --dry-run` sobre un sidecar instalado ese mismo día:

```
Version instalada / installed: 2.6.0  →  servidor / server: 2.6.0
  TUYO, intacto / yours, untouched specs/_template/spec.md
Estos archivos son TUYOS y difieren de la versión nueva. No se tocaron:
  specs/_template/spec.md
```

Mismo número de versión a ambos lados, y aun así un archivo divergente.

## R2. El usuario no editó nada

El clon `--depth 1` que usa el instalador se conservó para comparar:

```
diff -q <clon>/specs/_template/spec.md <proyecto>/spec/specs/_template/spec.md
→ idénticos
```

El archivo instalado es byte a byte el que puso el instalador. La atribución
del mensaje —"estos archivos son TUYOS"— es incorrecta en este caso.

## R3. Qué difiere exactamente

Contra `packages/sdd-core/framework/specs/_template/spec.md` del tarball npm:

```diff
-- Evidencia de aprobación / Approval evidence:
-<!-- Qué se aprobó, con qué alcance y contra qué documento o propuesta, con la fecha. -->
-<!-- NO transcribas el chat: «hazlo» o «dale» no dicen qué se aprobó. -->
-<!-- What was approved, its scope, the document it was approved against, and the date. -->
-<!-- Do NOT transcribe chat: "go ahead" says nothing about what was approved. -->
-<!-- Ejemplo / Example: Aprobado en sesión del 2026-03-18: alcance A y B sobre `idea/PROPUESTA.md`. -->
+- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote):
```

Lo que el usuario tiene es lo que introdujo la **spec 037**. Lo que el
diagnóstico llama "la versión nueva" es la línea anterior a la 037. La dirección
está invertida: `--apply` sería un retroceso.

Agravante: el campo afectado es el que `scripts/check-sdd-gate.sh` exige no
vacío para abrir la compuerta. La 037 existe precisamente para que ese campo no
se rellene transcribiendo el chat. Revertirla en el proyecto de un usuario
reintroduce la práctica que la 037 eliminó.

## R4. Alcance de la divergencia

Comparados los 72 archivos de framework comunes entre el clon git y el payload
npm 2.6.0:

| Resultado | Archivos |
|---|---|
| Idénticos | 71 |
| Divergentes | 1 (`specs/_template/spec.md`) |

`template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` parece divergente
en una comparación ingenua, pero no lo es: el instalador copia la variante
`templates/sidecar/...`, que coincide en git y en npm. Por eso el `--dry-run` no
lo reporta. La comparación hay que hacerla contra la variante correcta.

## R5. Cronología: la ventana se abre a los 29 minutos

`git log --format='%cI %h %s'` y `npm view @juanklagos/sdd-core time --json`:

| Evento | Hora (UTC) |
|---|---|
| `4c313a4 chore(release): v2.6.0` | 2026-08-20 14:47:58 |
| `sdd-core@2.6.0` publicado en npm | 2026-08-20 14:57:12 |
| `df2aa57` modifica `specs/_template/spec.md` (spec 037) | 2026-08-20 15:26:41 |
| `34c2901` builder (spec 038) | 2026-08-20 15:36 |
| `1756603` builder (spec 039) | 2026-08-20 16:20 |

Tres commits la misma tarde del release. Es el patrón de trabajo normal, no una
anomalía, así que la ventana se abre en cada publicación.

**Nota metodológica:** una primera medición usó `npm view ... time.created` y dio
2026-07-20, que es la fecha de creación del **paquete**, no de la versión. La
cifra correcta es `time["2.6.0"]`. El error exageraba el desfase de 29 minutos a
un mes; la conclusión no cambia, pero la magnitud sí, y con ella la lectura: no
es negligencia acumulada, es una consecuencia estructural inmediata.

## R6. La causa

`packages/create-sdd-project/index.mjs:100`:

```js
execFileSync("git", ["clone", "--depth", "1", REPO, tmp], { stdio: "inherit" });
```

Sin `--branch`. Clona la rama por defecto, es decir HEAD. `sdd-mcp upgrade`
compara contra el payload de `@juanklagos/sdd-core`, que corresponde al tag. Dos
fuentes bajo la misma etiqueta de versión.

El clonado ocurre una sola vez, antes de ramificar entre modo `sidecar` y modo
`full` (`index.mjs:102-113`), de modo que un único arreglo cubre ambos.

## R7. Lo que NO es la causa

Se descartó que el payload estuviera mal construido:

- `git ls-files packages/sdd-core/framework` → **0 archivos**. No se versiona.
- Se genera en el release desde el repositorio
  (`scripts/build-framework-payload.mjs:18`, `payloadRoot`).
- En HEAD, `specs/_template/spec.md` y su copia en el payload local **coinciden**.

Por tanto `scripts/build-framework-payload.mjs` funciona y no requiere cambios.
Republicar sin arreglar el clonado cerraría esta divergencia concreta y abriría
la siguiente en el primer commit posterior.

## R8. Por qué no lo detectó nada

Ningún build falla, ningún test falla, ningún gate se cierra. La divergencia solo
se manifiesta cuando un usuario que instaló entre dos releases ejecuta el
diagnóstico de actualización, meses después y en otro repositorio. No hay
señal en CI que pueda capturarlo, porque el defecto está en la relación entre
dos artefactos publicados en momentos distintos.

## R9. Hallazgo colateral (fuera de alcance de esta spec)

`scripts/new-spec.sh:18` se niega a crear specs cuando detecta
`sdd.policy.yaml` + `scripts/create-www-project.sh` + `www/` en la raíz — es
decir, en el propio repositorio del framework:

```
Error: refusing to create spec in template root.
```

Las specs 037, 038, 039 y esta se crean copiando `specs/_template/` a mano. La
guarda protege un caso real (mezclar trabajo de framework con trabajo de un
proyecto destino) pero deja al repositorio sin poder usar su propia herramienta
para su propio mantenimiento. No se toca aquí: merece su propia spec y una
decisión sobre si el mantenimiento del framework debe ser una excepción
explícita o seguir siendo manual.

## R9b. El orden del release desactivaría el arreglo

`RELEASING.md` §6 publica los tres paquetes en npm; §7 empuja el tag. En ese
orden. Verificado además que `v2.6.0` apunta a `4c313a4`, el propio commit de
release: el árbol del tag es el mismo desde el que el `prepack` construyó el
payload, lo que hace verificable el escenario 2 de la spec.

Consecuencia si la 040 se implementara dejando `RELEASING.md` intacto: entre el
`npm publish` y el `git push --tags` existe una ventana en la que
`create-sdd-project@X.Y.Z` es instalable y `vX.Y.Z` no existe en el remoto. Toda
instalación en esa ventana cae al fallback —HEAD— con lo que el defecto
sobrevive al arreglo, ahora con advertencia. De ahí la decisión 4 de la spec.

Comprobado también el comportamiento en que se apoya la fase 1, contra el remoto
real:

```
git ls-remote --tags <REPO> refs/tags/v2.6.0   → 4c313a4  refs/tags/v2.6.0   (exit 0)
git ls-remote --tags <REPO> refs/tags/v99.0.0  → (vacío)                     (exit 0)
```

## R10. Instalaciones ya existentes

El-MERDN queda con la divergencia hasta el siguiente release. La acción correcta
allí es no aplicar nada, porque su archivo es el más nuevo. Queda registrado en
`spec/bitacora/decisiones/2026-08-25-no-aplicar-upgrade-spec-template.md` de ese
proyecto, con esta misma cronología.

## R11. Hallazgo colateral: la compuerta avisa, no bloquea

Con la 040 en `Pendiente`, `./scripts/check-sdd-gate.sh .` termina con **código
0** e imprime `Compuerta / Gate: ABIERTA`. La spec sin aprobar aparece solo como:

```
[WARN] 040-instalador-fija-la-version not approved yet (implementation gate should remain closed)
```

Lo que impide implementar sin aprobación es la regla escrita en `CLAUDE.md` y en
`AGENT_OPERATING_SYSTEM.md`, no el script: un CI que se limite a mirar el código
de salida deja pasar la implementación de una spec pendiente. Puede ser
deliberado —un aviso no rompe el trabajo en curso— pero no está registrado como
decisión. Fuera de alcance aquí; merece su propia spec junto con §R9.
