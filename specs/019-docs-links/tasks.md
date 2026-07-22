# Tareas 019 - Los enlaces entre guías

## H1 — Los enlaces entre guías llegan a la guía

- [x] **T1a** Mecanismo de apartar y devolver en `sync-docs.mjs`.
- [x] **T1b** Las dos reglas de guías —mismo idioma y cruzada— apartan su resultado.
- [x] **T1c** Comprobación de que no sobrevive ningún marcador en la salida.
- [x] **T1d** Cero enlaces a `blob/main/docs/NN-…` en el contenido sincronizado.

## H2 — La verificación pierde el punto ciego

- [x] **T2a** Todos los enlaces a GitHub resuelven a un archivo real del repositorio.
- [x] **T2b** Los 70 enlaces a GitHub que hoy son correctos siguen siendo correctos.
- [x] **T2c** Barrido del sitio construido que resuelve **todos** los enlaces, relativos incluidos.
- [x] **T2d** `npm run build` en `site/` sin errores.
- [x] **T2e** *(no previsto en el plan)* El barrido nuevo destapó dos enlaces rotos de otra causa:
      `<a href>` de HTML crudo dentro del markdown, que ninguna regla miraba porque todas exigen
      sintaxis markdown. Reescritura de `href`/`src` relativos en etiquetas `<a>` e `<img>`.

## Verificación de cierre

- [x] Los cuatro scripts SDD en 0 errores.
- [x] Bitácora diaria y entrada de historial de la spec.
- [x] `specs/INDEX.md` actualizado.
