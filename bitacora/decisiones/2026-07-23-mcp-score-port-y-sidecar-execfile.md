# Decisión clave - Para cubrir el MCP, el score se porta a TypeScript pero el sidecar se delega al bash / Key decision - For MCP coverage, the score is ported to TypeScript but the sidecar delegates to bash

## Date / Fecha

2026-07-23

## Context / Contexto

La spec 027 (`specs/027-mcp-full-coverage/`) expone como herramientas MCP dos
capacidades que solo existían como scripts bash: `scripts/score-spec.sh` (120
líneas) y `scripts/install-spec-sidecar.sh` (364 líneas). Un servidor instalado
por npm o corriendo dentro de SDD Desk no puede asumir ni `bash` con `rg`
(el score usa ripgrep) ni un clone del template. Había que decidir, por cada
script, entre portarlo a TypeScript o ejecutarlo con `execFile`.

## Decision / Decisión

**Asimétrica a propósito, un criterio por script:**

- **`scoreSpec` se portó a TypeScript** (`packages/sdd-core/src/score.ts`).
  Razón: el bash depende de `rg`, que NO se puede asumir en la máquina del
  usuario final; la lógica son ~15 regex y sumas, trivial de portar; y la spec
  declara paridad de **heurísticas** (mismos buckets, pesos y notas), no de
  bytes — pineada por tests (`score.test.ts`).
- **`installSidecar` delega en el bash con `execFile`**
  (`packages/sdd-core/src/index.ts`), el MISMO patrón que `createWorkspace`
  estableció con `create-www-project.sh`. Razón: son 364 líneas probadas en
  producción, el payload npm ya distribuye `scripts/` (por eso
  `createWorkspace` funciona instalado), y el script solo necesita bash
  estándar — sin `rg` ni otras dependencias.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Portar también el sidecar a TS** | Reescribir 364 líneas probadas duplica el instalador y garantiza deriva entre el script (que sigue siendo la vía local) y el port. El costo/riesgo no compra nada: bash sí está disponible donde corre el servidor |
| **Ejecutar también el score con execFile** | El score depende de `rg`, que no viene con macOS/Linux base; fallaría exactamente en el entorno (npm/Desk) para el que la herramienta existe |
| **No exponer ninguno y dejarlos como scripts** | Era el statu quo que la spec 027 corrige: los agentes HTTP/Desk no tienen bash ni filesystem |

## Consequences / Consecuencias

- Hay DOS implementaciones del score (bash y TS). El contrato es paridad de
  heurísticas; si `score-spec.sh` cambia sus pesos, `score.ts` y sus tests
  deben cambiar en el mismo commit.
- `sdd_install_sidecar` hereda los mensajes de error del bash tal cual (son
  ruidosos a propósito, spec 021).

**Cuándo revisar esta decisión**

- Si `score-spec.sh` y `score.ts` divergen en la práctica: considerar borrar el
  bash y dejar solo el TS (el script podría llamar a `node`).
- Si `install-spec-sidecar.sh` crece o necesita correr donde no hay bash
  (Windows sin WSL): ahí sí toca portarlo, con suite de paridad primero.

Fuente / Source: `specs/027-mcp-full-coverage/research.md`, sesión de chat 2026-07-23 («cubre todo»).
