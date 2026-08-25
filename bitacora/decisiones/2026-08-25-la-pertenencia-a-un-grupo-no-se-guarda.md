# Decisión importante - La pertenencia a un grupo se deriva de la geometría y no se guarda

## Date / Fecha

2026-08-25 — decidida en la sesión de la spec 041, antes de implementar
(`specs/041-grupos-de-json-canvas/`).

## Context / Contexto

El builder no soportaba el nodo `type:"group"` de JSON Canvas. Lo cargaba como
nota —cuyo texto lee de `text`, y un grupo guarda su título en `label`—, así que
pintaba una tarjeta vacía, y al guardar lo reescribía como `type:"text"`
borrando el tipo, la etiqueta y el fondo del archivo del usuario. Como el
builder guarda el layout ante cualquier cambio, bastaba mover una tarjeta.

Al implementar el soporte aparece un choque de modelos que no se puede esquivar:

| | Pertenencia | Coordenadas del hijo |
|---|---|---|
| JSON Canvas 1.0 | **no existe** ningún campo de padre o hijos | absolutas |
| React Flow 12 | `parentId` explícito | relativas al padre |

Leída la especificación 1.0 el 2026-08-25: el nodo grupo admite `id`, `type`,
`x`, `y`, `width`, `height`, y opcionalmente `color`, `label`, `background` y
`backgroundStyle`. Nada más. Estar dentro de un grupo es una propiedad de las
coordenadas, no un dato.

## Decision / Decisión

**La pertenencia se deriva de la geometría en cada carga y se disuelve en cada
guardado.** El archivo nunca contiene un `parentId`, y todas las coordenadas
que se escriben son absolutas. El padre de un nodo es el grupo de menor área
que lo contiene por completo.

## Alternatives considered / Alternativas consideradas

1. **Guardar `parentId` en el archivo.** Descartada. Sacaría el archivo de la
   especificación y Obsidian —de donde vienen estos boards— dejaría de
   entenderlo. El valor del formato es precisamente que lo comparten dos
   herramientas.
2. **Un archivo lateral con la pertenencia** (como `board.canvas` acompaña a
   los `.md`). Descartada: sería una segunda fuente de verdad que se
   desincroniza en cuanto alguien mueve una tarjeta en Obsidian, y la
   geometría ya contiene la respuesta.
3. **No implementar contención**, solo conservar el grupo y pintarlo.
   Descartada por lo que se pidió: un marco que no arrastra lo que contiene no
   es un grupo, es un rectángulo decorativo.
4. **La adoptada**: derivar al cargar, y volver a derivar cada vez que la
   geometría se asienta (fin de arrastre, borrado, redimensión).

## Consequences / Consecuencias

- El mismo `board.canvas` se abre en el builder y en Obsidian sin que ninguno
  pierda lo que escribió el otro.
- La conversión de coordenadas vive en un solo sitio, `builder/src/convert.ts`,
  en las dos direcciones. Un error ahí mueve tarjetas solas, que es el fallo
  más caro posible: por eso la prueba de ida y vuelta es la primera que se
  escribió.
- No hay nada que confirmar en la interfaz: arrastrar una tarjeta dentro de un
  marco la mete, sacarla la saca. La regla es visible porque es la que el ojo
  ya aplica.
- Un efecto colateral aceptado: dos marcos del mismo tamaño superpuestos no
  pueden anidarse entre sí. La regla exige área estrictamente menor para que la
  relación no sea ambigua.
- `extent: "parent"` de React Flow quedó descartado durante la implementación:
  impide sacar una tarjeta arrastrando, y con la pertenencia derivada eso
  significaría atraparla dentro del marco para siempre.

## When to revisit / Cuándo revisar esta decisión

- Si JSON Canvas añadiera algún día un campo de pertenencia, esta decisión se
  vuelve innecesaria y hay que revertirla al modelo explícito.
- Si el builder dejara de compartir archivo con otras herramientas de canvas,
  el motivo principal desaparece.
- Si aparecen boards con cientos de nodos y la derivación por área —hoy
  cuadrática sobre el número de grupos— se notara al cargar.
