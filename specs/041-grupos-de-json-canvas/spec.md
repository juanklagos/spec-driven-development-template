# Especificación 041 - El lienzo entiende los grupos de JSON Canvas

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-25`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación / Approval evidence: Aprobada en sesión del 2026-08-25 contra este `spec.md` de esa misma fecha: soporte completo del nodo grupo de JSON Canvas con contención real, pertenencia derivada de la geometría y nunca persistida, y autoría de grupos desde el lienzo — las cinco fases del plan. El alcance máximo se pidió de forma explícita al elegir entre preservar, contener y parchear. Quedan fuera: validar el cuerpo de `PUT /api/board` (decisión 8), reconvertir boards ya dañados, y unificar las tres declaraciones del tipo de nodo.

## Objetivo

Que un nodo `type:"group"` de JSON Canvas sobreviva al builder y se comporte
como un grupo: con su título a la vista, con su fondo, y arrastrando consigo lo
que contiene. Hoy no sobrevive — se lee como nota vacía y **se guarda de vuelta
como `type:"text"`**, borrando el tipo, el `label` y el `background` del archivo
del usuario.

## Historia de usuario principal

Como persona que organiza su board en capas —un grupo por capa, las specs
dentro— quiero abrir el builder, mover una capa entera y guardar, sin que el
archivo pierda las capas ni sus nombres, para poder seguir usando el mismo
`board.canvas` en el builder y en Obsidian.

## Contexto (medido, no supuesto)

Medido el 2026-08-25 sobre `main` en `4d60beb`. Detalle en `research.md`.

- **Se pierden dos cosas, y la segunda se escribe en disco.** Ejecutado el ida
  y vuelta real del builder sobre un grupo legítimo:

  ```
  ENTRADA     : {"type":"group","label":"Capa 0 · Fundación","background":"#eef", …}
  EN EL LIENZO: {"type":"note","data":{"text":"", …}}
  AL GUARDAR  : {"type":"text","text":"", …}
  ```

  Al leer se descarta el `label` (`builder/src/convert.ts:163-168`, que arma la
  nota con `text: n.text ?? ""`). Al guardar se reescribe el nodo como texto
  (`builder/src/convert.ts:202`). El builder guarda el layout ante cualquier
  cambio, así que **mover una tarjeta basta** para consumar la pérdida.

- **Por eso la tarjeta dice «IDEA» y sale vacía.** `NoteNode` deduce el tipo del
  color; un grupo no trae color, cae en idea, y el cuerpo es la cadena vacía.

- **El modelo no conoce el grupo, y lo declara tres veces:**
  `packages/sdd-core/src/board.ts:45`, `builder/src/types.ts:9` y
  `packages/sdd-mcp/src/schemas.ts:44`. Olvidar una da un fallo distinto en cada
  borde.

- **El núcleo sí deja pasar el grupo.** `readBoardAt` solo comprueba que
  `nodes` y `edges` sean arrays. El archivo sobrevive hasta que el builder
  guarda: por eso el defecto es silencioso.

- **JSON Canvas no tiene campo de pertenencia.** Leída la especificación 1.0 el
  2026-08-25: el grupo admite `label`, `color`, `background` y `backgroundStyle`,
  y **no existe ningún campo de padre o de hijos**. Estar dentro de un grupo es
  una propiedad geométrica, no un dato guardado.

- **El agente no puede escribir grupos y el navegador puede escribir cualquier
  cosa.** `sdd_board_write` valida con un enum que rechaza `"group"`; el
  `PUT /api/board` hace `as never` sin validar nada.

## Decisiones que esta spec fija

1. **Se soporta el nodo grupo completo**, no un subconjunto: `label`, `color`,
   `background` y `backgroundStyle`. Lo que entra vuelve a salir igual, incluido
   lo que el builder no sepa pintar todavía.

2. **La pertenencia se deriva de la geometría en cada carga y no se persiste
   jamás.** React Flow la expresa con `parentId` y coordenadas relativas; JSON
   Canvas no tiene `parentId` y guarda absolutas. Escribir un `parentId` en el
   archivo lo sacaría de la especificación y Obsidian dejaría de entenderlo. La
   traducción vive en la conversión, en los dos sentidos.

3. **Contención real.** Un nodo cuyo rectángulo cae dentro del de un grupo es
   hijo suyo: se mueve con él y no se sale arrastrando (`extent: "parent"`).

4. **Con grupos solapados, el padre es el contenedor de menor área.** Regla
   determinista, sin ambigüedad y sin preguntar al usuario.

5. **Borrar un grupo nunca borra lo que contiene**, solo lo libera. Las tarjetas
   de spec ya son `deletable: false`; una cascada contradiría esa regla.

6. **El grupo es fondo.** Se pinta detrás de las tarjetas y no roba el clic de
   lo que está encima.

7. **Se puede crear, renombrar, recolorear y redimensionar un grupo desde el
   lienzo.** Un formato que solo se lee es la mitad del soporte: quien organiza
   por capas quiere crear la capa siguiente sin salir del builder.

8. **El hueco de validación del REST no se arregla aquí.** El `as never` de
   `PUT /api/board` es un defecto real y separable; esta spec solo añade
   `"group"` donde ya se valida. Va en su propia spec.

## Escenarios de aceptación

1. Dado un `board.canvas` con un grupo con `label` y `background`, cuando se
   abre el builder y se guarda sin tocar nada, entonces el archivo resultante es
   equivalente al original: el nodo sigue siendo `type:"group"` y conserva
   `label`, `color`, `background` y `backgroundStyle`.

2. Dado un grupo con tres tarjetas dentro, cuando se arrastra el grupo,
   entonces las tres se mueven con él y al guardar sus coordenadas absolutas
   reflejan el desplazamiento.

3. Dado un grupo, cuando se arrastra una tarjeta de fuera hacia dentro y se
   guarda y recarga, entonces esa tarjeta se mueve con el grupo.

4. Dado un nodo contenido por dos grupos solapados, cuando se carga el board,
   entonces su padre es el grupo de menor área.

5. Dado un grupo con tarjetas dentro, cuando se borra el grupo, entonces las
   tarjetas siguen en el lienzo y en el archivo, en su misma posición absoluta.

6. Dado un lienzo cualquiera, cuando se crea un grupo desde la paleta y se le
   escribe un nombre, entonces el archivo guarda un `type:"group"` con ese
   `label`.

7. Dado un canvas con grupos, cuando un agente lo escribe por
   `sdd_board_write`, entonces la validación lo acepta.

## Criterios de aceptación (formato EARS recomendado)

- CUANDO el builder cargue un nodo `type:"group"`, EL SISTEMA DEBERÁ pintarlo
  como marco titulado con su `label`, detrás de las demás tarjetas.
- CUANDO el builder guarde el board, EL SISTEMA DEBERÁ escribir cada grupo como
  `type:"group"` conservando `label`, `color`, `background` y `backgroundStyle`.
- CUANDO el builder guarde el board, EL SISTEMA DEBERÁ escribir coordenadas
  absolutas para todos los nodos, y NO DEBERÁ escribir ningún campo de
  pertenencia que la especificación de JSON Canvas no defina.
- CUANDO se cargue el board, EL SISTEMA DEBERÁ derivar la pertenencia de la
  geometría, asignando a cada nodo el grupo contenedor de menor área.
- CUANDO se arrastre un grupo, EL SISTEMA DEBERÁ desplazar con él a todos sus
  hijos.
- SI se borra un grupo, ENTONCES EL SISTEMA DEBERÁ conservar sus hijos en su
  posición absoluta.
- SI un nodo grupo trae campos que el builder no pinta, ENTONCES EL SISTEMA
  DEBERÁ conservarlos al guardar.

## Requisitos

- Sin dependencias nuevas: React Flow 12.8.2 ya soporta `parentId` y
  `extent: "parent"`.
- El padre debe emitirse antes que sus hijos en el array de nodos, exigencia del
  runtime de React Flow.
- El soporte debe ser idéntico por los tres bordes: builder, REST y MCP.
- Ningún archivo `board.canvas` existente puede cambiar de significado al
  abrirlo y guardarlo sin editar.

## Ámbito de archivos / File scope

- `packages/sdd-core/src/board.ts` — el tipo de nodo
- `packages/sdd-mcp/src/schemas.ts` — el enum del borde MCP
- `builder/src/types.ts` — el tipo del cliente
- `builder/src/convert.ts` — derivación de pertenencia y traducción de
  coordenadas en los dos sentidos
- `builder/src/components/GroupNode.tsx` — nuevo
- `builder/src/App.tsx` — registro del tipo de nodo
- `builder/src/store.ts` — crear, renombrar y borrar grupos
- `builder/src/i18n.ts` — cadenas
- `builder/src/convert.test.ts` — ida y vuelta sin pérdida

## Criterios de éxito

- Abrir y guardar un board con grupos no cambia el archivo más allá de las
  coordenadas que el usuario haya movido a propósito.
- El board de El-MERDN puede volver a expresarse con grupos reales en vez de
  con notas de texto que imitan capas.
- El mismo archivo se abre en Obsidian y en el builder sin que ninguno pierda lo
  que el otro escribió.
