<div align="center">

<img src="./docs/assets/social-preview.svg" alt="Spec-Driven Development Template" width="720">

# 🌱 Spec-Driven Development Template

**Aprende Spec-Driven Development y aplícalo en proyectos reales —<br>con la IA como copiloto y una regla de oro, verificada por máquina.**

[🇺🇸 English](./README.md) · 🇪🇸 **Español**

<img src="https://img.shields.io/badge/version-v1.7.0-3b82f6?style=for-the-badge" alt="Versión">
<img src="https://img.shields.io/badge/licencia-PolyForm_NC-8b5cf6?style=for-the-badge" alt="Licencia">
<a href="https://github.com/juanklagos/spec-driven-development-template/releases/tag/v1.7.0"><img src="https://img.shields.io/badge/release-latest-10b981?style=for-the-badge" alt="Último release"></a>

<a href="https://juanklagos.github.io/spec-driven-development-template/es/"><img src="https://img.shields.io/badge/📖_Sitio_de_Docs-Navegar-0ea5e9?style=for-the-badge" alt="Sitio de documentación"></a>
<a href="https://github.com/juanklagos/aprende-sdd"><img src="https://img.shields.io/badge/🎓_Curso-Aprende_haciendo-16a34a?style=for-the-badge" alt="Curso interactivo"></a>
<a href="https://github.com/marketplace/actions/sdd-validate"><img src="https://img.shields.io/badge/✅_Action-Marketplace-2088FF?style=for-the-badge&logo=githubactions&logoColor=white" alt="SDD Validate en GitHub Marketplace"></a>
<a href="https://codespaces.new/juanklagos/spec-driven-development-template"><img src="https://img.shields.io/badge/⚡_Codespaces-Abrir-181717?style=for-the-badge&logo=github" alt="Abrir en GitHub Codespaces"></a>

[Inicio no técnico](./START_HERE_NON_TECH.md) · [Quickstart](./QUICKSTART.md) · [Inicio para agentes IA](./AI_START_HERE.md) · [Comandos](#️-comandos-integrados-para-tu-agente-de-ia) · [Comunidad](#-comunidad)

</div>

---

## 🌟 ¿Qué es esto?

**Spec-Driven Development (SDD)** significa escribir y aprobar una especificación clara *antes* de escribir código — para que las decisiones, el alcance y la calidad sobrevivan más allá de una ventana de chat. En 2026 es la práctica dominante para construir software con agentes de IA.

Este repositorio es **dos cosas a la vez**:

|  | 🎓 Una escuela | 🧰 Una caja de herramientas |
| :--- | :--- | :--- |
| **Qué** | Ruta bilingüe (EN/ES) por niveles para aprender SDD desde cero | Estructura lista para aplicar SDD en proyectos reales |
| **Cómo** | Guías, curso interactivo, tutor conversacional | Scripts de cumplimiento, reglas para agentes, servidor MCP, sidecar compacto `spec/` |
| **Para quién** | Incluso si no programas | Devs solos, equipos y agentes de IA |

Usa [GitHub Spec Kit](https://github.com/github/spec-kit) como motor de flujo de referencia; este repo es la capa práctica a su alrededor.

<div align="center">

**El flujo en acción** — crear una spec, validar, pasar la compuerta *(regenerado en cada release)*:

<img src="./docs/assets/demo.gif" alt="Demo del flujo SDD: crear una spec, validar la estructura, pasar la compuerta" width="720">

</div>

| ❌ Sin SDD | ✅ Con este template |
| :--- | :--- |
| Decisiones perdidas en chats | Fuente única de verdad en `specs/` |
| Código sin planeación | Compuerta obligatoria `spec.md` + `plan.md`, verificada por máquina |
| Onboarding difícil para equipo/IA | Estructura estándar y guías por nivel |
| Trazabilidad débil | Registro de sesiones en `bitacora/`, historia por spec |

> 🔭 ¿Quieres el mapa de la industria? Lee [SDD en 2026: estado del arte y cómo se compara este template](./docs/es/50-estado-del-arte-sdd-2026.md).

## 🚪 Elige tu puerta

| Tú eres... | Empieza aquí | Qué obtienes |
| :--- | :--- | :--- |
| 🧑‍💼 **No técnico** (fundador, PM, curioso) | [START_HERE_NON_TECH.md](./START_HERE_NON_TECH.md) | Inicio guiado ultra simple, sin jerga |
| 👩‍💻 **Desarrollador** | [QUICKSTART.md](./QUICKSTART.md) | Comandos para crear y validar en 5 minutos |
| 🤖 **Agente de IA** (o tú, pegándolo en uno) | [AI_START_HERE.md](./AI_START_HERE.md) | Reglas operativas + prompts copy/paste por nivel |

Luego elige tu nivel — cada guía del [sitio de docs](https://juanklagos.github.io/spec-driven-development-template/es/) lleva su badge de nivel:

- 🟢 Básico: [guía rápida para no programadores](./docs/es/13-guia-rapida-no-programadores.md)
- 🟡 Intermedio: [guía de disciplina en equipo](./docs/es/14-guia-intermedia.md)
- 🔴 Avanzado: [gobernanza y estandarización](./docs/es/15-guia-avanzada.md)

> [!TIP]
> ¿Prefieres aprender haciendo? Toma el **[curso interactivo](https://github.com/juanklagos/aprende-sdd)** (formato GitHub Skills): 4 pasos, ~35 min, corregido automáticamente por Actions — terminas con la compuerta SDD real como examen.

## ⚡ Empieza en 30 segundos

Copia y pega este prompt en tu asistente de IA (Claude, Cursor, Copilot, Gemini...):

```text
Usando https://github.com/juanklagos/spec-driven-development-template, guíame paso a paso con SDD para mi proyecto.
Mi proyecto es: [explica tu proyecto en lenguaje simple].
Si mi proyecto es nuevo, inicializa desde este template y GitHub Spec Kit como flujo base.
Si ya existe, adáptalo sin romper el comportamiento actual.
No hay código sin spec aprobada y plan consistente.
```

## 🎛️ Comandos integrados para tu agente de IA

Si usas **Claude Code**, este repo trae slash commands listos — empieza con `/sdd:help`:

| Comando | Qué hace |
| :--- | :--- |
| `/sdd:help` | Diagnostica tu etapa actual y te da el único siguiente paso |
| `/sdd:new` | Inicio guiado: idea → primera spec lista para aprobar |
| `/sdd:spec` | Crea o refina un paquete de spec con criterios EARS |
| `/sdd:gate` | Ejecuta la compuerta verificada por máquina y registra tu consentimiento |
| `/sdd:close` | Valida y cierra la sesión con el contrato de salida |
| `/sdd:tutor` | Curso conversacional de SDD por niveles, corregido por los scripts de validación reales |

**Instálalo en cualquier proyecto como plugin** (sin clonar):

```text
/plugin marketplace add juanklagos/spec-driven-development-template
/plugin install sdd@sdd-template
```

- **VS Code / Copilot:** los mismos flujos como prompt files en [`.github/prompts/`](./.github/prompts/).
- **Cualquier agente (32+ herramientas):** Agent Skill portable en [skills/sdd-workflow/SKILL.md](./skills/sdd-workflow/SKILL.md).
- **Contexto para IA:** [llms.txt](./llms.txt) indexa toda la documentación para agentes de código (regenéralo con `./scripts/generate-llms-txt.sh`).

## 🚨 La regla de oro

> [!IMPORTANT]
> **No hay código sin `spec.md` aprobada y `plan.md` consistente.**
> No es solo prosa — se verifica por máquina, y la implementación solo empieza tras registrar tu consentimiento.

```bash
./scripts/check-sdd-policy.sh .   # los archivos de política multi-agente están alineados
./scripts/check-sdd-gate.sh .     # spec aprobada + plan consistente + consentimiento registrado
./scripts/confirm-user-consent.sh "Usuario aprobó alcance X"
```

(En proyectos sidecar los mismos scripts viven bajo `./spec/scripts/`.)

Exígela también en CI — este repo funciona además como GitHub Action, listada en el [GitHub Marketplace](https://github.com/marketplace/actions/sdd-validate):

```yaml
- uses: juanklagos/spec-driven-development-template@v1.7.0
  with:
    path: "."      # raíz del proyecto (sidecar o standalone, autodetectado)
    strict: "true"
```

Archivos de referencia: [sdd.policy.yaml](./sdd.policy.yaml) · [INSTRUCTIONS.md](./INSTRUCTIONS.md) · [AGENT_OPERATING_SYSTEM.md](./template-context/core-instructions/AGENT_OPERATING_SYSTEM.md)

## 🎬 Cómo funciona

```mermaid
flowchart LR
  A["💡 Idea en lenguaje simple"] --> B["📋 spec.md aprobada"]
  B --> C["🗺️ plan.md consistente"]
  C --> D["✅ tasks.md priorizadas"]
  D --> E["🚦 Compuerta + consentimiento"]
  E --> F["⚙️ Implementación"]
  F --> G["🔍 Validación + bitácora"]
```

Cada feature recibe un paquete de spec numerado, y cada sesión deja rastro en `bitacora/`:

1. `spec.md` — qué y por qué *(aprobada por ti)*
2. `plan.md` — cómo *(consistente con la spec)*
3. `tasks.md` — pasos concretos
4. `history.md` — cómo evolucionó

Ejemplo completo de inicio a fin: [examples/002-mcp-end-to-end](./examples/002-mcp-end-to-end/README.md)

## 🧭 Aplícalo en un proyecto real

**El inicio más rápido (sin clonar nada):**

```bash
npx @juanklagos/create-sdd-project mi-app
```

Crea interactivamente el sidecar `spec/` recomendado (o un workspace completo) desde la última versión del template.

Tres formas de usar el template, de la más ligera a la más pesada:

| Modo | Cuándo | Comando |
| :--- | :--- | :--- |
| **Sidecar compacto `spec/`** ⭐ | Proyecto real o existente: artefactos SDD en `./spec/`, el código queda en la raíz | `./scripts/install-spec-sidecar.sh /ruta/al/proyecto --profile=recommended` |
| **Workspace interno `www/`** | El proyecto ejecutable debe vivir dentro de este repositorio template | `./scripts/create-www-project.sh mi-proyecto codex` |
| **Copia standalone completa** | Quieres explícitamente todo el framework como workspace | `./scripts/init-project.sh /ruta/al/proyecto --profile=full` |

> [!TIP]
> Ruta profesional por defecto: instala solo el sidecar compacto `spec/`. Nunca copies el framework completo dentro de un codebase real salvo que quieras explícitamente el modo standalone.

<details>
<summary><b>📟 Comandos del día a día</b> (modo sidecar; los mismos scripts existen en la raíz en modo standalone)</summary>

<br>

| Acción | Comando |
| :--- | :--- |
| Nueva spec | `./spec/scripts/new-spec.sh "mi-feature" "Responsable"` |
| Validar estructura | `./spec/scripts/validate-sdd.sh . --strict` |
| Chequeo de política | `./spec/scripts/check-sdd-policy.sh .` |
| Compuerta SDD | `./spec/scripts/check-sdd-gate.sh .` |
| Dashboard de estado | `./spec/scripts/generate-status.sh` |

Anatomía de carpetas y detalles de layout: [mapa de organización del proyecto](./docs/es/42-mapa-organizacion-proyecto.md)

```mermaid
flowchart TD
  A["Raíz de tu proyecto (código)"] --> B["spec/"]
  B --> C["idea/"]
  B --> D["specs/ (paquetes numerados)"]
  B --> E["bitacora/"]
  B --> F["scripts/ (compuerta + validación)"]
```

</details>

<details>
<summary><b>🔌 Conéctalo por MCP</b> (opcional, avanzado)</summary>

<br>

Si tu cliente de IA soporta MCP, este repo incluye un servidor local `sdd-mcp` que convierte el flujo SDD en comandos guiados (`/start-project`, `/create-spec ...`).

```bash
npm install
npm run build
npm run mcp:start
```

- **¿Sin clonar?** Apunta tu cliente MCP directo a npm: `{"command": "npx", "args": ["-y", "@juanklagos/sdd-mcp"]}`.
- **🎨 SDD Builder (visual, arrastrar y soltar):** compila una vez con `npm run builder:build`, luego `npm run mcp:http:start` y abre `http://127.0.0.1:3334/builder` — construye tus specs como tarjetas conectadas; cada tarjeta es un bundle real `specs/NNN/` en disco.
- **Dashboard visual:** corre `npm run mcp:http:start` y abre `http://127.0.0.1:3334/dashboard` — una vista ejecutiva de solo lectura del workspace (estado de la compuerta, tarjetas KPI, progreso por spec y avisos de dependencias) en tu idioma, sin compilar nada.
- La explicación más simple primero: [Guía fácil de MCP](./docs/es/43-guia-mcp-facil.md)
- Configuraciones por cliente: [`.mcp.json`](./.mcp.json) (Claude Code) · [Cursor](./packages/sdd-mcp/examples/.cursor/mcp.json) · [Codex](./packages/sdd-mcp/examples/codex.config.toml)
- Referencia completa: [docs/es/41-referencia-completa-mcp.md](./docs/es/41-referencia-completa-mcp.md)

Nota: `GitMCP` (gratis, remoto) ayuda a una IA a *leer* este repo público; el `sdd-mcp` local ejecuta el *flujo guiado real*. Se complementan: [guía GitMCP](./docs/es/48-como-conectar-este-repo-con-gitmcp.md).

</details>

## 📚 Documentación

**Navega online:** el [sitio de documentación](https://juanklagos.github.io/spec-driven-development-template/es/) tiene todas las guías con búsqueda, selector de idioma EN/ES y badges de nivel.

**Tres lecturas esenciales:**

1. [Flujo de trabajo](./docs/es/02-flujo-de-trabajo.md) — el flujo SDD paso a paso
2. [Estructura](./docs/es/01-estructura.md) — para qué sirve cada carpeta
3. [SDD en 2026: estado del arte](./docs/es/50-estado-del-arte-sdd-2026.md) — el mapa de la industria y dónde está este template

**Todo lo demás:** el [índice completo de documentación](./docs/README.md) organiza las 51 guías (EN/ES) por tema.

## 💬 Comunidad

- 📖 Sitio de docs: [juanklagos.github.io/spec-driven-development-template](https://juanklagos.github.io/spec-driven-development-template/es/)
- 💬 Preguntas, ideas, muestra tu proyecto: [GitHub Discussions](https://github.com/juanklagos/spec-driven-development-template/discussions)
- 🐛 Bugs y propuestas concretas: [Issues](https://github.com/juanklagos/spec-driven-development-template/issues)
- 🎓 Curso interactivo: [aprende-sdd](https://github.com/juanklagos/aprende-sdd) — aprende haciendo, corregido por Actions
- 🏅 ¿Terminaste un nivel del tutor? `/sdd:tutor` lo registra en tu bitácora y te da un badge de completación para tu README

## ⚖️ Legal y autoría

- Licencia: PolyForm Noncommercial 1.0.0 — [marco legal](./docs/es/31-marco-legal-y-uso-comercial.md)
- Historial: [CHANGELOG.md](./CHANGELOG.md) · Último release: [v1.5.0](https://github.com/juanklagos/spec-driven-development-template/releases/tag/v1.7.0)
- Autor: Juan Klagos ([AUTHORS.md](./AUTHORS.md))

---

<div align="center">

**Si este template te ayuda a construir con disciplina, dale una ⭐ al repo — ayuda a que otros lo encuentren.**

🌱 *No hay código sin spec aprobada y plan consistente.*

[⬆️ Volver arriba](#-spec-driven-development-template)

</div>
