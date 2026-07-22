# Especificación 018 - Un logo propio, y el verde reservado para el estado

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-22`
- Aprobado por / Approved by: `Juan Carlos Alvarez Lagos`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat 2026-07-22 — el autor pidió un logo, descartó dos rondas de conceptos, y sobre la tercera eligió *monograma → tratamiento «recortada» → color monocromo*, con alcance *«logo + conectarlo al sitio»*. Ampliación el mismo día: *«ahora el logo necesito que lo ponga en el builder»*.

## Contexto

El proyecto no tiene logo. `site/public/favicon.svg` es el destello que trae Astro por defecto,
byte a byte, así que la pestaña del navegador anuncia el andamio y no el producto. El único activo
gráfico propio es `docs/assets/social-preview.svg`, que usa una paleta naranja que no aparece en
ningún otro sitio del proyecto.

Hay además un conflicto de color que conviene no crear. Dentro del producto **el verde ya significa
algo**: `Compuerta: ABIERTA`, el semáforo del gate del builder y las insignias de spec aprobada usan
el `#16a34a` como **estado**, no como marca. Un logo verde pondría marca y estado a competir por el
mismo color, y el verde dejaría de querer decir «esto pasó».

## Objetivo

Dar al proyecto una marca propia que funcione a 16 px sobre fondos ajenos, sin gastar el verde que
el producto ya usa para informar.

## Historia de usuario principal

Como alguien que tiene veinte pestañas abiertas, quiero reconocer este proyecto por su icono, y no
confundirlo con cualquier sitio hecho con Astro.

## Escenarios de aceptación

1. Dada la pestaña del navegador, cuando abro el sitio, entonces veo el monograma del proyecto y no
   el favicon por defecto de Astro.
2. Dada la cabecera del sitio, cuando la miro en tema claro y en tema oscuro, entonces el logo se
   ve en ambos, sin depender del tema del sistema operativo.
3. Dado el logo a 16 px, cuando lo miro, entonces la letra sigue siendo legible y no se cierra.
4. Dado el logo, cuando lo pongo sobre un fondo cualquiera, entonces conserva su silueta.
5. Dada la cabecera del builder, cuando la miro, entonces lleva el logo del proyecto y no un emoji.
6. Dado el builder en claro y en oscuro, cuando cambio el tema del sistema, entonces el logo se ve
   en los dos sin que haya que mantener dos copias del dibujo.

## Requisitos funcionales

- **RF1** — Un símbolo: cuadrado de esquinas redondeadas con la `s` recortada en negativo, construida
  con tres barras y dos conectores.
- **RF2** — Monocromo: casi negro sobre claro, casi blanco sobre oscuro.
- **RF3** — El favicon se adapta al tema mediante `prefers-color-scheme`, que es lo que el navegador
  respeta en un SVG de favicon.
- **RF4** — La cabecera del sitio usa **dos archivos fijos**, claro y oscuro. Un SVG embebido como
  imagen no ve el `data-theme` del documento, así que ahí `prefers-color-scheme` seguiría al sistema
  operativo y no al interruptor del sitio.
- **RF5** — El símbolo queda también en `docs/assets/`, disponible para README y materiales.
- **RF6** — El builder muestra el símbolo en su cabecera, en lugar del emoji 🌱, y en su favicon.
- **RF7** — En el builder el símbolo es SVG en línea con `currentColor`. Ahí sí está en el mismo
  documento, así que hereda el color del texto y no necesita las dos copias que sí necesita el sitio.

## Fuera de alcance

- El logotipo con el texto al lado. La cabecera del sitio ya compone símbolo + título con su propia
  tipografía; un archivo con texto exigiría convertir la letra a trazos para ser portable.
- Rehacer `docs/assets/social-preview.svg`, que sigue en naranja.
- Cambiar el verde del builder, que se queda como color de estado.
- El panel del servidor MCP (`packages/sdd-mcp/src/dashboard.ts`), que también lleva el 🌱 en su
  título y en su marca. Es otra superficie y va aparte.
