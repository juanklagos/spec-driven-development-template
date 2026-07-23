# Tareas 022 - Una lista de tareas larga no puede secuestrar el panel de la spec

- [x] Añadir `sheet.tasks.count` en el bloque ES de `builder/src/i18n.ts` con `{done}` y `{total}`
- [x] Añadir la misma clave en el bloque EN de `builder/src/i18n.ts`
- [x] Añadir la clave de `localStorage` para el plegado de tareas, junto a las preferencias existentes del builder
- [x] Leer la preferencia con desplegado por defecto y escribirla al cambiar
- [x] Envolver la lista de tareas de `SpecDrawer.tsx` en `Accordion` controlado por esa preferencia
- [x] Mostrar el recuento hecho/total en el disparador, visible también con la sección plegada
- [x] Conservar el `HelpHint` de tareas en el disparador sin que su clic pliegue la sección
- [x] Dejar el estado vacío «Sin tareas» fuera del plegable
- [x] Verificar que marcar una tarea sigue escribiendo en `tasks.md` y que el recuento se actualiza
- [x] Verificar en el lienzo con una spec de veinte tareas: plegar y alcanzar issues y extracto sin scroll
- [x] Verificar que la preferencia sobrevive a cambiar de spec y a recargar el navegador
- [x] Comprobar que el plegable no rompe el scroll del panel (`nowheel` + `ScrollArea`)
- [x] Pasar `npm run build` del builder
- [x] Registrar la entrada en `bitacora/` y cerrar con el contrato de sesión
- [ ] Pendiente de verificar en el lienzo: el estado vacío «Sin tareas» (ninguna spec de `larepolla` tiene cero tareas)
