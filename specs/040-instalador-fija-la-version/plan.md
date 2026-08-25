# Plan 040 - El instalador entrega la versión que dice entregar

## Resumen

Un cambio localizado en `packages/create-sdd-project/index.mjs`: resolver qué
git ref clonar antes de clonar, en vez de tomar la rama por defecto. Tres
fuentes en orden de precedencia — `--ref` explícito, tag `v<version>` de la
propia versión del paquete, rama por defecto como último recurso anunciado.

No toca el payload ni `sdd-mcp`. Sí toca el proceso de release, porque el orden
actual lo desactivaría: `RELEASING.md` publica en npm antes de empujar el tag, y
con la resolución por ref eso convierte cada release en una ventana de fallback.
Los pasos §6 y §7 se invierten.

## Contexto técnico

El clonado vive hoy en una sola línea (`index.mjs:100`):

```js
execFileSync("git", ["clone", "--depth", "1", REPO, tmp], { stdio: "inherit" });
```

Se ejecuta una vez y sirve a los dos modos, `sidecar` y `full`, que se ramifican
después. Por eso el arreglo es único y cubre ambos.

Para saber si el tag existe sin clonar dos veces:

```
git ls-remote --tags <REPO> refs/tags/v<version>
```

Devuelve salida vacía y código 0 cuando el tag no existe, de modo que la
comprobación es sobre la salida, no sobre el código de salida.

La versión propia se lee del `package.json` del paquete. En ESM, sin
`require`, mediante `readFileSync(new URL("./package.json", import.meta.url))`.
Esto mantiene el paquete zero-dependency y evita añadir un noveno sitio a la
lista de bump de `RELEASING.md` §1.

Detalle de empaquetado a verificar antes de dar la fase 1 por buena: el
`package.json` debe viajar dentro del tarball publicado en la ruta que
`import.meta.url` resuelve. En el tarball 2.6.0 inspeccionado el 2026-08-25 los
archivos son `package/index.mjs` y `package/package.json`, hermanos, así que la
URL relativa resuelve.

## Fases de implementación

1. **Resolución de ref.** Añadir a `index.mjs` la función que decide la ref y la
   comprobación con `git ls-remote`. Aplicar `--branch <ref>` al clone. Imprimir
   siempre la ref usada, y la advertencia cuando se cae a la rama por defecto.
   Añadir el flag `--ref` al parser existente y a la ayuda de `--help`.

2. **Verificación end-to-end contra un tag real.** Instalar en un directorio
   temporal usando el paquete local, comprobar que el contenido coincide con el
   payload de `@juanklagos/sdd-core` de la misma versión, y que
   `sdd-mcp upgrade --dry-run` sobre esa instalación devuelve cero divergencias.
   Esta fase es la que demuestra la spec; sin ella el cambio es plausible pero
   no verificado.

3. **Verificación de los tres caminos.** Tag existente, tag ausente (versión
   inventada) y `--ref` explícito a una rama, comprobando en cada caso el texto
   que se imprime.

4. **Proceso de release y documentación.** Invertir §6 y §7 de `RELEASING.md`:
   `git tag vX.Y.Z && git push origin main --tags` pasa a ejecutarse antes de los
   tres `npm publish`, con la explicación de por qué el orden ahora importa y de
   cómo se deshace un tag empujado por error
   (`git push origin :refs/tags/vX.Y.Z`), que es lo que hace aceptable el
   cambio frente al `> [!WARNING]` que abre el documento. Añadir `--ref main` al
   comando de verificación del §4, que corre antes de que el tag exista. Y
   documentar `--ref` en el README del paquete.

## Dependencias

- Ninguna nueva. `git ls-remote` ya es requisito implícito: el paquete ya exige
  `git` para clonar.
- La fase 2 requiere que exista al menos un tag publicado en el remoto, lo cual
  ya se cumple (`v2.3.0` … `v2.6.0`).

## Hitos

- H1: `index.mjs` resuelve la ref y la anuncia; los tres caminos se comportan
  como dicen los criterios EARS.
- H2: una instalación desde tag publicado produce cero divergencias en
  `sdd-mcp upgrade --dry-run`.
- H3: `--ref` documentado, §6 y §7 de `RELEASING.md` invertidos y §4 con `--ref`
  explícito.

## Riesgos

- **El tag pasa a empujarse antes de publicar.** Es la inversión de la fase 4, y
  contradice el criterio con el que se escribió `RELEASING.md` —todo antes de
  `npm publish`, porque npm no deja despublicar—. Se acepta porque los dos
  errores no son del mismo tipo: un tag empujado de más se borra del remoto, una
  versión npm publicada se queda. El riesgo residual es la ventana entre el push
  del tag y el `npm publish`, de segundos, y en ella no hay nada instalable
  todavía.

- **La verificación del §4 corre sin tag, por diseño.** El tag no se empuja
  hasta que pasa la compuerta del §5. Por eso ese comando lleva `--ref main`: sin
  él, la verificación previa a cada release imprimiría una advertencia de
  fallback que no señala ningún problema real y acabaría normalizándose.

- **Réplicas sin tags.** Un fork o mirror que no traiga tags instalará siempre
  por fallback. Es correcto y queda anunciado en cada ejecución.

- **No corrige las instalaciones ya existentes.** El-MERDN y cualquier otro
  proyecto instalado antes de este cambio seguirán mostrando la divergencia
  hasta el siguiente release. Es aceptable: el archivo divergente es el más
  nuevo y no aplicar nada es la acción correcta, ya registrada en la bitácora de
  ese proyecto.

- **El texto de `sdd-mcp upgrade` sigue atribuyendo al usuario divergencias que
  no causó.** Esta spec reduce su frecuencia a casi cero pero no lo corrige. Es
  trabajo separado y deliberadamente fuera de alcance.
