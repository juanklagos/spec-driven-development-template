# Plan 022 - Una lista de tareas larga no puede secuestrar el panel de la spec

## Resumen

Envolver la lista de tareas de la pestaña Resumen en una sección plegable, con el recuento
hecho/total en la cabecera y la elección de plegado persistida en `localStorage`. No se
toca la carga de datos, ni el marcado de tareas, ni el resto de pestañas.

## Contexto técnico

- El panel es `builder/src/components/SpecDrawer.tsx`. La pestaña Resumen vive entre las
  líneas 567 y 627: botón de implementar, cabecera «Tareas» (`:582`), lista (`:586`),
  `IssuesPanel` (`:612`), separador y extracto (`:617`).
- `Accordion` de Radix ya está en `builder/src/components/ui/accordion.tsx` y ya se usa en
  producción en `SectionEditor.tsx:280` con `type="multiple"` y `defaultValue`. Se reutiliza
  ese componente: no se escribe un plegable nuevo.
- La persistencia en `localStorage` ya es un patrón del builder: `i18n.ts:17` para el idioma
  y `store.ts:439` para el tour descartado (`TOUR_DISMISSED_KEY`). Se sigue esa forma.
- El recuento pendiente ya se calcula en el propio archivo para `IssuesPanel`
  (`SpecDrawer.tsx:615`): se deriva de `detail.tasks`, que se refresca tras cada marcado
  (`:490`). No hace falta estado nuevo para que el recuento se actualice solo.
- Los textos son bilingües ES/EN en `builder/src/i18n.ts`, bloques `"sheet.*"` (ES desde
  `:217`, EN desde `:564`).

## Fases de implementación

1. Añadir la clave de textos del recuento (`sheet.tasks.count`) en los dos idiomas de
   `i18n.ts`, con marcadores `{done}` y `{total}` como hacen las claves existentes del
   estilo de `sheet.issues.summary`.
2. Añadir la preferencia persistida de plegado: clave de `localStorage`, lectura perezosa
   con desplegado por defecto y escritura al cambiar. Alojarla junto a las demás
   preferencias del builder.
3. Sustituir en `SpecDrawer.tsx` la cabecera `<h3>` y el `<ul>` por un `Accordion`
   controlado por esa preferencia, dejando el `HelpHint` de tareas en el disparador y el
   recuento visible siempre.
4. Mantener el estado vacío («Sin tareas») fuera del plegable, tal como está hoy.
5. Verificar en el lienzo real con una spec de veinte tareas: plegar, ver issues y extracto
   sin scroll, cambiar de spec, recargar, marcar una tarea y ver el recuento moverse.

## Dependencias

- Ninguna nueva. `radix-ui` y el componente `Accordion` ya son dependencias del builder.

## Hitos

- Textos bilingües y preferencia persistida en su sitio.
- Sección plegable funcionando con el recuento en la cabecera.
- Verificación manual en el lienzo con `001-login` de `~/www/larepolla` y `npm run build`
  del builder en verde.

## Riesgos

- Que el plegado por defecto cambie lo que ve quien abre el lienzo por primera vez. Se
  mitiga con desplegado por defecto: solo cambia para quien lo pliega a propósito.
- Que una preferencia global resulte incómoda si alguien quiere plegado por spec. Se acepta
  a propósito: una sola preferencia es lo predecible y lo que pidió el reporte. Si aparece
  la necesidad de plegado por spec, es otra spec.
- Que el `Accordion` interfiera con el `nowheel` del `ScrollArea` del panel. Se comprueba en
  el paso de verificación, no se asume.
