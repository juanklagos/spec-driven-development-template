# Especificación 034 - Rediseño de la documentación

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-13`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-08-13: "ahora implementa con la dialectica" — instrucción de implementar el rediseño resolviendo cada decisión por tesis/antítesis/síntesis

## Objetivo

Que el sitio de documentación se lea sin cansar, que la portada mande a cada
lector por su puerta, y que el tipo de cada guía se reconozca de un vistazo.

## Historia de usuario principal

Como persona que llega al sitio, quiero saber en el primer pantallazo si esto
es para mí y por dónde entrar, y quiero poder leer una guía larga sin que la
tipografía me canse.

Las decisiones de este rediseño están resueltas por dialéctica en
`research.md`: cada una enfrenta la posición contraria antes de elegir, y
ninguna se decide por gusto.

## Contexto (medido, no supuesto)

- La portada usa cuatro tarjetas con iconos de colores en cuadros pastel,
  repartidas en dos columnas desalineadas. Ninguna de las tres referencias
  miradas (Stripe, iA, Biome) usa ese patrón en su portada.
- Todo el sitio usa iA Writer Quattro, incluidos los párrafos largos. Los
  propios autores de la fuente reservan la mono para escritura y código.
- La cabecera de tipo que introdujo la spec 033 se emite como cita de
  markdown, así que en el sitio no se distingue de un aviso cualquiera.
- El tema actual (spec 026) es accesible, rápido y bilingüe. No está roto:
  está sin jerarquía.

## Escenarios de aceptación

1. Dada la portada, cuando la abro, entonces veo la regla del producto y dos
   rutas claras — no técnica y técnica — sin tarjetas compitiendo entre sí.
2. Dada cualquier guía larga, cuando la leo, entonces la línea no pasa de
   unos 68 caracteres y el interlineado permite leer de corrido.
3. Dada cualquier guía, cuando la abro, entonces su tipo se distingue a
   simple vista de un aviso o de una cita.
4. Dado el mismo documento en GitHub o en el paquete npm, cuando lo leo,
   entonces la cabecera de tipo sigue siendo legible sin CSS.
5. Dado el sitio en claro y en oscuro, cuando comparo, entonces ambos están
   completos y ningún color queda definido en un solo tema.

## Criterios de aceptación (formato EARS recomendado)

- R1 — EL CUERPO DE TEXTO DEBERÁ limitar la medida de línea a ~68 caracteres
  y usar un interlineado de lectura larga, sin cambiar de familia
  tipográfica.
- R2 — LA JERARQUÍA DE TÍTULOS DEBERÁ construirse con tamaño, peso y espacio,
  no añadiendo una segunda familia.
- R3 — LA PORTADA NO DEBERÁ usar tarjetas con icono como arquitectura
  principal; DEBERÁ agrupar enlaces por intención, con las dos puertas
  primero.
- R4 — LA PORTADA DEBERÁ mostrar una salida real del producto en vez de
  describirlo.
- R5 — LA CABECERA DE TIPO DEBERÁ emitirse como HTML con clase propia, de
  modo que reciba tratamiento visual en el sitio y siga siendo legible como
  texto en GitHub y en el paquete npm.
- R6 — EL SISTEMA NO DEBERÁ añadir peticiones a servidores externos: ni
  fuentes, ni CDN, ni analítica.
- R7 — EL SISTEMA NO DEBERÁ cambiar los tokens de color compartidos con el
  builder; SI un cambio los tocara, ENTONCES DEBERÁ declararse porque repinta
  también la aplicación.
- R8 — DESPUÉS del rediseño, la comprobación de enlaces DEBERÁ seguir dando
  cero rotos en las tres superficies.

## Requisitos

- Ajustes de lectura en `site/src/styles/theme.css`: medida, interlineado,
  escala de títulos.
- Estilo propio para la cabecera de tipo, en claro y oscuro.
- El generador de cabeceras emite HTML con clase en vez de cita.
- Portada reescrita en ambos idiomas: dos puertas, cinco tipos, salida real.
- Verificación visual en claro y oscuro, y comprobación de enlaces.

## Fuera de alcance / Out of scope

- Cambiar de framework, de logo o de paleta.
- Añadir una segunda familia tipográfica (ver D1 en `research.md`).
- Rediseñar el buscador, la navegación superior o el selector de idioma.
- Tocar el diseño del builder.

## Propiedades de la spec

- Para todo color que el rediseño introduzca, DEBERÁ existir su definición en
  los dos temas.
- Para todo cambio de este rediseño, revertir `theme.css` y la portada
  DEBERÁ devolver el sitio a su estado anterior.

## Ámbito de archivos / File scope

- `site/src/styles/theme.css`
- `site/src/content/docs/{en,es}/index.mdx`
- `scripts/sync-doc-types.mjs`

## Criterios de éxito

- Un lector no técnico sabe en cinco segundos por dónde entrar.
- Una guía de 300 líneas se lee sin cansar.
- El tipo de documento se reconoce sin leerlo.
