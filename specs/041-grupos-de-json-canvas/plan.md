# Plan 041 - El lienzo entiende los grupos de JSON Canvas

## Resumen

Cinco fases, ordenadas para que la hemorragia pare primero. La fase 1 hace que
un grupo sobreviva al ida y vuelta aunque el lienzo todavía no sepa pintarlo:
desde ese momento, abrir el builder deja de destruir archivos. Lo demás —
pintado, contención, autoría— se construye encima sin volver a arriesgar datos.

## Contexto técnico

El problema real no es añadir un tipo, es que **dos modelos expresan la
pertenencia de forma incompatible**:

| | Pertenencia | Coordenadas del hijo |
|---|---|---|
| JSON Canvas | ninguna; es geométrica | absolutas |
| React Flow | `parentId` explícito | relativas al padre |

De ahí la regla de la decisión 2: la pertenencia se **deriva** al cargar y se
**disuelve** al guardar. Nunca se escribe. Las dos funciones que ya existen son
el sitio exacto donde vive esa traducción:

- `boardToFlow` (`builder/src/convert.ts:114`): además de mapear nodos, calcula
  qué grupo contiene a cada nodo, ordena los grupos antes que sus hijos y
  convierte las posiciones de los hijos a relativas.
- `flowToBoard` (`builder/src/convert.ts:184`): vuelve a absolutas sumando la
  posición del padre, y emite el grupo con sus campos propios.

Contención en React Flow 12.8.2: `parentId` + `extent: "parent"`. Dos exigencias
del runtime que la implementación tiene que respetar — el padre va antes que sus
hijos en el array, y la `position` del hijo es relativa.

Conservación de campos desconocidos: el grupo se emite con lo que trajo. Es lo
que permite prometer el criterio EARS de «campos que el builder no pinta».

## Fases de implementación

1. **El grupo sobrevive.** Añadir `"group"` a las tres declaraciones
   (`board.ts`, `types.ts`, `schemas.ts`), y hacer que `boardToFlow` y
   `flowToBoard` conserven el nodo con todos sus campos. Sin pintado nuevo y sin
   contención: solo dejar de destruir. Prueba de ida y vuelta byte a byte.

2. **El grupo se ve.** `GroupNode.tsx`: marco con el `label` en la cabecera,
   `color` y `background` si vienen, pintado detrás y sin robar el clic.
   Registrarlo en `nodeTypes`.

3. **El grupo contiene.** Derivación de pertenencia por geometría con la regla
   del contenedor de menor área, orden padre-antes-que-hijos, traducción de
   coordenadas en los dos sentidos, `extent: "parent"`, y arrastrar dentro y
   fuera. Es la fase con más riesgo: toda ella se apoya en pruebas de
   `convert.ts` porque es lógica pura.

4. **El grupo se autora.** Crear desde la paleta, renombrar el `label`,
   recolorear, redimensionar y borrar liberando a los hijos. Historial
   (`pushHistory`) como cualquier otra mutación del store.

5. **Cierre.** Cadenas ES/EN, guía del builder, `CHANGELOG.md`, `history.md` de
   la spec y el registro de decisión de la pertenencia derivada.

## Dependencias

- Ninguna nueva. React Flow 12.8.2 ya trae lo necesario.
- La fase 3 depende de la 1; la 4, de la 2 y la 3. La 2 puede ir en paralelo a
  la 3 si hiciera falta.

## Hitos

- H1: abrir y guardar un board con grupos no cambia el archivo.
- H2: el grupo se ve con su título y su fondo.
- H3: arrastrar un grupo mueve lo que contiene, y el archivo guarda absolutas.
- H4: se puede crear y nombrar una capa nueva sin salir del builder.

## Riesgos

- **La derivación geométrica puede sorprender.** Un nodo que asoma medio fuera
  del grupo: la regla tiene que ser una y estar escrita. Se propone contención
  del rectángulo completo, no del centro, porque es la que coincide con lo que
  el usuario ve.

- **Coordenadas relativas mal convertidas mueven cosas solas.** Es el fallo más
  caro posible aquí: el usuario abre, no toca nada, guarda, y su board aparece
  descolocado. Mitigado por la prueba de ida y vuelta de la fase 1, que se
  ejecuta también con contención activa en la fase 3.

- **Grupos anidados.** Un grupo dentro de otro es legítimo en JSON Canvas. La
  regla del menor área lo resuelve, pero React Flow anida padres reales y hay
  que comprobarlo, no suponerlo.

- **Boards existentes ya dañados.** Los que ya perdieron sus grupos —El-MERDN
  entre ellos— no se reparan solos: quedaron como notas de texto y esta spec no
  las reconvierte. Repararlos es trabajo manual del dueño del board.
