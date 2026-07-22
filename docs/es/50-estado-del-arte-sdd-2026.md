# SDD en 2026: estado del arte y cómo se compara este template

> Corte de investigación: 2026-07-17. Las fuentes están al final.
> Objetivo: que aprendas cómo se ve Spec-Driven Development en la industria hoy, y veas exactamente dónde está parado este template.

---

## 1. Dónde está el SDD en 2026

Entre 2025 y 2026, Spec-Driven Development pasó de idea emergente a práctica dominante de la ingeniería asistida por IA. GitHub, AWS, Anthropic, Cursor y Google ofrecen alguna variante del flujo `spec -> plan -> tareas -> implementación`. Los patrones que se consolidaron: archivos de constitución/steering, criterios de aceptación en notación EARS, specs compactas (1-3 páginas) con "fuera de alcance" explícito, compuertas de revisión humana entre fases y trazabilidad de la spec al commit. Donde la comunidad ha terminado asentándose es en el desarrollo **spec-anchored**: la spec sobrevive a la feature y evoluciona junto al código.

## 2. Los tres niveles de SDD (taxonomía de referencia)

Taxonomía de Birgitta Böckeler (Thoughtworks) en martinfowler.com, adoptada ya por la literatura académica:

| Nivel | Significado | Estado en 2026 |
| :--- | :--- | :--- |
| **Spec-first** | La spec guía una tarea y luego se descarta | Común, baja ceremonia |
| **Spec-anchored** | La spec sobrevive y la feature evoluciona a través de ella | **Lo que mejor funciona hoy** — lo que implementa este template |
| **Spec-as-source** | Solo se edita la spec; el código es un artefacto compilado | Sigue siendo promesa (Tessl Framework nunca llegó a GA) |

## 3. Comparativa de herramientas principales

| Herramienta | Enfoque | Elementos distintivos | Estado (mediados 2026) |
| :--- | :--- | :--- | :--- |
| **GitHub Spec Kit** | CLI + slash commands | `/speckit.constitution` -> `specify` -> `clarify` -> `plan` -> `tasks` -> `analyze` -> `implement`; 30+ agentes; bundles, extensiones, presets, flujos brownfield | ~122k estrellas, implementación de referencia |
| **AWS Kiro** | IDE + CLI | `requirements.md` (EARS) + `design.md` + `tasks.md`; steering files; property-based testing para verificar el código contra la spec | GA desde nov 2025; reemplaza a Amazon Q Developer |
| **OpenSpec** | Ligero, agnóstico de proveedor | proposal -> specs -> design -> tasks -> archive, todo en markdown dentro del repo | En el Radar de Thoughtworks |
| **BMAD-METHOD** | Personas multi-agente | Equipo ágil simulado (PM, arquitecto, dev, QA); ecosistema de módulos v6 | ~49k estrellas |
| **Tessl** | Spec-as-source | Spec Registry (10k+ specs versionadas de librerías) | Framework en beta cerrada; la empresa pivotó a skills de agentes |
| **Agent OS** | Inyección de estándares | Descubre patrones del codebase, los documenta como estándares y los inyecta al plan mode | v3, fuerte en brownfield |
| **spec-workflow-mcp** | Servidor MCP | Flujo de specs + dashboard web en tiempo real para cualquier cliente MCP | Sucesor activo de claude-code-spec-workflow |

Dónde se ubica este template: **una capa práctica alrededor de GitHub Spec Kit** — estructura inicial, guía bilingüe para personas no técnicas, archivos de reglas multi-agente, un servidor `sdd-mcp` local y una compuerta de cumplimiento (política + scripts) que la mayoría de herramientas deja como simple convención.

## 4. Mejores prácticas consolidadas vs. este template

| Práctica consolidada (2026) | Este template | Dónde |
| :--- | :---: | :--- |
| Constitución / steering commiteada antes de la primera spec | ✅ | `sdd.policy.yaml`, `AGENT_OPERATING_SYSTEM.md`, `/speckit.constitution` en el flujo |
| Compuertas humanas entre fases (nunca de spec directo a código) | ✅ | Hard stop + `check-sdd-gate.sh` + consentimiento registrado |
| Spec-anchored: la spec sobrevive y evoluciona | ✅ | Bundle `specs/NNN-*/` con `history.md` por spec |
| Specs compactas, fuera-de-alcance explícito | ✅ | La plantilla de spec incluye alcance/fuera de alcance; el modo sidecar la mantiene ligera |
| Trazabilidad spec -> sesión -> commit | ✅ | Bitácora, `history.md`, `specs/INDEX.md` |
| AGENTS.md como estándar de facto de contexto para agentes (60k+ repos, gobernado por la Linux Foundation) | ✅ | `AGENTS.md` + archivos de reglas por agente |
| MCP como capa de integración universal | ✅ | `packages/sdd-mcp` (stdio + HTTP), recetas por cliente |
| Flujos brownfield / proyecto existente | ✅ | Instalación sidecar `spec/` + guía de migración legacy |
| **Notación EARS para criterios de aceptación** ("WHEN ... THE SYSTEM SHALL ...") | ✅ | Se enseña en la guía 12 (TDD/BDD/EARS) con un bloque EARS en la plantilla de spec |
| **Análisis de consistencia antes de implementar** (`/speckit.analyze`, `/speckit.checklist`) | ✅ | Los scripts de gate verifican aprobación/consistencia; la guía 08 documenta los comandos analyze/checklist actuales |
| **Specs ejecutables / property-based testing** (estilo Kiro) | ❌ Aún no | Oportunidad: derivar propiedades de test desde los criterios de aceptación |
| **Integración tareas -> issues** (`/speckit.taskstoissues`) | ❌ Aún no | Oportunidad para modo equipo |

O sea: el núcleo está cubierto. Lo que falta son las dos filas con ❌ — derivar propiedades de test desde los criterios de aceptación, y convertir `tasks.md` en issues.

## 5. Críticas que debes conocer (y cómo responde este template)

| Crítica | Respuesta de la comunidad | Este template |
| :--- | :--- | :--- |
| "SDD es waterfall con más tokens" | El ciclo spec->código que tomaba meses ahora toma minutos; iterar sigue siendo barato (Marc Brooker, AWS) | Las specs son por feature e iterativas; `history.md` registra la evolución |
| Spec drift: código y spec divergen | Tratar las specs como interfaces vivas compartidas | Scripts de validación + contrato de cierre de sesión fuerzan el realineamiento |
| Fatiga de markdown / demasiada ceremonia | Specs compactas; omitir SDD en prototipos desechables | El modo sidecar es compacto por diseño; las guías dicen cuándo *no* usar el modo completo |
| Los agentes ignoran la spec | Compuertas + tareas pequeñas + consentimiento explícito | La aprobación, la consistencia del plan y el consentimiento se verifican por máquina; la compuerta declara en cada ejecución qué comprobó y qué no |

Thoughtworks aún ubica SDD en **Assess** (no Adopt): vale la pena explorar, los flujos son opinados y no hay consenso sobre el flujo óptimo. Enseñar esto con honestidad es parte del trabajo de este template.

## 6. Próximos pasos recomendados para este template

Corto plazo — ✅ hecho (2026-07-17):
1. ✅ Notación EARS enseñada en la guía de escritura de specs ([12-tdd-y-bdd-como-escribir-specs](./12-tdd-y-bdd-como-escribir-specs.md)) con un bloque EARS en la plantilla de spec.
2. ✅ Comandos actuales de Spec Kit (`/speckit.clarify`, `/speckit.analyze`, `/speckit.checklist`, `/speckit.taskstoissues`) documentados en la [guía de integración con Spec Kit](./08-integracion-github-spec-kit.md).
3. ✅ Este documento enlazado desde el README.

Mediano plazo (abierto):
4. Sección opcional de "propiedades de la spec" en la plantilla `spec.md` (puente hacia specs ejecutables).
5. Modo equipo: script o guía para convertir `tasks.md` en issues de GitHub (el comando `/speckit.taskstoissues` ya está documentado; falta un flujo nativo del template).
6. Seguir el modelo de bundles/extensiones/presets de Spec Kit para estándares organizacionales.

## 7. Fuentes

- Spec Kit: <https://github.com/github/spec-kit> · <https://github.github.com/spec-kit/>
- Kiro: <https://kiro.dev/docs/specs/> · <https://kiro.dev/blog/general-availability/> · <https://kiro.dev/blog/property-based-testing/>
- Taxonomía y crítica: <https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>
- Radar de Thoughtworks: <https://www.thoughtworks.com/en-us/radar/techniques/spec-driven-development> · <https://www.thoughtworks.com/en-us/radar/tools/openspec>
- Debate waterfall: <https://news.ycombinator.com/item?id=45935763> · <https://brooker.co.za/blog/2026/04/09/waterfall-vs-spec.html> · <https://yuvalyeret.com/blog/spec-driven-development-isnt-waterfall-unless-youre-using-it-that-way/>
- OpenSpec: <https://github.com/Fission-AI/openspec> · BMAD: <https://github.com/bmad-code-org/bmad-method> · Tessl: <https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/>
- Agent OS: <https://github.com/buildermethods/agent-os> · spec-workflow-mcp: <https://github.com/Pimzino/spec-workflow-mcp>
- Estándar AGENTS.md: <https://agents.md/>
- Adopción enterprise: <https://www.infoq.com/articles/spec-driven-development/> · <https://www.infoq.com/articles/enterprise-spec-driven-development/>
- Marco académico: <https://arxiv.org/abs/2602.00180>
- Curso: <https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents>
