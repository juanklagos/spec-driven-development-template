# Decisión clave - Licenciar como PolyForm Noncommercial 1.0.0 (source-available, no open source) / Key decision - License as PolyForm Noncommercial 1.0.0

## Date / Fecha

2026-03-12 (commit `6e63661`, 2026-03-12 16:00:53 -0500)

Registro reconstruido a posteriori (2026-07-21) a partir de commits y archivos: en su momento no se escribió.

## Context / Contexto

El repositorio nació con **MIT** (`5470032`, "Initial template release"): es el único predecesor que muestra `git log --follow -- LICENSE`.

**Hueco honesto — el motivo no está registrado en ninguna parte del repo.** El commit `6e63661` ("legal: adopt PolyForm Noncommercial and add commercial, trademark, enforcement, disclaimer, and CLA framework") **no tiene cuerpo**. El `CHANGELOG.md` nunca menciona PolyForm (`grep -ci polyform CHANGELOG.md` → 0); solo registra los efectos ("Legal framework with clear allowed/restricted use tables" en v1.0.0, "Legal files moved to `legal/`" en v1.0.1). La bitácora global solo anota el movimiento de archivos (`bitacora/global/PROJECT_LOG.md:24` y `:31`). No hay documento en `idea/` sobre licenciamiento.

Lo único documentado es el **modelo elegido**, no la motivación: `legal/LEGAL_OVERVIEW.md:5` lo describe como *"a noncommercial source-available model"*, y `README.md:249` declara la licencia enlazando la guía 31.

No se debe inventar el porqué. Hipótesis plausibles (¿monetización futura?, ¿protección contra reventa del template?) **no tienen fuente** y quedan como hipótesis, no como registro.

## Decision / Decisión

Abandonar MIT y adoptar **PolyForm Noncommercial 1.0.0**, con un marco legal completo alrededor, todo en el mismo commit `6e63661` (15 archivos, +448 líneas):

- `LICENSE`: se borra el texto MIT completo (21 líneas) y se sustituye por PolyForm (131 líneas).
- Marco legal nuevo: `COMMERCIAL_LICENSE.md`, `TRADEMARK_POLICY.md`, `ENFORCEMENT.md`, `DISCLAIMER.md`, `CLA.md`, `NOTICE`, `LEGAL_OVERVIEW.md` — los seis primeros movidos a `legal/` en `775ad86` (2026-03-14); `LICENSE` y `NOTICE` se quedan en la raíz por convención de GitHub.
- Guía bilingüe 31: `docs/es/31-marco-legal-y-uso-comercial.md` y `docs/en/31-legal-framework-and-commercial-use.md`.

Regla operativa: **el uso comercial exige autorización escrita explícita del autor** (`NOTICE`, `legal/COMMERCIAL_LICENSE.md`).

## Alternatives considered / Alternativas consideradas

| Alternativa | Estado según la evidencia |
|---|---|
| **MIT** | Era la licencia vigente y fue **eliminada activamente**: el diff de `6e63661` sobre `LICENSE` borra el texto MIT íntegro. Es la única alternativa demostrable. |
| Cualquier otra (Apache-2.0, BSL, AGPL, Elastic, dual-license…) | **Sin evidencia.** No aparecen mencionadas en commits, docs ni `idea/`. No se puede afirmar que se evaluaran. |

## Consequences / Consecuencias

**Aplicación consistente (verificada)**
- `.claude-plugin/plugin.json:10`, `packages/sdd-mcp/package.json:41`, `packages/sdd-core/package.json:37` y `packages/create-sdd-project/package.json:34` declaran todos `"PolyForm-Noncommercial-1.0.0"`.

**Costos descubiertos cuatro meses después — la parte valiosa de este registro**

`idea/EVALUACION_DESKTOP_2026-07-21.md` §2.4 (línea 71) establece con fuente primaria:

- **PolyForm Noncommercial no es OSI-approved** — su restricción no comercial viola la cláusula de no discriminación por campo de uso. El proyecto es *source-available*, no open source.
- Por eso la **firma de código gratuita de SignPath Foundation no aplica**: sus términos exigen *"an OSI-approved Open Source license"* (https://signpath.org/terms.html). Cualquier app de escritorio tendría que pagar certificado completo.
- El mismo documento (línea 239) anota que la licencia **encaja mal con una variante SaaS hospedada**.

Ambos puntos pesaron como bloqueadores en `bitacora/decisiones/2026-07-21-no-app-escritorio.md:48` y `:34`.

**Vigencia**
- **Vigente.** No hay decisión posterior que la revierta. La evaluación de 2026-07-21 expone el costo (pérdida de beneficios exclusivos de OSI) pero **no reabre la elección de licencia**.

## Cuándo revisar esta decisión / When to revisit

- Si aparece un canal de distribución valioso que exija licencia OSI-approved (firma de código gratuita, Flathub, repositorios de distros, catálogos de proveedores).
- Si se decide construir una **variante hospedada / SaaS**, donde PolyForm encaja mal (`idea/EVALUACION_DESKTOP_2026-07-21.md:239`).
- Si aparecen contribuciones externas relevantes y el CLA (`legal/CLA.md`) se vuelve fricción real en vez de trámite.
- Si el objetivo del proyecto pasa de adopción a monetización, o al revés: la licencia actual optimiza para control, no para difusión.
- Si alguna vez se recupera el motivo original (nota, correo, conversación): **añadirlo aquí**, porque hoy este registro documenta la decisión sin poder documentar su razón.
