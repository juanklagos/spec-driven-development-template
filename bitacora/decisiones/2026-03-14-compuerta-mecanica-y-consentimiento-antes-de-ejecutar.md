# Decisión clave - La compuerta se verifica por máquina y el consentimiento es un archivo en disco / Key decision - Machine-checked gate, consent on disk, enforced at execution

## Date / Fecha

2026-03-14

## Context / Contexto

El hard stop del template ("no hay código sin spec aprobada y plan consistente") vivía solo como prosa repartida en los archivos de reglas de cada agente. Una regla que solo existe en prosa **la interpreta cada agente a su manera y no falla nunca**: no hay nada que se pueda ejecutar en CI ni nada que quede como rastro.

Reconstrucción: los cuatro commits de esta decisión caen en **menos de una hora** del 2026-03-14 (10:23 → 11:19), incluidos un descubrimiento de portabilidad a los 3 minutos y una marcha atrás a los 9.

## Decision / Decisión

Dos partes, tomadas el mismo día:

**1) La compuerta se codifica y se verifica por máquina.**
`b7a4227` (2026-03-14 10:23:51 -0500, *"policy: enforce multi-agent SDD rules with centralized gate and checks"*) crea `sdd.policy.yaml` (+51) y `scripts/check-sdd-policy.sh` (+86), engancha `check-sdd-gate.sh` y `validate-sdd.sh`, y propaga la misma regla a los archivos de reglas de agente (`.clauderules`, `.cursorrules`, `AGENTS.md`, `AIDER.md`, `GEMINI.md`, `ROO.md`, `WINDSURF.md`, `.github/copilot-instructions.md`, `CLAUDE.md`, `INSTRUCTIONS.md`): 20 archivos, +328/−36. La política es legible por máquina — `sdd.policy.yaml:30-32` (`hard_stop.no_code_before_spec_approved: true`) y `sdd.policy.yaml:24-25` (`user_consent.required_before_execution_after_spec_approval: true`).

El consentimiento del usuario deja de ser una afirmación en el chat y pasa a ser **una entrada anexada y con timestamp en `.sdd/user-consent.log`**. Si existe cualquier spec aprobada y el log falta o está vacío, `scripts/check-sdd-gate.sh:173` falla con `Missing or empty user consent log (.sdd/user-consent.log) for approved spec execution`. Ambos checks corren en CI (`.github/workflows/validate.yml:45-52`).

**2) La exigencia vive en el borde de EJECUCIÓN, no en el de creación de la spec.**
`cd01c5d` (11:10:30 -0500) exigía consentimiento **antes de crear specs** y metía 15 líneas de bloqueo en `scripts/new-spec.sh`. Nueve minutos después, `bbf0390` (11:19:28 -0500, *"fix(flow): build SDD base first and require consent only before execution"*) borra 8 de esas líneas de bloqueo, mueve +12 a `check-sdd-gate.sh`, cambia la clave de política de `required_before_spec_creation` a `required_before_execution_after_spec_approval`, mueve el comando de consentimiento del paso 5 al paso 6 de `QUICKSTART.md` y escribe la regla en `AI_START_HERE.md`: **crear la base SDD (`idea/spec/plan/tasks/bitacora`) no requiere consentimiento de ejecución.**

> No existe prosa del autor explicando el porqué de la marcha atrás. El motivo se reconstruye del asunto del commit y del diff: la primera versión bloqueaba justo el artefacto que la compuerta necesita para tener algo que evaluar. Nadie escribió esa frase en su momento.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Consentimiento al crear la spec** (`cd01c5d`) | Vivió ~9 minutos. Bloqueaba la escritura de la spec, es decir, el insumo de la propia compuerta |
| **Confiar en que el agente declare la aprobación en el chat** | Rechazado por construcción: el gate es shell y lee un archivo. Lo que no está en disco no existe para el verificador |
| **Dejar el hard stop solo como prosa en las reglas de agente** | Es el estado previo a `b7a4227`. No falla, no se audita y cada agente lo interpreta distinto |

## Consequences / Consecuencias

**A favor**
- La regla es ejecutable y falla en CI, no solo en la buena voluntad del agente.
- Queda rastro con timestamp de cada aprobación: la bitácora obtiene el dato en el momento en que ocurre.
- Un solo archivo (`sdd.policy.yaml`) es la fuente de verdad para 8+ archivos de reglas de agente.

**Costo aceptado y restricción derivada**
- **La capa de enforcement no puede tener dependencias más allá de POSIX shell.** El mismo día, `cab9e8d` (10:26:32 -0500, *"fix(ci): make policy and gate checks work without ripgrep"*) descubre que los scripts llamaban a `rg` directamente y los reescribe con un selector `SEARCH_BIN=rg|grep` (`scripts/check-sdd-gate.sh:20-24`) más envoltorios `match_q`, `match_qi`, `first_line_match`, `count_matches` (`scripts/check-sdd-gate.sh:40-79`). El patrón sigue vivo hoy. **Regla derivada: ripgrep es opcional, nunca requisito.**
  *No hay registro del entorno concreto que falló; el scope `fix(ci)` es la única pista.*
- Fricción real: implementar exige un comando extra (`./scripts/confirm-user-consent.sh "…"`) antes de escribir código.

**Extensión posterior (no supersede)**
- La misma regla se duplicó en TypeScript para el servidor MCP: `packages/sdd-core/src/index.ts:365` (`hasRecordedConsent`) y la constante de aprobación, con comentarios `KEEP IN SYNC` explícitos en `scripts/check-sdd-gate.sh:10-15` y un test que compara ambos lados sobre las mismas fixtures. La decisión no fue reemplazada: se replicó a un segundo runtime.

**Vigencia**
- **Vigente.** La semántica `required_before_execution_after_spec_approval` no ha cambiado desde `bbf0390`: es el único commit que la toca (`git log -S`).
- **Dogfooded.** `.sdd/user-consent.log` tiene 9 entradas reales entre 2026-03-18 y 2026-07-21, citando las palabras del propio autor: *"hazlo"*, *"continua con el resto"*, *"hazlo todos"*, *"has lo mejor a corto y largo plazo"*.

## Cuándo revisar esta decisión / When to revisit

- **Si el log de consentimiento se vuelve ritual.** Si aparecen entradas genéricas sin citar palabras del usuario, el archivo dejó de ser evidencia y pasó a ser trámite: hay que cambiar el mecanismo, no relajar la regla.
- **Si las dos implementaciones del gate divergen.** El día que shell y `packages/sdd-core` den veredictos distintos sobre la misma spec, hay que colapsar a una sola fuente en vez de mantener el `KEEP IN SYNC` a mano.
- **Si el borde de ejecución deja de ser nítido.** Con agentes que escriben spec e implementan en un mismo turno, "antes de ejecutar" puede perder sentido operativo y habría que anclar el consentimiento a otra señal.
- **Si un usuario real queda bloqueado creando su base SDD.** Sería síntoma de que la exigencia volvió a correrse hacia la izquierda, que es exactamente lo que `bbf0390` revirtió.
- **Si algún check llega a necesitar una dependencia no-POSIX.** Eso rompe la restricción derivada de `cab9e8d` y obliga a decidir de nuevo dónde vive el enforcement.
