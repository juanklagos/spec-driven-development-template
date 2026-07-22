# Especificación 014 - Los tres defectos de los primeros cinco minutos del builder

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-21`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-21 — el autor respondió *«hagalo»* y después *«dele con todo»* al catálogo de ideas que enumeraba estos tres defectos como «los tres defectos de los primeros cinco minutos». Consentimiento en `.sdd/user-consent.log`.

## Contexto

Tres defectos que un usuario nuevo encuentra en su primera sesión. Los tres verificados leyendo el
código antes de tocarlo.

**1. Borrar una tarjeta la hace desaparecer y reaparecer en otro sitio.**
`App.tsx` declara `deleteKeyCode={["Backspace", "Delete"]}`, así que React Flow elimina el nodo. Pero
`store.ts` vuelve a pedir el board en cada evento en vivo y **re-añade toda spec que no esté entre los
nodos**, colocándola al fondo con una posición de rejilla nueva. La tarjeta se va y vuelve movida.
Para el usuario eso no se lee como «no se puede borrar»: se lee como que la herramienta se corrompe
sola.

**2. El editor de secciones se come texto sin guardar.**
Su `useEffect` sobre `[specId]` re-inicializa los siete campos cuando seleccionas otra spec. No hay
comprobación de cambios pendientes, ni aviso, ni deshacer. Escribes media frase, haces clic en otra
tarjeta, y la frase ya no existe.

**3. Arrastrar en el kanban no hace nada.**
`onDragEnd` lleva un comentario que lo dice: *«v1: state lives in the .md files only — moving a card
changes nothing»*. Muestra un aviso y la tarjeta vuelve a su sitio. Una tarjeta arrastrable que no se
puede soltar en ninguna parte es un gesto roto, y el aviso no lo arregla: lo documenta.

## Historia de usuario principal

Como alguien que abre el builder por primera vez, quiero que lo que puedo hacer con el ratón haga algo
predecible, para no concluir en los primeros cinco minutos que la herramienta está rota.

## Escenarios de aceptación

1. Dado un board con tarjetas de spec, cuando pulso Suprimir sobre una, entonces no se borra y el
   sistema me explica por qué en mi idioma.
2. Dada una nota en el lienzo, cuando pulso Suprimir sobre ella, entonces sí se borra: existe solo en
   el lienzo.
3. Dado que escribo en el editor de secciones y selecciono otra spec sin guardar, cuando vuelvo a la
   primera, entonces mi texto sigue ahí.
4. Dado que guardo una spec con éxito, cuando vuelvo a ella, entonces veo lo guardado y no un borrador
   viejo.
5. Dada una tarjeta en «borrador», cuando la arrastro a «aprobada», entonces se abre el formulario de
   aprobación de esa spec.
6. Dada cualquier tarjeta, cuando intento soltarla en «hecha», entonces esa columna no la acepta.

## Criterios de aceptación (formato EARS) / Acceptance criteria (EARS format)

- EL SISTEMA NO DEBERÁ permitir borrar una tarjeta de spec desde el lienzo.
- CUANDO el usuario intente borrar una tarjeta de spec, EL SISTEMA DEBERÁ explicar por qué, en el
  idioma activo, y no dejar el gesto sin respuesta.
- EL SISTEMA DEBERÁ seguir permitiendo borrar notas: existen solo en el lienzo.
- CUANDO se seleccione otra spec con ediciones sin guardar, EL SISTEMA DEBERÁ conservar esas ediciones
  y restaurarlas al volver a esa spec.
- CUANDO un guardado termine con éxito, EL SISTEMA DEBERÁ descartar el borrador de esa spec.
- CUANDO se suelte una tarjeta de «borrador» sobre «aprobada», EL SISTEMA DEBERÁ abrir el formulario
  de aprobación de esa spec.
- EL SISTEMA NO DEBERÁ aprobar una spec como efecto de un arrastre.
- EL SISTEMA NO DEBERÁ ofrecer «hecha» como destino de arrastre: se deriva de las tareas completadas.

## Requisitos

- Los borradores son estado transitorio de interfaz: no se persisten, no entran en el historial de
  deshacer y no viajan por la red.
- Todo texto nuevo existe en español e inglés, en los dos diccionarios que se reflejan.
- Aprobar sigue exigiendo aprobador y evidencia. El arrastre lleva al formulario; no lo rellena.

## Fuera de alcance / Out of scope

- Aprobar desde el lienzo con un clic (idea aparte del catálogo).
- Persistir el borrado de tarjetas en `board.canvas`. Una spec es una carpeta en disco; quitarla del
  lienzo sería una vista parcial que hoy nadie ha pedido.
- Cualquier cambio en cómo se calcula la columna «hecha».

## Ámbito de archivos / File scope

- `builder/src/App.tsx` — `onBeforeDelete` que explica
- `builder/src/convert.ts` — `deletable: false` en las tarjetas de spec
- `builder/src/store.ts` — `deletable: false`, `requestedDrawerTab`
- `builder/src/types.ts` — `DrawerTab`
- `builder/src/components/SectionEditor.tsx` — borradores por spec
- `builder/src/components/SpecDrawer.tsx` — consumir la pestaña pedida
- `builder/src/components/KanbanBoard.tsx` — destinos legales y apertura de aprobación
- `builder/src/i18n.ts` — textos ES/EN

## Propiedades de la spec / Spec properties

- Para toda tarjeta de spec, borrarla desde el lienzo DEBERÁ ser imposible.
- Para todo par de specs, alternar entre ellas DEBERÁ conservar el texto sin guardar de ambas.
- Para todo arrastre, el estado de aprobación en disco DEBERÁ quedar sin cambios.

## Criterios de éxito

- Ninguno de los tres gestos deja al usuario con la impresión de que la herramienta se rompió.
- El kanban deja de tener un gesto que no lleva a ninguna parte.
