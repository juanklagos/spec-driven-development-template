# Plan técnico 035 - Rediseño de la documentación (handoff)

## Fases

El del handoff, con una corrección: **el contraste va primero**, porque es un
defecto ya publicado y no depende de ninguna decisión estética.

1. **Contraste (R1, R2).** Verde como texto → `accent-high` en claro; ámbar de
   avisos → su variante de texto; `gray-4` deja de usarse como color de texto.
   Se mide antes y después con el mismo script, no se estima.
2. **Tipografía (R3, R4, R5).** IBM Plex Sans desde `@fontsource/ibm-plex-sans`
   (OFL), copiando los `.woff2` a `site/src/fonts/` para no depender de
   `node_modules` en tiempo de ejecución ni de ningún CDN. `--sl-font` pasa a
   la sans; `--sl-font-mono` sigue en Quattro. La medida se recalcula y se
   comprueba contando caracteres reales por línea.
3. **Portada (R6).** Hero con la salida literal del script, dos puertas
   desarrolladas, cinco tipos con contadores desde `GUIDE_TYPES`.
4. **Cabecera y menú (R7, R8).** Franja entre reglas; contadores y plegado en
   `buildSidebar()`.
5. **Verificación (R9, R10).** Contraste medido, build, enlaces en las tres
   superficies, redirecciones heredadas.
6. **Menú, segunda vuelta (R7).** La primera entrega resolvió el contador
   pegando `· N` a la etiqueta del grupo, no como pedía el handoff. El
   propietario lo rechazó al verlo. Al reabrirlo apareció un defecto mayor: el
   menú pintaba **dos taxonomías a la vez** —los grupos por tipo y una insignia
   de nivel por guía— y la guía 50 salía dentro de «Entiende por qué» con una
   insignia «Referencia», la misma palabra con dos significados en la misma
   fila. Se retiran las insignias de nivel y el emoji inicial de 11 títulos; el
   contador pasa a insignia propia, a la derecha y en monoespaciada.
7. **Documentación caducada.** Tres guías describían un estado que ya no
   existe: la 35 anunciaba «v1.7.0» con 2.5.0 publicada, y la 39 y la 46 eran
   listas de releases pasadas escritas en futuro. La 09 se convierte en la
   única lista viva —con los comandos que el proyecto ejecuta hoy— y se
   completa en inglés, donde le faltaban cuatro secciones.

## Dependencias

- **Fase 1 no depende de nada** y por eso va primera: el contraste es un
  defecto ya publicado, no una decisión estética pendiente.
- **Fase 2 (tipografía) → fase 1.** Cambiar de familia altera la medida y el
  peso visual del texto, así que medir contraste antes evita medir dos veces.
- **Fases 3 y 4 → fase 2.** La portada y el menú se componen sobre la
  tipografía definitiva; hacerlas antes obliga a rehacer el espaciado.
- **Fase 5 → todas las anteriores.** Verifica el resultado, no las partes.
- **Fase 6 → fase 5**, y depende de una decisión externa al plan: que el
  propietario mire el menú construido. No era anticipable desde el handoff.
- **Fase 7 es independiente** de las seis anteriores: toca contenido, no tema.
  Se hace al final porque hasta entonces no se sabía qué guías quedaban
  desalineadas con el estado real del proyecto.
- **Herramienta externa:** `github-slugger`, ya presente. La fase 7 destapó que
  el reescritor de enlaces usaba el nombre del archivo y no ese slug, así que
  todo enlace a una guía con punto en el nombre apuntaba a una página
  inexistente.

## Decisiones

- **La sans se decide fuera de la dialéctica.** La spec 034 la rechazó y dejó
  escrito que se reevaluaría con datos si tras corregir la medida seguía
  cansando. Eso ocurrió: el propietario miró el sitio ya corregido y decidió.
  No se vuelve a argumentar; se implementa.
- **Los `.woff2` se copian al repositorio**, no se enlazan desde
  `node_modules`: el sitio ya auto-hospeda Quattro así y la regla de cero
  peticiones externas obliga a que la fuente viaje con el sitio.
- **Las cifras de contraste del handoff no se copian.** Dos son incorrectas;
  se usan las medidas propias.
- **`68ch` no sobrevive al cambio de familia.** En proporcional, `ch` es más
  estrecho que el carácter medio, así que 68ch pasa de ~68 a ~80 caracteres.
  Se recalcula y se mide.

## Riesgos

- **Cambiar `--sl-font` afecta a todo el sitio.** Mitigación: es un token; se
  revierte en una línea, y se revisa portada, guía y menú tras el cambio.
- **La sans y Quattro pueden desalinearse en línea.** Mitigación: IBM Plex
  Sans comparte esqueleto con IBM Plex Mono, y Quattro se conserva solo en
  bloques y fragmentos, no mezclada dentro de una frase larga.
- **Peso.** Dos familias más pesan; se limitan a 400 y 700, sin itálicas de la
  sans.

## Cobertura requisito → componente

| Requisito | Componente |
|---|---|
| R1, R2 | `theme.css` + script de medición |
| R3, R5 | `site/src/fonts/` + `@font-face` + `--sl-font` |
| R4 | medida recalculada y contada |
| R6 | `index.mdx` en ambos idiomas |
| R7 | `buildSidebar()` en `guides.mjs` |
| R8 | `sync-doc-types.mjs` + CSS |
| R9, R10 | `npm run docs:links` + build |
| Fase 6 | `sync-docs.mjs` (sin insignias, sin emoji) + `guides.mjs` + `theme.css` |
| Fase 7 | guías 09, 35, 39, 46 en ambos idiomas |
