# Especificación 022 - Una lista de tareas larga no puede secuestrar el panel de la spec

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-22`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Aprobación en sesión, 2026-07-22: «listo, hazlo», sobre el resumen de la spec 022 con las dos decisiones explicitadas (preferencia global de plegado y desplegado por defecto).

## Contexto

El autor abrió la spec `001-login` de `~/www/larepolla` en el lienzo y reportó: *«cuando
hay muchas tareas no deja ver el resto»*. La captura lo muestra: el panel derecho, de
540 px, se llena de casillas de tarea desde la cabecera hasta el borde inferior de la
pantalla y sigue.

La causa está en la pestaña Resumen. `SpecDrawer.tsx:586` pinta **todas** las tareas del
`tasks.md`, una detrás de otra, sin techo. Lo que va **debajo** de esa lista —el panel de
issues de GitHub (`:612`), el separador y el extracto de `spec.md` (`:617`-`:624`)— solo
es alcanzable scrolleando la lista entera. Con las 20 tareas de `001-login`, muchas de
ellas de dos renglones, eso son varias pantallas de scroll para llegar a secciones que no
tienen nada que ver con las tareas.

No es un fallo de scroll: el `ScrollArea` de `:568` funciona. Es un fallo de jerarquía.
La lista de tareas es la sección más larga y variable del panel y hoy es la única que no
se puede plegar, mientras que la pestaña «Editar spec», que es la vecina, sí pliega cada
una de sus siete secciones con `Accordion` (`SectionEditor.tsx:280`). El componente ya
está en el repositorio y ya se usa; el panel de resumen simplemente no lo aprovecha.

Hay un segundo detalle que la captura delata: la cabecera dice solo «TAREAS». El nodo del
lienzo, para esa misma spec, sí dice «0/3 tareas». Si la sección se puede plegar, la
cabecera pasa a ser lo único visible de ella, y tiene que llevar el recuento; si no, se
plegaría información sin dejar rastro de cuánta hay.

## Historia de usuario principal

Como alguien que revisa una spec con muchas tareas en el lienzo, quiero plegar la lista de
tareas, para llegar al resto del panel sin recorrerla entera y para ver de un vistazo
cuántas quedan pendientes.

## Escenarios de aceptación

1. Alguien abre una spec con veinte tareas, pliega la sección de tareas y ve el panel de
   issues y el extracto de `spec.md` sin scrollear.
2. Con la sección plegada, la cabecera sigue diciendo cuántas tareas hay hechas y cuántas
   en total, sin necesidad de desplegarla.
3. Alguien pliega la sección, cierra el panel, abre otra spec y la sección sigue plegada:
   la elección no se pierde a cada clic.
4. Alguien pliega la sección, recarga el lienzo en el navegador y su elección se conserva.
5. Alguien abre el lienzo por primera vez y encuentra la sección desplegada: quien nunca
   la tocó ve exactamente lo que ve hoy.
6. Alguien despliega la sección y marca una tarea; la casilla se guarda igual que hoy y el
   recuento de la cabecera se actualiza.
7. Alguien abre una spec sin tareas y sigue viendo el estado vacío educativo actual, no
   una sección plegable vacía.

## Criterios de aceptación (formato EARS recomendado) / Acceptance criteria (EARS format recommended)

- CUANDO la spec abierta tenga al menos una tarea, EL SISTEMA DEBERÁ presentar la lista de
  tareas dentro de una sección plegable con un control de plegado accesible por teclado.
- CUANDO alguien pliegue o despliegue la sección de tareas, EL SISTEMA DEBERÁ conservar esa
  elección para las siguientes specs que abra y entre recargas del navegador.
- MIENTRAS nadie haya plegado nunca la sección, EL SISTEMA DEBERÁ mostrarla desplegada.
- MIENTRAS la sección esté plegada, EL SISTEMA DEBERÁ mostrar en su cabecera el número de
  tareas hechas y el total.
- CUANDO se marque o desmarque una tarea, EL SISTEMA DEBERÁ actualizar ese recuento sin
  recargar el panel.
- SI la spec abierta no tiene ninguna tarea, ENTONCES EL SISTEMA DEBERÁ mostrar el estado
  vacío actual sin control de plegado.
- MIENTRAS la sección esté desplegada, EL SISTEMA DEBERÁ conservar el comportamiento actual
  de la lista: marcar y desmarcar, bloqueo mientras hay un guardado en vuelo y tachado de
  las hechas.
- EL SISTEMA NUNCA DEBERÁ ocultar el botón «Implementar con agente», el panel de issues ni
  el extracto de `spec.md` como efecto de plegar o desplegar las tareas.

## Propiedades de la spec (opcional, puente a specs ejecutables) / Spec properties (optional)

- Para cualquier número de tareas de una spec, la altura de la sección plegada es constante
  y no depende de ese número.
- Para cualquier estado de las tareas, hechas + pendientes = total mostrado en la cabecera.

## Ámbito de archivos / File scope

- `builder/src/components/SpecDrawer.tsx` — pestaña Resumen y lista de tareas
- `builder/src/i18n.ts` — textos ES/EN de la cabecera con recuento
- `builder/src/store.ts` — preferencia persistida, si se aloja aquí

## Criterios de éxito

- Con una spec de veinte tareas, el panel de issues y el extracto de `spec.md` quedan
  alcanzables sin recorrer la lista. Verificado abriendo el lienzo, no leyendo el diff.
- La preferencia de plegado sobrevive a cambiar de spec y a recargar la página.
- Quien abre el lienzo por primera vez no percibe ningún cambio respecto de hoy.
- Sin regresión en el marcado de tareas: `npm run build` del builder y la comprobación de
  tipos pasan, y marcar una tarea sigue escribiendo en `tasks.md`.
