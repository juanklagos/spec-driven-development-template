# Plan 004 - site-dashboard-community

## Resumen

Nivel 3 ejecutable sin cuentas externas: sitio Starlight con sync desde docs/, dashboard HTTP en sdd-mcp, comunidad (Discussions + README + certificado del tutor) y server.json para el MCP Registry.

## Contexto técnico

- Starlight exige frontmatter `title`; las guías usan H1. Un script de sync (`site/scripts/sync-docs.mjs`) copia docs/ a src/content/docs/ inyectando frontmatter, quitando el H1 y el badge "back to index", y reescribiendo enlaces: intra-carpeta a slugs del sitio, resto a URLs de GitHub.
- Locales: EN como raíz, ES en `/es/`. Sidebar autogenerado.
- Scaffold con `npm create astro -- --template starlight` para heredar versiones correctas; luego se reemplaza config y contenido.
- Pages con `build_type=workflow` (se habilita vía gh api) y workflow con upload-pages-artifact/deploy-pages.
- Dashboard: nuevo handler GET /dashboard en `packages/sdd-mcp/src/http.ts`, leyendo INDEX/tasks vía sdd-core o parsing directo; HTML server-rendered sin dependencias nuevas.
- server.json según esquema del registry oficial (io.github.juanklagos/sdd-mcp).

## Fases de implementación

1. R1: scaffold site/, sync script, config i18n, build local en verde, workflow site.yml, habilitar Pages, push y verificación del deploy.
2. R2: dashboard en http.ts + build + smoke local.
3. R3: Discussions on (gh api), sección Community en README EN/ES, certificado en tutor.md.
4. R4: packages/sdd-mcp/server.json.
5. Trazabilidad (CHANGELOG, INDEX, STATUS, bitácora, history) y validación completa.

## Dependencias

- GitHub Pages del repo (se habilita en esta fase); npm registry para dependencias de Astro.

## Hitos

- Hito 1: sitio desplegado en Pages.
- Hito 2: dashboard navegable en localhost.
- Hito 3: comunidad visible + registry preparado.

## Riesgos

- Versiones de Astro/Starlight: se fijan con el scaffolder oficial; si el build falla en CI se corrige en la misma fase.
- Enlaces de guías hacia archivos fuera de docs/ se reescriben a GitHub (no 404, pero salen del sitio).
- El GIF/asset paths dentro de docs se sirven desde GitHub raw en el sitio v1.
