# Decisión clave - En la documentación el verde es acento primario, ajustando el alcance de la 018 (que lo reservaba para estado) / Key decision - On the docs site, green becomes the primary accent, adjusting spec 018

## Date / Fecha

2026-07-23

## Context / Contexto

La spec 018 (`specs/018-brand-logo/spec.md:18-21`) tomó una decisión de color deliberada: **el verde `#16a34a` se reserva para el estado** («esto pasó»), el logo es **monocromo**, y un logo verde se rechazó explícitamente porque *«pondría marca y estado a competir por el mismo color, y el verde dejaría de querer decir ‹esto pasó›»*.

El 2026-07-23 el propietario compartió `tools.rmv.fyi` (delphitools) — un sitio cuyo acento primario es el verde en todo — y pidió replicar «ese tipo de diseño» para la documentación «pero con nuestros colores». Ante la pregunta directa de cómo resolver el choque con 018, con las dos opciones a la vista (respetar 018 con acento monocromo, o verde primario como el mockup), **eligió verde primario**, y autorizó construir la spec 026.

## Decision / Decisión

**En el sitio de documentación (`site/`), el verde 🌱 es el acento primario** (enlaces, nav activo, foco, tokens de código), al estilo delphitools. Esto **ajusta el alcance de la 018 para el sitio de docs**, no lo revoca:

- **018 RF2 se mantiene:** el logo sigue **monocromo** (casi negro / casi blanco). La marca no se vuelve verde.
- **El significado de estado se preserva por contexto, no solo por color:** los asides de éxito se etiquetan «Aprobado»/«Hecho», los badges de estado llevan texto, y el verde de estado sigue apareciendo donde 018 lo puso (en el builder, el gate, el board). En la docs, «enlace verde» y «estado verde» conviven porque el estado va siempre acompañado de etiqueta.
- **Es una decisión de sitio, no de producto.** El builder, el dashboard y el board no cambian: ahí el verde sigue siendo lo que 018 y la regla de estado dicen.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no (según lo elegido) |
|---|---|
| **Respetar 018 al pie: acento monocromo en la docs, verde solo para estado** | Era la opción más coherente con la marca y se ofreció primero. El propietario la descartó a favor del look delphitools, que es verde-primario. Reafirmada la preferencia con la advertencia a la vista |
| **Volver el logo verde también** | Rechazado: 018 RF2 se mantiene intacto. El logo sigue monocromo; solo el acento de la docs es verde |
| **Verde primario en TODO el producto (builder incluido)** | Fuera de alcance: esta decisión es solo para `site/`. Tocar el builder reabriría la regla de estado (`bitacora/decisiones/2026-07-21-una-sola-regla-de-estado-de-spec.md`) sin necesidad |

## Consequences / Consecuencias

**A favor**
- La docs gana el carácter que el propietario pidió, con la paleta propia (tokens del builder), no una ajena.
- Una sola fuente de color entre builder y docs: coherencia visual del producto.

**Costo aceptado (el que 018 nombró)**
- En la docs, el verde carga dos significados: acento de marca y estado. 018 advirtió justo de esto. El costo se mitiga —el estado siempre lleva etiqueta— pero no desaparece: un lector podría leer un enlace verde como «estado» en un vistazo rápido. Se acepta a cambio del look elegido.
- 018 deja de ser universal: ahora hay una excepción de sitio. Quien lea 018 debe leer también este registro.

**Coherencia con 018**
- 018 RF2 (logo monocromo) intacto. La regla de estado del producto (builder/gate/board) intacta. El cambio se acota a `site/`.

**Cuándo revisar esta decisión**
- Si aparece confusión real (usuarios que leen enlaces como estado): volver al acento monocromo de la docs, que era la opción A.
- Si se decide unificar producto y docs bajo el mismo acento: entonces hay que revisar 018 y la regla de estado juntas, no por separado.
- Si 018 se reescribe alguna vez: este registro debe citarse como su primera excepción documentada.
