# Investigación 014 - Los tres defectos de los primeros cinco minutos

Los tres salieron del catálogo de ideas del 2026-07-21 (workflow de 18 agentes) y los verifiqué
leyendo el código antes de escribir la spec.

## Hallazgos

### 1. Dos caminos independientes reponen la tarjeta borrada

`App.tsx` permite `Backspace`/`Delete`. `store.ts`, en cada evento en vivo, compara las specs del
board con los nodos presentes y re-añade las que faltan en `maxBottom + 60` con posición de rejilla
nueva. `convert.ts` hace lo mismo al cargar. Es decir: la tarjeta no solo vuelve, vuelve **en otro
sitio**, y el usuario no tiene forma de distinguir eso de una corrupción.

### 2. El re-inicializado del editor no comprueba nada

El `useEffect` sobre `[specId]` llama a los siete `setX(parsed.X)` sin mirar si hay cambios
pendientes. No existe bandera de sucio, ni aviso, ni deshacer en ese componente.

### 3. El arrastre del kanban está documentado como inútil

`onDragEnd` calcula origen y destino, comprueba que sean distintos… y muestra un toast. El comentario
lo admite: *«v1: state lives in the .md files only — moving a card changes nothing»*. `approveSpec`
existe en `builder/src/api.ts`, así que el arrastre **podría** aprobar.

## Decisiones derivadas de los hallazgos

1. **La tarjeta de spec no se borra desde el lienzo.** Representa una carpeta en disco; el lienzo es
   una vista. La alternativa —persistir el borrado en `board.canvas`— produciría una vista parcial
   que nadie ha pedido y abriría la pregunta «¿dónde está mi spec?».
2. **Borradores en vez de diálogo de confirmación.** Un `confirm()` interrumpe y sigue perdiendo el
   texto si aciertas a darle a Aceptar. Conservar el borrador hace la pérdida imposible y no
   interrumpe. Coste parecido.
3. **El arrastre abre la aprobación, no la ejecuta.** Aprobar exige aprobador y evidencia, y este
   proyecto sostiene que la aprobación es un acto deliberado. Un gesto de ratón que aprueba
   contradiría su propia tesis — y sería exactamente el tipo de atajo que la compuerta existe para
   impedir.
4. **«Hecha» no es destino.** Se deriva de las tareas completadas, así que ofrecerla como columna de
   destino sería prometer algo que el modelo de datos no puede cumplir.
