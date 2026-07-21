# Decisión clave - La escuela bilingüe de SDD que también es herramienta, ejecutada en 3 niveles / Key decision - Position as the bilingual SDD school, executed in 3 levels

## Date / Fecha

2026-07-17

## Context / Contexto

El 2026-07-17 se hicieron dos investigaciones (proyectos SDD con tracción, y formatos/estándares de interactividad 2026) y se sintetizaron en `idea/PROPUESTAS_2026-07-17.md`. El documento abre con una tabla competitiva —spec-kit 122k, GSD 65k, OpenSpec 61k, BMAD 51k, spec-workflow-mcp 4k (`idea/PROPUESTAS_2026-07-17.md:12-18`)— y saca dos lecturas explícitas (`:21-22`):

- «El mercado convergió en **CLI de un comando + slash commands multi-agente**».
- «**Nadie compite en educación bilingüe ES/EN**: es el espacio natural de este template».

El mismo documento describe el estado del repo ese día: sin instalación npx (paquetes `private: true`), sin slash commands propios, sin sitio de docs, sin demo visual, sin comunidad formal.

## Decision / Decisión

Adoptar el posicionamiento **«la escuela bilingüe de SDD que también es herramienta»** (`idea/PROPUESTAS_2026-07-17.md:127`) y ejecutar el documento de arriba a abajo convertido en specs numeradas, un nivel por spec:

1. **Nivel 1 → spec `002-interactive-onboarding`:** Agent Skill portable, slash commands `/sdd:*`, espejo Copilot, `llms.txt`, devcontainer, demo VHS.
2. **Nivel 2 → spec `003-distribution-and-tutor`:** plugin de Claude Code + marketplace propio, `/sdd:tutor`, GitHub Action compuesta, scaffolder npm.
3. **Nivel 3 → spec `004-site-dashboard-community`:** sitio de docs Astro Starlight en GitHub Pages, `/dashboard`, comunidad.
4. Más spec `005-learning-for-everyone`: aprendizaje por niveles.

Cada elección técnica lleva su razón escrita en el mismo documento, no en reconstrucción: **Agent Skills** porque «lo leen 32+ herramientas… Un formato, todos los agentes» (`:32`); **devcontainer** porque «Gitpod ya no es alternativa (pivotó a Ona)» (`:55`); **VHS** porque «la demo nunca queda desactualizada» (`:60`); **Astro Starlight** porque «es el framework 2026 con mejor i18n nativa» (`:89`).

Cada nivel fue aprobado por el autor en el chat, con las palabras registradas en `.sdd/user-consent.log:2-5`: 10:43 «hazlo» (Nivel 1), 10:56 «hazlo y continua con todo nivel senior» (Nivel 2), 11:06 «continua con el resto» (Nivel 3), 11:21 (resto de propuestas + nivelado del aprendizaje). `bitacora/global/PROJECT_LOG.md:73` (Sesión 3) lo cierra como decisión confirmada.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Certificación formal con Open Badges** | Rechazada en el propio documento: «Open Badges formal no compensa para un repo OSS» (`idea/PROPUESTAS_2026-07-17.md:111`, §3.3). Se opta por badge shields.io al cerrar curso/tutor. |
| **Repo aparte de curso con formato GitHub Skills** (§3.2) | Quedó **fuera del alcance** de la spec 004 y se documentó como T10 (`specs/004-site-dashboard-community/history.md:6`, `tasks.md:12`). Nota: se ejecutó igualmente más tarde ese mismo día bajo la spec 005 — el repo `aprende-sdd` quedó creado y verificado end-to-end en CI (`specs/005-learning-for-everyone/history.md`). |
| **MCP Apps embebido para el dashboard** (§3.1B) | Pospuesto; el dashboard vive en el transporte HTTP existente de `sdd-mcp` (`specs/004-site-dashboard-community/history.md:8`). |

No hay registro escrito de que se evaluara **no** hacer nada del documento, ni de un análisis de capacidad de mantenimiento previo a aprobar los tres niveles. Los costos de abajo se hacen explícitos aquí por primera vez.

## Consequences / Consecuencias

**A favor**
- Seis commits el 2026-07-17 (`ba0ae59`, `adee296`, `6f1c641`, `4d5ab1a`, `f995365`, `a86ee86`) y el release **v1.5.0** (`CHANGELOG.md:120`).
- Sitio con **155 páginas** construidas (51+51 guías + landings + búsqueda Pagefind) y Pages habilitado con `build_type=workflow`; Discussions activadas vía API (`specs/004-site-dashboard-community/history.md:11-13`).

**Costos aceptados**
- Superficie de mantenimiento mucho mayor para **un solo mantenedor**: sitio, plugin + marketplace, GitHub Action, scaffolder npm y demo regenerada en CI.
- Dependencia de la sincronización docs→sitio (`site/scripts/sync-docs.mjs`): las 51 guías bilingües son la fuente y el sitio es derivado; si el sync se rompe, el sitio miente.

**Hallazgo real del cierre**
- La sintaxis de sidebar autogenerado **cambió en Starlight 0.39**; se detectó y corrigió durante el cierre de la spec 004 (`specs/004-site-dashboard-community/history.md:11`). Primer aviso concreto del costo de depender de un framework de terceros para la cara pública.

**Estado**
- **Vigente.** No fue superada. Es la extensión concreta del posicionamiento de `bitacora/decisiones/2026-03-14-spec-kit-es-el-motor.md` («Spec Kit es el motor, este template es donde se aprende y se aplica con disciplina verificada»).

**Cuándo revisar esta decisión**
- Si aparece un competidor que ocupe el espacio de **educación bilingüe ES/EN** — la premisa entera de `:22` deja de sostenerse y el diferencial se mueve a otra parte.
- Si el mantenimiento de las cinco superficies (sitio, plugin, Action, scaffolder, demo) empieza a comerse el tiempo de las guías: la escuela es el producto; la herramienta es el vehículo, no al revés.
- Si `site/scripts/sync-docs.mjs` falla o se desactualiza sin que nadie lo note, o si Starlight vuelve a romper compatibilidad como en 0.39 en un segundo o tercer episodio.
- Si Agent Skills, `llms.txt` o el formato de plugins de Claude Code dejan de ser estándares vivos: cada uno se eligió por adopción, no por mérito técnico.
- Si el proyecto deja de ser mantenido por una sola persona (a favor: la superficie deja de ser un riesgo) o si el autor deja de publicar por cuenta propia npm/Marketplace (T11, T10 siguen siendo pasos del autor).
