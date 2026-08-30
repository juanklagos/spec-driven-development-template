# Plan 043 - El template puede usar sus propias herramientas sobre sí mismo

## Resumen

Tres fases. La primera fija por escrito, en pruebas, lo que la guarda hace hoy
—incluido lo que debe seguir haciendo— para que mover la regla no se lleve por
delante la protección que sí importa. La segunda mueve la regla. La tercera
alinea el script de shell, que tiene su propia copia del bloqueo.

Es un cambio pequeño en líneas y grande en superficie: `resolveSddRoot` es la
puerta de 25 llamadas. Por eso el orden es «primero la red, después el cambio»,
igual que en la 042.

## Contexto técnico

**Un solo punto de aplicación, dos políticas mezcladas.**
`packages/sdd-core/src/workspace.ts:170-172`:

```
export async function resolveSddRoot(projectRoot: string): Promise<string> {
  const root = path.resolve(projectRoot);
  await ensureProjectRootAllowed(root);
  ...
```

`ensureProjectRootAllowed` (`workspace.ts:108-130`) impone tres reglas:

| Regla | A qué operación pertenece de verdad |
|---|---|
| `root === framework.root` → «no puede ser la raíz del template» | crear un proyecto destino |
| dentro de `node_modules` del paquete instalado | crear un proyecto destino |
| dentro del template pero fuera de `www/` | crear un proyecto destino |

Las tres son sobre *dónde se materializa un proyecto destino*. Ninguna es sobre
*de dónde se leen unas specs*. Están aplicadas en el sitio equivocado.

**Quién crea proyectos destino.** `createWorkspace` (`index.ts:103`),
`installSidecar` (`index.ts:166`) y el descubrimiento heredado
(`legacy.ts:50`, que **ya** llama a la guarda por su cuenta). Ésos son los tres
sitios donde la regla tiene sentido.

**Qué pasa a permitirse.** Todo lo que hoy sólo puede leer o mantener el propio
repositorio: `listSpecs`, `scoreSpec`, `generateStatus`, `generateRoadmap`,
`getBoardView`, la bitácora, la cola, la política y `createSpec`. Que
`createSpec` entre en la lista es deliberado: este repositorio tiene 42 specs y
todas se crearon aquí.

**El script tiene su propia copia.** `scripts/new-spec.sh` no pasa por
`sdd-core`: comprueba a mano la presencia de `sdd.policy.yaml`,
`scripts/create-www-project.sh` y `www/`. Hay que tocarlo aparte o el arreglo
sólo llega a la mitad de los caminos.

## Fases de implementación

1. **La red.** Pruebas de `ensureProjectRootAllowed` y de `resolveSddRoot` que
   fijan el comportamiento actual: los tres rechazos y los casos que ya pasan.
   Sin cambiar nada todavía. Cubre R4.

2. **Mover la regla.** Quitar la llamada de `resolveSddRoot` y añadirla
   explícitamente en `createWorkspace` e `installSidecar`; comprobar que
   `legacy.ts` ya la tiene. Invertir en las pruebas de la fase 1 los casos que
   pasan a permitirse, y dejar intactos los tres rechazos. Cubre R1 y R2.

3. **El script y el cierre.** Alinear `scripts/new-spec.sh` con la misma
   distinción; crear una spec de prueba en este repositorio y borrarla para
   comprobarlo de punta a punta; `CHANGELOG.md`, `history.md`, y añadir a
   `RELEASING.md` el paso de regenerar `STATUS.md`, que a partir de aquí se
   puede hacer desde el repositorio. Cubre R3.

## Dependencias

- **Fase 1 antes que la 2.** `resolveSddRoot` es la puerta de 25 llamadas:
  moverla sin red es exactamente el tipo de cambio que se descubre roto en un
  proyecto de un usuario.
- Ninguna dependencia externa nueva.
- Sin relación con la spec 042 más allá de compartir repositorio.

## Hitos

- **H1.** La guarda tiene pruebas, en verde sobre el comportamiento actual.
- **H2.** `./scripts/new-spec.sh` crea una spec en este repositorio.
- **H3.** `STATUS.md` se regenera desde este repositorio, sin espejos.
- **H4.** Crear un workspace o instalar el sidecar en la raíz del template sigue
  rechazándose, con prueba.

## Riesgos

- **Riesgo principal: relajar de más.** Si la guarda se quita de
  `resolveSddRoot` y no se pone en los tres sitios que la necesitan, se pierde
  una protección real —que alguien scaffoldee un proyecto encima del template—.
  Mitigación: los tres rechazos son criterios de aceptación con prueba propia, y
  la fase 1 los fija antes de tocar nada.
- **Superficie amplia por un cambio pequeño.** 25 llamadas cambian de
  comportamiento a la vez. Mitigación: todas lo hacen en la misma dirección
  —dejan de rechazar un caso— y ningún proyecto fuera del template ve
  diferencia; la suite existente es la prueba de eso.
- **El script de shell puede quedarse atrás**, como ya pasó con otras reglas
  duplicadas en este repositorio. Mitigación: es la fase 3 y tiene su hito.
