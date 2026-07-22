# Investigación 018 - Un logo propio

## Hallazgos

1. **El favicon actual es el de Astro por defecto.** `site/public/favicon.svg` es el destello de
   cuatro puntas que trae el andamio, sin modificar. La pestaña anuncia la herramienta con la que
   está hecho el sitio, no el proyecto.

2. **El verde ya está ocupado como color de estado.** `builder/src/styles.css:17` fija
   `--primary: #16a34a` con el comentario «el 🌱 verde se mantiene como acento primario», y el mismo
   verde aparece en el veredicto de la compuerta y en el semáforo del gate. Es información, no marca.

3. **El único activo gráfico propio va por libre.** `docs/assets/social-preview.svg` usa un degradado
   naranja (`#F97316` → `#FDBA74`) que no aparece en ninguna otra superficie del proyecto.

## Decisiones, y por qué

- **Monograma recortado, no icono ilustrativo.** Se descartaron dos rondas previas —compuerta,
  lienzo, brote; monograma tipográfico, bloque partido, semáforo, terminal—. La razón de elegir el
  recorte en negativo es dónde va a vivir el logo: pestañas, npm y avatares de repositorio, a 16-32 px
  y sobre fondos que no controlamos. Una letra suelta no tiene silueta propia y se deshace ahí.

- **Monocromo, no el verde de marca.** Referencia: el hallazgo 2. Si el logo fuera verde, marca y
  estado competirían por el mismo color dentro del propio producto.

- **Dos archivos para la cabecera en vez de uno adaptativo.** Un SVG embebido como imagen no ve el
  `data-theme` que escribe el interruptor de Starlight; `prefers-color-scheme` seguiría al sistema
  operativo. Con el sistema en claro y el sitio en oscuro, el logo saldría negro sobre negro. El
  favicon sí puede ser adaptativo porque ahí el navegador evalúa la consulta de medios.

- **Sin logotipo con texto, de momento.** Un SVG con `<text>` depende de que la fuente exista en la
  máquina que lo abre; hacerlo portable exige convertir la letra a trazos. La cabecera del sitio ya
  compone símbolo + título con su propia tipografía, así que el archivo no hace falta todavía.
