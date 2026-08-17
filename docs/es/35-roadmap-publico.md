# Roadmap público

<!-- sdd:doc-type:start -->

<p class="sdd-doc-type"><strong>Proyecto</strong> Material del repositorio: roadmap, lanzamientos y auditorías. No es documentación de producto.</p>

<!-- sdd:doc-type:end -->

## Propósito

Aquí queda por escrito hacia dónde va el framework, para que nadie tenga que
adivinarlo leyendo commits.

## Dónde mirar qué

Este documento **no** lleva la cuenta de las versiones publicadas. Esa lista se
pudre: una versión más y ya miente. Los números viven donde se generan solos:

| Qué quieres saber | Dónde está |
| :--- | :--- |
| Qué versión es la última | La [página de releases](https://github.com/juanklagos/spec-driven-development-template/releases) |
| Qué cambió en cada una | [`CHANGELOG.md`](../../CHANGELOG.md) |
| Qué se está construyendo ahora | [`specs/INDEX.md`](../../specs/INDEX.md) — cada spec con su estado |
| Por qué algo es como es | `bitacora/decisiones/` |

## Qué ya está resuelto

El framework SDD con su política multi-agente y la compuerta que la hace
cumplir. El sidecar `spec/` para proyectos que ya existen. `sdd-core` tipado y
`sdd-mcp` publicados en npm, con `stdio` y `Streamable HTTP`. El tablero visual,
como app de escritorio y en el navegador. Conectar un agente en un paso. Y una
línea de pruebas que ejecuta el servidor en vez de leerlo.

## Qué falta

Esto sale de las specs abiertas, no de una intención. Cada punto se puede
comprobar en su origen:

- **La ruta `npx` del lanzador de un comando.** La spec 011 está en progreso:
  T1, T2 y T7 hechas, quedan T3–T6 y T8.
- **Firmar la app de escritorio en Windows.** Hay una vía gratuita para
  licencias aprobadas por OSI, que MIT cumple, y está pendiente de solicitar.
  En macOS es una decisión tomada, no un olvido: el certificado de Apple cuesta
  99 USD al año y el proyecto lo mantiene una persona.
- **Navegar la documentación por tipo.** Quedó fuera del alcance de la spec 035
  a propósito: páginas índice por tipo de documento, filtrar la búsqueda por
  tipo —necesita un componente de Pagefind— y el índice lateral derecho con
  barra de progreso.

Lo que no está en `specs/INDEX.md` no está planeado. Si algo de aquí te importa,
el sitio para pedirlo es una issue.

## El criterio que no cambia

- GitHub Spec Kit sigue siendo la referencia externa del flujo.
- Una feature nueva tiene que **quitar** fricción al usuario. Si añade pasos de
  instalación, no entra.
