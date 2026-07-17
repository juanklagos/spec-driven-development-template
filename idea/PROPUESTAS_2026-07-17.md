# Propuestas de evolución del template — 2026-07-17

> Documento de trabajo (no es spec ni roadmap aprobado). Sintetiza dos investigaciones hechas el 2026-07-17:
> (1) features de los proyectos SDD similares con más tracción, y (2) formatos/estándares de interactividad 2026.
> Cada propuesta indica qué es, por qué, cómo se implementa y esfuerzo estimado.
> Cuando se apruebe alguna, debe convertirse en spec numerada en `specs/` antes de implementar.

## Contexto competitivo (resumen)

| Proyecto | Estrellas (~jul 2026) | Su gran feature |
|---|---|---|
| github/spec-kit | 122k | CLI + slash commands + marketplace de 138 extensiones y 25 presets |
| GSD (get-shit-done) | 65k en 6 meses | `npx` con auto-detección de 14 runtimes + entrevista guiada `/gsd:new-project` |
| OpenSpec | 61k | Ligereza (`npm i -g` sin config) + dashboard visual + "fluid not rigid" |
| BMAD-METHOD | 51k | Comunidad (Discord/YouTube) + agentes con persona + `bmad-help` |
| context-engineering-intro | 14k | Ejemplos rellenos + validation gates con confidence score |
| ai-dev-tasks | 8k con 65 commits | Fricción cero: 3 archivos markdown |
| spec-workflow-mcp | 4k | Dashboard web en vivo + aprobaciones humanas + extensión VSCode + 11 idiomas |

Lecturas clave:
- El mercado convergió en **CLI de un comando + slash commands multi-agente**.
- **Nadie compite en educación bilingüe ES/EN**: es el espacio natural de este template.
- La interactividad visible (dashboard, tutor, demo) es lo que convierte lectores en usuarios.
- Este repo hoy: sin instalación npx (paquetes `private: true`), sin slash commands propios, sin sitio de docs, sin demo visual, sin comunidad formal. Fortalezas ya construidas: gate verificado por scripts, MCP propio, sidecar, 51 guías bilingües.

---

## Nivel 1 — Rápidas (días; solo markdown/config, sin romper nada)

### 1.1 Agent Skills portables (`skills/sdd-workflow/SKILL.md`)
- **Qué:** empaquetar el flujo SDD (idea → spec → plan → tasks → gate → bitácora) como Agent Skill del estándar abierto de dic-2025.
- **Por qué:** lo leen 32+ herramientas (Claude Code, Codex CLI, Cursor, Gemini CLI, Copilot, Kiro...). Un formato, todos los agentes.
- **Cómo:** carpeta `skills/sdd-workflow/` con `SKILL.md` (frontmatter `name` + `description`) que condense AGENT_OPERATING_SYSTEM + los scripts de validación como herramientas de la skill.
- **Esfuerzo:** bajo.

### 1.2 Slash commands propios con namespace `/sdd:*` + comando router
- **Qué:** `.claude/commands/` con `/sdd:new` (inicio), `/sdd:spec`, `/sdd:gate`, `/sdd:close` (cierre de sesión con contrato) y sobre todo `/sdd:help` — el patrón "dime el siguiente paso" de `bmad-help` y `/kiro-discovery`.
- **Por qué:** hace el flujo descubrible con autocompletado; hoy el template depende de prompts copy/paste.
- **Cómo:** un `.md` por comando reutilizando el banco de prompts (docs 19/26/30); bilingües.
- **Esfuerzo:** bajo.

### 1.3 Soporte Copilot/VS Code completo
- **Qué:** `.github/prompts/*.prompt.md` (slash commands de VS Code) y `.github/instructions/*.instructions.md` con `applyTo:` espejo de los comandos Claude.
- **Por qué:** Copilot es la base instalada más grande; el costo es mínimo (markdown reutilizado).
- **Esfuerzo:** bajo.

### 1.4 `llms.txt` en la raíz (+ generador en `scripts/`)
- **Qué:** índice markdown de las 51 guías con descripción de una línea; opcional `llms-full.txt`.
- **Por qué:** los agentes de código sí lo consultan al apuntarles al repo (los crawlers no; no es SEO). Coherente con la temática.
- **Cómo:** script bash `scripts/generate-llms-txt.sh` que lo regenere desde `docs/`.
- **Esfuerzo:** bajo.

### 1.5 Devcontainer + badge "Open in Codespaces"
- **Qué:** `.devcontainer/devcontainer.json` (node + bash, `postCreateCommand` que corre `npm install && ./scripts/validate-sdd.sh .`) y el badge oficial en el README.
- **Por qué:** el alumno pasa de "clonar y configurar" a un clic. Gitpod ya no es alternativa (pivotó a Ona).
- **Esfuerzo:** bajo.

### 1.6 Demo visual con VHS regenerada en CI
- **Qué:** `demo.tape` (charmbracelet/VHS) que grabe el happy path: crear spec → validar → gate → consentimiento; GIF en el README y workflow que lo regenere en cada release.
- **Por qué:** patrón dominante en proyectos top; la demo nunca queda desactualizada. Hoy el README no muestra el flujo funcionando.
- **Esfuerzo:** bajo.

## Nivel 2 — Corazón de la evolución (semanas)

### 2.1 Plugin de Claude Code con marketplace propio ⭐
- **Qué:** `.claude-plugin/marketplace.json` + plugin que empaquete commands (1.2), skill (1.1), hooks de validación y el servidor `sdd-mcp` existente.
- **Por qué:** instalación en un comando (`/plugin marketplace add juanklagos/spec-driven-development-template`), sin clonar nada. Es el vehículo de distribución nativo de 2026 y Spec Kit ya validó el modelo con su modo skills.
- **Cómo:** el repo mismo actúa de marketplace (basta GitHub); `plugin.json` con versión sincronizada al release.
- **Esfuerzo:** medio.

### 2.2 Tutor interactivo `/sdd:tutor` ⭐ (diferenciador educativo)
- **Qué:** el propio agente como profesor: guion pedagógico por niveles (principiante/intermedio/avanzado) que conversa, propone ejercicios sobre las 51 guías y usa los scripts de validación como "corrector" objetivo.
- **Por qué:** convierte "docs que se leen" en "curso que se conversa". Patrón probado (curso SDD de DeepLearning.AI, claude-code-tutor) y **nadie lo ofrece bilingüe ES/EN**. Es la traducción natural de la vocación del repo.
- **Cómo:** command o skill con el guion; los niveles ya existen (docs 13/14/15/18); cierre de cada lección = correr validación y registrar en bitácora.
- **Esfuerzo:** medio.

### 2.3 Publicación npm: `npx create-sdd-project` + `@sdd/sdd-mcp` público
- **Qué:** (a) scaffolder interactivo (`@clack/prompts`: idioma EN/ES, agente, modo sidecar/standalone) que reemplace el flujo "clonar + bash"; (b) quitar `private: true` y publicar `sdd-mcp` para configurarlo con `npx` como hace spec-workflow-mcp.
- **Por qué:** la instalación de un comando es el denominador común de los 4 proyectos con más tracción. Hoy este repo exige clonar.
- **Esfuerzo:** medio (requiere cuenta npm y decidir el scope real, p. ej. `@juanklagos/`).

### 2.4 Entrevista guiada `/sdd:new` (patrón GSD)
- **Qué:** en vez de página en blanco, el comando entrevista (metas, restricciones, stack, edge cases) → llena `idea/IDEA_GENERAL.md` → propone la primera spec para aprobar.
- **Por qué:** la feature señalada como más amigable para principiantes en las reseñas de GSD; alineada con el gate del template (la aprobación sigue siendo del usuario).
- **Esfuerzo:** medio (puede fusionarse con 1.2).

### 2.5 Sitio de docs con Astro Starlight en GitHub Pages
- **Qué:** montar las 51 guías como sitio bilingüe con búsqueda, dark mode, asciinema-player embebido y `llms-full.txt` generado por plugin.
- **Por qué:** Starlight es el framework 2026 con mejor i18n nativa; todos los competidores grandes tienen sitio propio; da URL presentable para difusión.
- **Cómo:** `site/` con `npm create astro -- --template starlight`, colecciones en/es apuntando a `docs/`, deploy con GitHub Actions a Pages.
- **Esfuerzo:** medio.

### 2.6 GitHub Action pública "sdd-validate"
- **Qué:** action composite (`action.yml`) que envuelva `validate-sdd.sh` + `check-sdd-policy.sh` + `check-sdd-gate.sh`, publicada en el Marketplace.
- **Por qué:** lleva "no hay código sin spec" al CI de cualquier proyecto (incluidos los que usan el sidecar) y da visibilidad orgánica.
- **Esfuerzo:** medio.

## Nivel 3 — Apuestas mayores (meses)

### 3.1 Dashboard visual del flujo SDD
- **Opción A (pragmática):** guía de integración con spec-workflow-mcp (dashboard localhost:5000 + extensión VSCode) para proyectos sidecar.
- **Opción B (diferenciadora):** MCP Apps (extensión oficial desde ene-2026; spec final 2026-07-28) en el `sdd-mcp` propio: un tool que devuelva UI (`ui://`) con el estado de specs/gates/bitácora renderizada en Claude Desktop/VS Code. Ningún template SDD lo tiene aún.
- **Esfuerzo:** A bajo / B alto.

### 3.2 Curso "Aprende SDD" con formato GitHub Skills
- **Qué:** repo plantilla aparte con 4-5 pasos (constitución → spec → plan → gate → cierre) donde workflows de Actions detectan el avance del alumno.
- **Por qué:** formato oficial y probado de aprendizaje interactivo en GitHub; regla documentada: 30-45 min máximo.
- **Esfuerzo:** alto.

### 3.3 Comunidad y credenciales
- **Qué:** GitHub Discussions activadas + Discord (modelo BMAD "no gated content") + certificado de completación simple (badge shields.io al cerrar el curso/tutor; Open Badges formal no compensa para un repo OSS).
- **Esfuerzo:** medio (constante en el tiempo).

### 3.4 Distribución MCP avanzada
- **Qué:** publicar `sdd-mcp` en el registry oficial (registry.modelcontextprotocol.io con `server.json` + `mcp-publisher`) y empaquetar bundle `.mcpb` para instalación de un clic en Claude Desktop.
- **Esfuerzo:** medio (depende de 2.3).

---

## Orden recomendado

1. **Semana 1 (Nivel 1 completo):** 1.1 skills → 1.2 commands+router → 1.3 Copilot → 1.4 llms.txt → 1.5 devcontainer → 1.6 demo VHS. Todo markdown/config, cero riesgo, y el repo ya se ve y se usa distinto.
2. **Fase 2:** 2.1 plugin/marketplace + 2.2 tutor (el corazón educativo) → 2.4 entrevista `/sdd:new`.
3. **Fase 3:** 2.3 npm + 2.5 sitio Starlight + 2.6 Action.
4. **Fase 4:** 3.1B dashboard MCP Apps, 3.2 curso Skills, 3.3 comunidad, 3.4 registry/mcpb.

Posicionamiento que sostiene todo: **"la escuela bilingüe de SDD que también es herramienta"** — Spec Kit es el motor, este template es donde se aprende y se aplica con disciplina verificada. Nadie más ocupa ese espacio en español.

## Fuentes

Los dos informes completos con URLs quedaron registrados en la sesión del 2026-07-17 (bitácora diaria). Fuentes primarias principales: github/spec-kit, openspec.dev, bmad-code-org/BMAD-METHOD, Pimzino/spec-workflow-mcp, gotalab/cc-sdd, snarktank/ai-dev-tasks, coleam00/context-engineering-intro, gsd-build/get-shit-done, Priivacy-ai/spec-kitty, agents.md, code.claude.com/docs (plugins/marketplaces), blog.modelcontextprotocol.io (MCP Apps, RC 2026-07-28), skills.github.com, starlight.astro.build, github.com/charmbracelet/vhs, asciinema.org, deeplearning.ai (curso SDD).
