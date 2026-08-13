# Plan técnico 034 - Rediseño de la documentación

## Idea central

Tocar poco y medible. El tema actual funciona; lo que falta es jerarquía. Se
cambian tres cosas —lectura, cabecera de tipo y portada— y nada más, para que
el rediseño se pueda revertir archivo a archivo.

## Fases

1. **Lectura (R1, R2).** En `theme.css`: medida de línea, interlineado y
   escala de títulos. Sin familia nueva; la jerarquía sale de tamaño, peso y
   espacio. Es la síntesis de D1.
2. **Cabecera de tipo (R5).** `sync-doc-types.mjs` emite
   `<p class="sdd-doc-type">…` en vez de `> …`. Markdown admite HTML, así que
   GitHub y el paquete npm siguen mostrándolo como texto. El sitio le da
   color de acento, tamaño pequeño y una línea de separación.
3. **Portada (R3, R4).** Fuera las cuatro tarjetas. En su lugar: la regla en
   una frase, las dos puertas como bloques de enlaces, los cinco tipos como
   columnas de enlaces, y un bloque de terminal con la salida real de la
   compuerta.
4. **Verificación (R8).** Build, capturas en claro y oscuro, comprobador de
   enlaces.

## Decisiones

Las cinco decisiones de diseño están resueltas dialécticamente en
`research.md` (D1 tipografía, D2 tarjetas, D3 qué enseñar, D4 cabecera, D5
alcance). El plan solo las ejecuta.

## Riesgos

- **La medida de línea rompe tablas anchas.** Se limita el cuerpo, no las
  tablas ni los bloques de código.
- **El HTML en markdown se escapa en algún visor.** Mitigado: es un `<p>` con
  clase, el subconjunto más seguro; se comprueba en GitHub y en el payload.
- **Revertir.** Todo el rediseño vive en un archivo de estilos y una portada.

## Cobertura requisito → componente

| Requisito | Componente |
|---|---|
| R1, R2 | `theme.css`: medida, interlineado, escala |
| R3, R4 | `index.mdx` en ambos idiomas |
| R5 | `sync-doc-types.mjs` + estilo `.sdd-doc-type` |
| R6 | ninguna fuente ni recurso externo añadido |
| R7 | no se tocan los tokens compartidos |
| R8 | `npm run docs:links` |
