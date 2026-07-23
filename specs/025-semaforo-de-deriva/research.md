# Investigación 025 - semáforo de deriva spec↔código

## Hallazgos

- **La deriva es el problema abierto del sector, y todos lo tratan igual.** Búsquedas 2026-07-23:
  - Spec Kit añadió `/speckit.reconcile` y `/speckit.sync.analyze` (detecta deriva, propone resoluciones, puede rellenar specs desde código no especificado).
  - OpenSpec tiene `/opsx:sync`.
  - La crítica recurrente (DEV Community, intent-driven.dev): *"neither approach is automatic — you have to trigger them and review the output, and it's the overhead that most teams skip until their specs are six months out of date."*
- **El template tiene la ventaja que a los demás les falta.** Ninguno de Spec Kit, OpenSpec, BMAD, Kiro tiene lienzo. Un color que aparece solo derrota a un comando que hay que recordar.
- **El dato ya existe.** `specs/_template/spec.md` incluye «Ámbito de archivos / File scope» con rutas entre backticks; 011 y 023 la usan. No hay que inventar el modelo; hay que leerlo.
- **La restricción de «sin LLM» juega a favor.** `bitacora/decisiones/2026-07-20-builder-sin-llamadas-a-llm.md` prohíbe llamadas a modelos; la deriva es `git log` + rutas + fechas: puramente determinista. La detección cabe dentro de la restricción; el *juicio* (¿quién tiene razón, la spec o el código?) se delega al agente, igual que el asistente ✨.
- **El patrón de invocación de git ya está.** `packages/sdd-mcp/src/github.ts` usa `execFile` (no shell) con timeout para `gh`. Mismo patrón para `git log`.

## Decisiones derivadas de los hallazgos

- **Detectar, no reconciliar.** Reconciliar (reescribir spec o revertir código) toca el hard stop y es humano; esta spec se queda en la señal. El agente conectado puede proponer, no ejecutar.
- **Estado `unscoped` explícito.** Una spec sin ámbito declarado no es «sin deriva»: es «no sé». Fingir verde sería el mismo fallo silencioso que la decisión del 2026-07-21 nombró (*"failing that way round means the product's core promise silently failed open"*).
- **Calcular en `sdd-core`, transportar como `tone`.** No recalcular en cuatro clientes: esa es exactamente la trampa que la decisión de una sola regla de estado ya pagó una vez.
- **Depender de la 024 en duro.** El cruce de fechas y rutas es fácil de equivocar (zonas horarias, rutas movidas, `--follow`); sin pruebas, la señal miente y es peor que no tenerla.
