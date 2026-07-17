# Especificación 004 - site-dashboard-community (Nivel 3 de propuestas 2026-07-17)

## Estado de aprobación / Approval status

- Estado / Status: `Aprobado`
- Valores permitidos / Allowed values: `Pendiente` o `Aprobado` (`Pending` or `Approved`)
- Fecha de aprobación / Approval date: `2026-07-17`
- Aprobado por / Approved by: `Juan Klagos (autor del template)`
- Evidencia de aprobación (enlace o cita corta) / Approval evidence (link or short quote): Chat de la sesión 2026-07-17 — el autor respondió "continua con el resto" tras el cierre del Nivel 2, aprobando el Nivel 3 del backlog. Consentimiento en `.sdd/user-consent.log`.

## Historia de usuario principal

Como visitante o alumno del template, quiero un sitio de documentación navegable y bilingüe, un dashboard visual del estado SDD, y señales de comunidad, para descubrir, aprender y confiar en el proyecto sin leer markdown crudo en GitHub.

## Escenarios de aceptación

1. Dado un visitante, cuando abre el sitio en GitHub Pages, entonces navega las 51 guías con búsqueda, dark mode e idiomas EN/ES.
2. Dado un usuario del servidor `sdd-mcp` en HTTP, cuando abre `/dashboard`, entonces ve las specs con estado, prioridad y progreso de tareas del workspace.
3. Dado un visitante del repo, cuando busca cómo participar, entonces encuentra GitHub Discussions activas y una sección de comunidad en el README.
4. Dado un alumno que completa un nivel del tutor, entonces recibe un badge de completación verificable en su bitácora.

## Criterios de aceptación (formato EARS recomendado)

- CUANDO se haga push a `main` con cambios en `docs/` o `site/`, EL SISTEMA DEBERÁ reconstruir y desplegar el sitio a GitHub Pages.
- CUANDO el sync del sitio procese una guía, EL SISTEMA DEBERÁ inyectar frontmatter desde el H1 y reescribir enlaces internos para que no queden rotos en el sitio.
- CUANDO `/dashboard` no encuentre workspace SDD, EL SISTEMA DEBERÁ responder con un mensaje claro, no con un error 500.
- EL SISTEMA DEBERÁ mantener bilingüe (EN/ES) el sitio y el README.

## Requisitos

- R1. Sitio Astro Starlight en `site/` con i18n (EN raíz, ES en `/es/`), sync automático desde `docs/` y deploy a GitHub Pages por Actions.
- R2. Dashboard HTML en el transporte HTTP de `sdd-mcp` (`GET /dashboard`): specs, estados, progreso de tareas, resultado de gate.
- R3. Comunidad: GitHub Discussions habilitadas, sección "Community" en README EN/ES, badge de completación en el tutor.
- R4. Preparación para el MCP Registry oficial: `packages/sdd-mcp/server.json` (publicación efectiva fuera de alcance).

## Fuera de alcance / Out of scope

- Curso GitHub Skills (requiere repo plantilla aparte; queda documentado como siguiente fase en el backlog).
- Publicación en el MCP Registry y dominio propio del sitio (requieren cuentas/decisiones del autor).
- MCP Apps (SEP-1865) como UI embebida en clientes: se pospone hasta que el SDK esté maduro; el dashboard HTTP cubre la necesidad hoy.

## Criterios de éxito

- Build local del sitio en verde y workflow de Pages desplegando.
- `npm run build` + `typecheck` del monorepo en verde con el dashboard añadido.
- 3 scripts SDD en 0 errores; 0 enlaces rotos en archivos nuevos.
