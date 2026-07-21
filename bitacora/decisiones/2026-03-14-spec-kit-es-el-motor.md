# Decisión clave - Spec Kit es el motor; este template es la capa práctica y verificada a su alrededor / Key decision - Spec Kit is the engine, this template is the verified practical layer

## Date / Fecha

2026-03-14

## Context / Contexto

En marzo de 2026 el template tenía reglas de agente repartidas en archivos distintos (`.clauderules`, `.cursorrules`, `.github/copilot-instructions.md`, `AGENTS.md`) y dos caminos de inicialización que no coincidían. La pregunta de fondo era si el template debía **generar sus propias specs** o **apoyarse en un motor externo** ya adoptado.

Conviene decirlo antes de seguir: esta decisión **se tomó en commits, no en una spec**. La primera spec numerada del repositorio (`specs/001-sdd-mcp-foundation/spec.md`) aparece el 2026-03-18 (commit `9a314e8`), cuatro días después, y no hay entrada de bitácora diaria de marzo — la más antigua es `bitacora/diaria/2026-07-17.md`. La reconstrucción de abajo sale de git, CHANGELOG y del plan escrito ese mismo día.

## Decision / Decisión

Estandarizar un flujo **«Spec Kit-first»** en lugar de competir como otro motor de specs. Concretamente, en el commit `f115f2b` (2026-03-14 09:26:57 -0500, «feat: standardize spec-kit-first workflow and enforce sdd gate»):

1. **El motor es `specify` (github/spec-kit).** `scripts/init-project-with-spec-kit.sh:34-47` intenta en orden: `specify` ya instalado → `uv tool install specify-cli --from git+https://github.com/github/spec-kit.git` → `uvx --from git+... specify init`. Si no hay ninguno, falla con instrucciones en vez de improvisar un motor propio.
2. **Una sola fuente canónica de conducta de agente:** `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`. Todo archivo de reglas debe apuntar ahí. El marcador `agent_rule_markers.canonical_source` vive en `sdd.policy.yaml:63` y lo verifica `scripts/check-sdd-policy.sh:106` sobre cada archivo de reglas. (Precisión: el marcador se consolidó en el commit `b7a4227`, del mismo día a las 10:23:51, una hora después de `f115f2b`.)
3. **Compuerta antes de codificar:** se añade `scripts/check-sdd-gate.sh` (184 líneas hoy) y CI pasa a correr `./scripts/validate-sdd.sh . --strict` **y** `./scripts/check-sdd-gate.sh .` (CHANGELOG v1.0.1, líneas 390-399).

El mismo commit crea `template-context/09-SPECKIT-STANDARDIZATION-PLAN.md`, descrito en el CHANGELOG v1.0.1 como «phased roadmap to evolve into a Spec Kit-centered framework», cuyo North Star es que *cualquier* agente recorra el mismo camino lineal SDD.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Construir un motor de specs propio** | Es la alternativa que la decisión descarta de hecho. No quedó registrada por escrito en marzo — **esto es reconstrucción, no cita**. El sustento explícito llega cuatro meses después: `idea/PROPUESTAS_2026-07-17.md:12` documenta que github/spec-kit ya tenía ~122k estrellas y un marketplace de 138 extensiones y 25 presets. Competir contra eso con un motor nuevo no tenía retorno. |
| **Depender de Spec Kit sin capa propia** | Deja fuera lo que Spec Kit no da: compuerta verificada por scripts, bilingüismo, sidecar `spec/`, MCP propio. La investigación del 2026-07-17 concluye que el espacio desocupado es la **educación y la disciplina verificada**, no el motor. |

## Consequences / Consecuencias

**A favor**
- Todo el valor propio se concentra donde no hay competencia: compuerta verificada por scripts, bilingüismo, sidecar y MCP.
- Una sola fuente canónica hace que las reglas de agente sean auditables por CI en vez de convención.

**Costos aceptados**
- **Dependencia de un proyecto externo** para el motor de specs: si Spec Kit cambia comandos o dirección, el template debe seguirle el paso.
- Ese costo ya se pagó una vez: el 2026-07-17 (commit `ba0ae59`, «docs: align template with SDD 2026 state of the art») hubo que actualizar la guía 08 EN/ES a los comandos vigentes `clarify` / `analyze` / `checklist` / `taskstoissues` (ver `docs/es/08-integracion-github-spec-kit.md:47,52`).

**Re-confirmación posterior**
- `idea/PROPUESTAS_2026-07-17.md:127`: «Spec Kit es el motor, este template es donde se aprende y se aplica con disciplina verificada. Nadie más ocupa ese espacio en español.»
- `bitacora/global/PROJECT_LOG.md:73` (Sesión 3, 2026-07-17): «Template positioning confirmed: practical layer around GitHub Spec Kit, spec-anchored model, bilingual teaching + sidecar application».

**Estado**
- Vigente. No fue superada por ninguna decisión posterior.

**Cuándo revisar esta decisión**
- Si github/spec-kit se archiva, cambia de licencia, o rompe compatibilidad de forma que `scripts/init-project-with-spec-kit.sh` deje de funcionar en sus tres caminos (`specify` / `uv tool install` / `uvx`).
- Si mantener alineadas las guías 08 EN/ES con los comandos de Spec Kit empieza a costar más que el valor que aporta el motor (segundo o tercer episodio como el del 2026-07-17).
- Si aparece un motor de specs con adopción comparable y mejor encaje bilingüe, o si Spec Kit absorbe la capa propia (compuerta verificada, sidecar, bilingüismo) y deja de haber diferencial.
- Si las fases del `09-SPECKIT-STANDARDIZATION-PLAN.md` quedan cumplidas o abandonadas: en ambos casos el plan deja de describir el estado real y hay que reemplazarlo.
