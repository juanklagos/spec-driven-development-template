# Decision log / Bitácora de decisiones

EN: One file per decision, `YYYY-MM-DD-<slug>.md`, written from `../templates/DECISION_TEMPLATE.md`.
ES: Un archivo por decisión, `YYYY-MM-DD-<slug>.md`, escrito desde `../templates/DECISION_TEMPLATE.md`.

Record a decision when **any** of these is true / Registra una decisión cuando se cumpla **alguna**:

- it chose between real alternatives / eligió entre alternativas reales;
- it will be expensive to reverse / revertirla será cara;
- a future reader would ask *"why is it like this?"* and the code would not answer / alguien preguntará después *"¿por qué es así?"* y el código no lo responde.

Every rationale points at a source: a commit hash + date, a `file:line`, a spec `history.md`, a `CHANGELOG.md` line, or a document in `idea/`. Where no written rationale exists, the record says so instead of inventing one.
Cada justificación apunta a una fuente. Donde no hay justificación escrita, el registro lo dice en vez de inventarla.

Capture one interactively with `/sdd:decision`. / Captura una conversando con `/sdd:decision`.

---

## Records / Registros

Chronological, oldest first. Dates come from git history, not from memory.
Cronológico, del más antiguo al más reciente. Las fechas vienen del historial de git.

### 2026-03-12 — [PolyForm Noncommercial 1.0.0](2026-03-12-polyform-noncommercial-source-available.md) · superseded 2026-07-21

- **ES:** Se abandona MIT y se adopta PolyForm Noncommercial 1.0.0 (source-available, no open source), con marco legal completo en `legal/`; el uso comercial exige autorización escrita.
- **EN:** MIT dropped for PolyForm Noncommercial 1.0.0 — source-available, not open source — with a full legal frame; commercial use needs written permission.

### 2026-03-14 — [Spec Kit es el motor](2026-03-14-spec-kit-es-el-motor.md)

- **ES:** El template no compite con GitHub Spec Kit: lo usa como motor y aporta la capa práctica verificada alrededor (una sola fuente canónica de conducta de agente + compuerta antes de codificar).
- **EN:** The template does not compete with GitHub Spec Kit — it runs on it and adds the verified practical layer around it.

### 2026-03-14 — [Compuerta mecánica y consentimiento antes de ejecutar](2026-03-14-compuerta-mecanica-y-consentimiento-antes-de-ejecutar.md)

- **ES:** La compuerta se verifica por máquina (`sdd.policy.yaml` + `check-sdd-policy.sh`) y el consentimiento pasa a ser un archivo en disco (`.sdd/user-consent.log`); nueve minutos después se mueve la exigencia del borde de *creación de spec* al de *ejecución*.
- **EN:** The gate becomes machine-checked and consent becomes a file on disk — enforced at execution, not at spec creation.

### 2026-03-18 — [`www/` recomendado, no obligatorio](2026-03-18-www-recomendado-no-obligatorio.md)

- **ES:** `www/<proyecto>` deja de ser raíz obligatoria y pasa a ser el valor por defecto recomendado; se permiten rutas destino externas. **Sin justificación escrita en su momento** — el registro lo declara y reconstruye desde el diff.
- **EN:** `www/` demoted from hard constraint to recommended default. No written rationale existed; the record says so.

### 2026-03-18 — [Separación `sdd-core` / `sdd-mcp`](2026-03-18-separacion-sdd-core-y-sdd-mcp.md)

- **ES:** El producto se parte en `packages/sdd-core` (lógica tipada) y `packages/sdd-mcp` (superficie MCP), con la raíz del repo intacta como framework canónico y MVP sobre stdio.
- **EN:** Split into typed core plus MCP surface, keeping the repo root as the canonical framework.

### 2026-03-19 — [Sidecar `spec/` para proyectos reales](2026-03-19-sidecar-spec-para-proyectos-reales.md)

- **ES:** Los proyectos reales instalan un sidecar compacto `spec/` en vez de clonar el template; la regla se escribe dentro del proyecto destino, no solo en la documentación.
- **EN:** Real projects install a compact `spec/` sidecar instead of cloning the template — and the installer writes that rule into the target project.

### 2026-07-17 — [Escuela bilingüe de SDD en tres niveles](2026-07-17-escuela-bilingue-de-sdd-en-tres-niveles.md)

- **ES:** Posicionamiento como «la escuela bilingüe de SDD que también es herramienta», ejecutado como specs 002 → 005 (skill portable, comandos `/sdd:*`, tutor, sitio, dashboard).
- **EN:** Positioned as the bilingual SDD school that is also a tool, executed as specs 002 → 005.

### 2026-07-20 — [Builder visual (Opción B), `.md` como fuente de verdad](2026-07-20-builder-visual-opcion-b-y-md-como-fuente-de-verdad.md)

- **ES:** Se construye el builder visual en su versión ambiciosa; los `.md` de las specs son la fuente de verdad y se editan quirúrgicamente, y solo el layout visual se persiste aparte en `specs/board.canvas` (JSON Canvas).
- **EN:** Build the visual builder (ambitious option); markdown stays the source of truth, only the canvas layout is persisted separately.

### 2026-07-20 — [Lógica en `sdd-core`, transportes finos](2026-07-20-logica-en-sdd-core-transportes-finos.md)

- **ES:** Toda la lógica compuesta vive en `sdd-core`; REST, MCP, `/builder` y `/dashboard` son superficies finas que consumen exactamente las mismas funciones. Cero lógica duplicada entre transportes.
- **EN:** All composed logic lives in `sdd-core`; REST, MCP, builder and dashboard are thin transports over the same functions.

### 2026-07-20 — [El builder no llama a ningún LLM](2026-07-20-builder-sin-llamadas-a-llm.md)

- **ES:** El asistente ✨ funciona con heurística local determinista y prompts copiables: sin API keys, sin llamadas de red. La IA real se delega al agente del usuario vía MCP.
- **EN:** Zero LLM calls — deterministic local heuristics plus copy-first prompts; real AI is delegated to the user's own agent over MCP.

### 2026-07-20 — [MCP App: postergada y luego con SDK oficial](2026-07-20-mcp-app-postergada-y-luego-con-sdk-oficial.md)

- **ES:** La MCP App se pospuso por creer que el estándar seguía moviéndose; 12 horas después se verificó que no, y se construyó con el SDK oficial. La pospuesta se revirtió **por evidencia, no por impaciencia**.
- **EN:** Postponed on a false premise, verified 12 hours later, then built with the official SDK — reversed by evidence, not impatience.

### 2026-07-21 — [Un solo idioma en la UI](2026-07-21-un-solo-idioma-en-la-ui.md)

- **ES:** La UI del producto abandona las etiquetas bilingües simultáneas y adopta i18n real. Revierte un criterio EARS de tres specs. El alcance es **solo la UI**: la documentación sigue bilingüe *por artefacto* (`docs/en/` + `docs/es/`).
- **EN:** The product UI drops simultaneous bilingual labels for real i18n. Docs stay bilingual per artifact — the reversal covers the UI only.

### 2026-07-21 — [Una sola regla de estado de spec](2026-07-21-una-sola-regla-de-estado-de-spec.md)

- **ES:** `specTone` en `sdd-core` calcula el estado una vez y todas las vistas solo lo pintan. La aprobación se evalúa primero: una spec con todas las tareas marcadas pero sin aprobar **nunca** es «Hecha».
- **EN:** One state rule computed once in `sdd-core`; approval is evaluated first, so an unapproved spec is never "done" no matter how many boxes are ticked.

### 2026-07-21 — [No construir app de escritorio (por ahora)](2026-07-21-no-app-escritorio.md)

- **ES:** El dolor real no eran los comandos sino que el builder no viaja en el paquete npm. Se elige lanzador de un comando → spike `.mcpb` → `.mcpb`; Electron queda diferido, no descartado.
- **EN:** The real pain was distribution, not commands: one-command launcher first, `.mcpb` next, Electron deferred but not discarded.

### 2026-07-21 — [La Action usa los scripts del consumidor](2026-07-21-action-usa-los-scripts-del-consumidor.md)

- **ES:** La GitHub Action ejecuta la compuerta del sidecar del proyecto, no la suya: imponer la propia cambiaría las reglas de validación de repos ajenos sin su consentimiento. Costo aceptado: un sidecar obsoleto valida con reglas obsoletas.
- **EN:** The Action runs the consumer's gate, not its own — imposing ours would silently change a foreign repo's validation rules. Accepted cost: a stale sidecar validates with stale rules.

---

## Housekeeping / Mantenimiento

- EN: A superseded record is **never deleted**. Mark it in both files and link them under "Related records".
- ES: Un registro reemplazado **nunca se borra**. Márcalo en ambos archivos y enlázalos en "Registros relacionados".
- EN: Add the new row here when you add a record — this index is what makes the folder browsable.
- ES: Agrega aquí la fila nueva al escribir un registro — este índice es lo que hace navegable la carpeta.
- EN: Learn the practice in guide 24: [`docs/en/24-architecture-decisions.md`](../../docs/en/24-architecture-decisions.md).
- ES: Aprende la práctica en la guía 24: [`docs/es/24-decisiones-de-arquitectura.md`](../../docs/es/24-decisiones-de-arquitectura.md).

### 2026-07-21 — [Relicencia a MIT](2026-07-21-relicencia-mit.md)

- **ES:** Se vuelve a MIT en todo el repositorio. PolyForm hacía que GitHub reportara `NOASSERTION` y prohibía el uso interno en empresas, que era justo el requisito. La propiedad pasa a apoyarse en el scope de npm, el namespace MCP y la línea de copyright, no en la licencia.
- **EN:** Back to MIT repo-wide. PolyForm made GitHub report `NOASSERTION` and barred the internal company use that was the actual requirement. Ownership now rests on the npm scope, the MCP namespace and the copyright line rather than on the license.

### 2026-07-21 — [Veredicto de tres estados, detector aparte](2026-07-21-veredicto-de-tres-estados-y-detector-aparte.md)

- **ES:** La compuerta pasa de un booleano a `open`/`closed`/`blocked` y declara en cada ejecución qué comprobó y qué no, para que un verde no pueda significar «no miramos». El detector de código sale a una spec posterior tras romperse en revisión adversarial; el mecanismo elegido juzga el diff del PR contra las rutas que cada spec declara.
- **EN:** The gate moves from a boolean to `open`/`closed`/`blocked` and states its own scope on every run, so a green result can never mean "we did not look". The code detector moves to a later spec after adversarial review broke it; the chosen mechanism judges the PR diff against the paths each spec declares.

### 2026-07-22 — [`--http` como bandera, y el bin se conserva](2026-07-22-http-como-bandera-y-el-bin-se-conserva.md)

- **ES:** `npx @juanklagos/sdd-mcp --http` llega al lienzo desde el binario que lleva el nombre del paquete, para que no dependa de que npx resuelva un segundo ejecutable. `sdd-mcp-http` se conserva porque está documentado fuera del repositorio. La intermitencia de npx (3 fallos, 6 éxitos, misma máquina) se rodea por diseño, no se diagnostica: se descartaron por experimento la bandera `-y`, el caché y el `node_modules` cercano, y no se afirma ninguna causa.
- **EN:** `npx @juanklagos/sdd-mcp --http` reaches the board from the bin that carries the package name, so it no longer depends on npx resolving a second executable. `sdd-mcp-http` stays because it is documented outside this repo. The npx flakiness (3 failures, 6 successes, same machine) is designed around rather than diagnosed: the `-y` flag, the cache and a nearby `node_modules` were ruled out by experiment, and no cause is claimed.

### 2026-07-22 — [App de escritorio (Electron), revertida la negativa](2026-07-22-app-escritorio-electron.md)

- **ES:** Se revierte la negativa del 2026-07-21 y se construye SDD Desk en Electron: el builder en su propia ventana, hospedando su MCP. El escritorio es un canal más, no un reemplazo de `npx` ni del `.mcpb`.
- **EN:** The 2026-07-21 refusal is reversed and SDD Desk is built in Electron: the builder in its own window, hosting its MCP. Desktop is one more channel, not a replacement for `npx` or the `.mcpb`.

### 2026-07-23 — [No firmar la app de escritorio en macOS](2026-07-23-no-firmar-la-app-de-escritorio.md)

- **ES:** macOS queda fuera de alcance para firma/notarización: Apple cobra 99 USD/año sin excepción para código abierto. El bundle se firma ad-hoc (evita «está dañado» en Apple Silicon) y la página de descarga avisa de antemano que hará falta autorizar la app.
- **EN:** macOS signing/notarization is out of scope: Apple charges 99 USD/yr with no open-source exception. The bundle is ad-hoc signed (avoids the "is damaged" error on Apple Silicon) and the download page warns up front that the app must be authorized.

### 2026-07-23 — [Alcance restante de la 011 tras el escritorio](2026-07-23-alcance-restante-de-011-tras-el-escritorio.md)

- **ES:** La 011 no se cierra ni se deja igual: T2 y T7 estaban hechas por otras specs y se marcan; el resto (T3-T6, T8) pasa a ser explícitamente la ruta `npx` y baja a prioridad Media. Se corrige la contabilidad en `tasks.md`, `INDEX.md` y `STATUS.md`.
- **EN:** Spec 011 is neither closed nor left as-is: T2 and T7 were done by other specs and get marked; the rest (T3-T6, T8) is explicitly re-scoped to the `npx` route and drops to Medium priority. The bookkeeping is corrected in `tasks.md`, `INDEX.md` and `STATUS.md`.

### 2026-07-23 — [Sampling deprecado confirma el copy-first](2026-07-23-sampling-deprecado-confirma-el-copy-first.md)

- **ES:** MCP deprecó sampling (SEP-2577, versión 2026-07-28) con ruta de migración «integra directamente con APIs de LLM» — justo lo que el builder rechazó. La condición de revisión del copy-first que dejó la decisión del 2026-07-20 se cierra con evidencia: no se hace el spike y no se toca el copy-first. Confirma, no reemplaza, la de «sin API keys».
- **EN:** MCP deprecated sampling (SEP-2577, version 2026-07-28) with migration path "integrate directly with LLM provider APIs" — exactly what the builder rejected. The copy-first revisit condition left open on 2026-07-20 closes on evidence: no spike, no change to copy-first. It confirms, not replaces, the "no API keys" record.
