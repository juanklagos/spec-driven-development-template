# Especificación 035 - Rediseño de la documentación (handoff)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-08-17`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-08-17: "necesito rediseñar la doc así" + "dale" tras la revisión del handoff — incluye la decisión de añadir la sans, en las condiciones que la spec 034 dejó escritas

## Objetivo

Implementar el rediseño del handoff de diseño: corregir el contraste que hoy
falla, repartir el trabajo tipográfico entre una sans y la duoespaciada, y
desarrollar portada, cabecera de guía y menú según la referencia.

## Historia de usuario principal

Como lectora del sitio, quiero texto que cumpla contraste, prosa que no canse
y una portada que me mande por mi puerta, sin que el sitio pierda el carácter
de herramienta de escritura que tiene hoy.

## Contexto (medido, no supuesto)

Handoff en `design_handoff_docs_redesign/`, revisado el 2026-08-17. Sus
afirmaciones se verificaron una a una:

- **Ciertas**: los conteos por tipo (6/21/17/5/6 = 55), la salida del hero es
  literal de `scripts/check-sdd-gate.sh`, y la maqueta no hace ninguna
  petición externa.
- **Contraste, medido convirtiendo oklch → sRGB → luminancia**:

  | Uso (tema claro, sobre su fondo real) | Ratio | WCAG AA |
  | :--- | ---: | :--- |
  | verde 0.627 como enlace | 3.09:1 | falla |
  | verde 0.627 como título de aviso | 3.30:1 | falla |
  | ámbar 0.681 como título de aviso | 2.93:1 | falla |
  | verde `accent-high` 0.38 | 9.48:1 | pasa |
  | ámbar-texto 0.48 | 6.68:1 | pasa |
  | botón primary 0.5 + texto 0.99 | 5.40:1 | pasa |

- **Las cifras del handoff son correctas** una vez medidas contra el fondo
  real de cada elemento (`--sdd-card` para avisos, no `--sl-color-bg`). Solo
  el ámbar-texto queda mejor de lo que estimaba: 6.68:1 frente a 4.9:1.
- **El badge `.sdd-doc-type strong` de la spec 034 usa el verde de 3.09:1** a
  11px: es el texto más pequeño del sitio y falla AA. Es un defecto ya
  publicado.
- La spec 034 decidió no añadir una segunda familia y dejó escrito que se
  reevaluaría con datos si tras corregir la medida seguía cansando. El
  propietario miró el sitio con la medida ya corregida y decidió añadirla.

## Escenarios de aceptación

1. Dado cualquier texto del sitio en cualquiera de los dos temas, cuando se
   mide su contraste, entonces alcanza 4.5:1 (o 3:1 si es texto grande).
2. Dada una guía larga, cuando la leo, entonces la prosa va en sans y el
   código, las rutas y la salida de scripts siguen en la duoespaciada.
3. Dada la portada, cuando la abro, entonces veo la promesa, la compuerta
   ejecutándose de verdad, dos puertas y los cinco tipos con sus contadores.
4. Dado el menú lateral, cuando lo miro, entonces cada grupo dice cuántas
   guías tiene y solo está desplegado el del documento actual.
5. Dado el sitio sin conexión a internet, cuando carga, entonces todas las
   fuentes resuelven localmente.

## Criterios de aceptación (formato EARS recomendado)

- R1 — NINGÚN texto DEBERÁ quedar por debajo de 4.5:1 sobre su fondo (3:1
  para texto de 24px o de 19px en negrita), en los dos temas.
- R2 — EL VERDE DEBERÁ usarse como texto solo en su variante accesible:
  `accent-high` en claro, `accent` en oscuro. El de 0.627 queda para
  superficies y bordes.
- R3 — EL SISTEMA DEBERÁ servir la prosa y los titulares en una sans
  auto-hospedada, y reservar iA Writer Quattro para código, salida de
  scripts, rutas, metadatos y etiquetas de tipo.
- R4 — CUANDO cambie la familia de la prosa, LA MEDIDA DE LÍNEA DEBERÁ
  recalcularse: `ch` es el ancho del glifo «0», así que 68ch en proporcional
  equivale a más caracteres que en duoespaciada. La medida final DEBERÁ
  quedar entre 60 y 75 caracteres reales, medidos.
- R5 — EL SISTEMA NO DEBERÁ añadir ninguna petición a un servidor externo.
- R6 — LA PORTADA DEBERÁ mostrar la salida literal del script de la
  compuerta, sin inventar líneas ni traducir lo que el script emite en
  inglés.
- R7 — EL MENÚ DEBERÁ mostrar el número de guías por grupo, tomado de la
  clasificación y no escrito a mano, y DEBERÁ traer desplegado solo el grupo
  del documento actual.
- R8 — LA CABECERA DE TIPO DEBERÁ presentarse como franja entre reglas, sin
  fondo ni caja, y seguir degradando a texto legible sin CSS.
- R9 — EL SISTEMA NO DEBERÁ renumerar ni renombrar guías, ni romper las
  redirecciones heredadas.
- R10 — DESPUÉS del rediseño, la comprobación de enlaces DEBERÁ dar cero
  rotos en las tres superficies.

## Requisitos

- Correcciones de contraste en `theme.css`, en ambos temas.
- IBM Plex Sans auto-hospedada (OFL) + `@font-face` junto a Quattro.
- Reparto tipográfico por rol, no por elemento suelto.
- Medida de línea recalculada y medida de verdad.
- Portada: hero con terminal, dos puertas desarrolladas, cinco tipos con
  contadores.
- Cabecera de tipo como franja; menú con contadores y plegado.

## Fuera de alcance / Out of scope

- Páginas índice por tipo (crearían rutas nuevas; ver objeción 1 del handoff).
- Filtrar la búsqueda por tipo (necesita un componente sobre Pagefind).
- Traducir la salida del script (cambiaría el producto, no el sitio).
- Rediseñar el logo, el buscador o el conmutador de idioma.
- Tocar el builder.

## Propiedades de la spec

- Para todo color de texto que el rediseño introduzca o mueva, DEBERÁ existir
  su medición de contraste en ambos temas.
- Para toda fuente declarada, DEBERÁ existir su archivo local y su licencia
  en el repositorio.

## Ámbito de archivos / File scope

- `site/src/styles/theme.css`
- `site/src/fonts/`
- `site/src/content/docs/{en,es}/index.mdx`
- `site/src/guides.mjs`
- `scripts/sync-doc-types.mjs`

## Criterios de éxito

- Ningún texto por debajo del mínimo de contraste, medido y no estimado.
- Una guía larga se lee sin cansar.
- El sitio sigue cargando sin conexión externa.
