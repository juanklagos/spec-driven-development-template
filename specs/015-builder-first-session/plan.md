# Plan 015 - La primera sesión del builder

## Resumen

Tres cambios independientes. El primero es de datos y atraviesa el stack; los otros dos son de
interfaz sobre piezas que ya existen.

## Contexto técnico

**Título.** `listSpecs` ya lee cada `spec.md` entero para extraer el estado, así que el título sale
sin I/O adicional. El formato de la plantilla es `# Especificación NNN - Título` / `# Specification
NNN - Title`, pero hay specs históricas con otras formas, así que el extractor degrada: encabezado
con guion → encabezado completo → etiqueta derivada del id. Nunca vacío.

Añadir un campo a `SpecSummary` dispara la aserción de forma que se escribió en la 012: el board hace
spread de `SpecSummary` y su esquema rechaza propiedades no declaradas. Es la tercera vez; ahora la
prueba lo dirá antes de que falle en runtime.

**Consentimiento.** `recordUserConsent(root, summary, specId)` existe en el core. Falta la ruta HTTP
y el cliente. Va detrás de una acción explícita: el usuario escribe o confirma, nunca automático.

**Paleta.** ~~shadcn ya trae `command`~~ — **falso, verificado después**: no existe ese componente ni
`cmdk` entre las dependencias. Se construye sobre el `Dialog` que sí está, sin dependencia nueva. El
atajo global es un `keydown` en `App.tsx` junto a los siete manejadores que ya existen.

## Fases de implementación

1. `extractSpecTitle` + `SpecSummary.title` + esquemas MCP + tipo del builder.
2. Título en la tarjeta del lienzo y en la del kanban, con el id al lado.
3. `POST /api/spec/:id/consent` + cliente + acción en el drawer tras aprobar, con refresco de compuerta.
4. Paleta de comandos con atajo global y navegación por teclado.

## Dependencias

- Ninguna nueva. `command` de shadcn ya está en el proyecto o se añade desde el registro local.

## Hitos

- **H1** — las tarjetas se leen (fases 1-2).
- **H2** — una aprobación se completa sin terminal (fase 3).
- **H3** — llegar a una spec cuesta tres teclas (fase 4).

## Riesgos

- **Un campo nuevo en `SpecSummary` rompe el board por esquema.** Ya pasó con `tone` y con
  `fileScope`. Mitigación: la aserción de forma de la 012 corre antes que nada.
- **El título puede ser largo.** Mitigación: truncado en la tarjeta con el completo en el atributo
  title; el drawer lo muestra entero.
- **Un atajo global choca con el del navegador.** Cmd+K está libre en Chrome/Safari/Firefox sobre una
  página; se comprueba y se cancela el evento.
