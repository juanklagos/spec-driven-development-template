# Investigación 034 - Rediseño de la documentación

Cada decisión se resuelve por dialéctica: tesis, antítesis y síntesis. No se
elige por gusto; se elige por lo que le pasa al lector.

## Referencias miradas (2026-08-13)

- **docs.stripe.com** — la portada no usa tarjetas. Título, una línea, un
  botón, y debajo columnas de enlaces de texto agrupados por intención. Toda
  la jerarquía es tipográfica.
- **ia.net** — los autores de iA Writer Quattro, la tipografía de este sitio.
  Reservan la mono para el texto de escritura y el código; los titulares van
  en sans.
- **biomejs.dev** — mismo framework (Starlight). En vez de tarjetas de
  funciones, enseña el producto ejecutándose.

## D1. La tipografía

**Tesis.** Mantener iA Writer Quattro en todo. Es la identidad del sitio: dice
«herramienta de escritura» antes de leer una palabra, y comparte carácter con
el builder.

**Antítesis.** Cansa en párrafos largos. Los propios autores de la fuente no
la usan así: en ia.net los titulares van en sans. Añadir una sans para
titulares mejoraría la lectura de inmediato.

**Síntesis.** No se añade una segunda familia. Añadirla significa otro archivo
auto-hospedado, otra licencia que auditar y peso extra, y rompe la única
identidad tipográfica que este proyecto tiene. Pero la antítesis tiene razón
en el síntoma: **el problema medido no es la familia, es la medida**. iA
Writer Quattro es duoespaciada y está diseñada para leerse largo; lo que
cansa es una línea demasiado ancha con interlineado corto. Se ataca eso:
ancho de línea limitado (~68 caracteres), interlineado mayor en cuerpo y
contraste de jerarquía por tamaño y peso, no por familia. Si tras medirlo
sigue cansando, entonces sí se evalúa la sans, con datos y no por intuición.

## D2. Las tarjetas de la portada

**Tesis.** Las tarjetas con icono son el patrón por defecto de Starlight,
salen gratis y son escaneables.

**Antítesis.** Ninguna de las tres referencias las usa. En este sitio son
cuatro, con iconos de colores en cuadros pastel repartidos en dos columnas
desalineadas: parecen accidentales, compiten entre sí y ninguna gana. Y el
producto ya quitó los emojis de su propia interfaz en la spec 030.

**Síntesis.** Fuera las tarjetas de la portada, y en su lugar la estructura de
Stripe: columnas de enlaces agrupados por intención. Pero no se copia entera
—Stripe agrupa por producto y aquí no hay productos, hay **dos puertas y
cinco tipos**—, así que los grupos son esos. Las tarjetas siguen siendo
válidas dentro de una guía puntual; lo que se retira es su uso como
arquitectura de la portada.

## D3. Qué enseñar en la portada

**Tesis.** Explicar el método: qué es SDD y por qué importa.

**Antítesis.** Biome no explica, enseña: pone el producto ejecutándose. Quien
llega a una documentación quiere ver qué hace, no leer su definición.

**Síntesis.** Enseñar la salida real de la compuerta —que es el producto
entero en cinco líneas de terminal— y dejar la explicación a una línea y a la
guía 00, que para eso es de tipo explicación. Se enseña *y* se enlaza, en vez
de elegir.

## D4. La cabecera de tipo

**Tesis.** Dejarla como cita de markdown: es texto plano, viaja a GitHub, al
paquete npm y al sitio sin depender de CSS.

**Antítesis.** En el sitio se ve como una cita cualquiera, indistinguible de
un aviso. Es la mejor herramienta de orientación que tiene y no se reconoce.

**Síntesis.** Se emite como HTML con clase propia en vez de como cita. El
markdown admite HTML embebido, así que sigue viajando a GitHub y al paquete
—donde se degrada a texto legible— y en el sitio recibe un tratamiento visual
propio. Ni se sacrifica la portabilidad ni la jerarquía.

## D5. El alcance del rediseño

**Tesis.** Rediseñar todo: portada, guías, menú, móvil, componentes.

**Antítesis.** Un rediseño total es un diff irrevisable y este sitio ya
funciona: es accesible, rápido y bilingüe. Cambiarlo entero arriesga mucho
por mejorar poco.

**Síntesis.** Se toca solo lo que la revisión midió como roto: la densidad de
lectura, las tarjetas de la portada y la invisibilidad de los tipos. El resto
del tema —color, logo, navegación, buscador— no se toca. Un rediseño que se
puede revertir en un archivo es un rediseño que se puede probar.
