# Decisión clave - Los proyectos reales instalan un sidecar compacto `spec/`, no clonan el template / Key decision - Sidecar-first for real projects

## Date / Fecha

2026-03-19

## Context / Contexto

Hasta ese día la doctrina escrita era la contraria: **clonar el framework completo y trabajar dentro de él**. El commit `4275060` (2026-03-12, *"Enforce clone-and-follow rule across all documentation"*) propagó esa regla a `AGENTS.md`, `README.md`, `CONTRIBUTING.md` y a toda la carpeta `docs/` — decenas de archivos con el mismo bloque.

Eso funciona para aprender y es inviable para un proyecto real: obliga a volcar el repositorio del framework (docs bilingües, `www/`, `packages/`, scripts, sitio) encima de un proyecto que ya tiene su propia raíz.

La precondición se había levantado el día anterior: ver `bitacora/decisiones/2026-03-18-www-recomendado-no-obligatorio.md` (rutas destino externas permitidas). Sin eso, esta decisión sería imposible.

## Decision / Decisión

La arquitectura profesional por defecto pasa a ser explícita. `CHANGELOG.md`, sección *Changed* de **v1.4.0 (2026-03-19)**, en tres líneas:

- el código del proyecto se queda en la raíz del proyecto
- los artefactos SDD viven en `./spec/`
- la copia completa del template queda reservada para **modo standalone explícito**

Implementación: commit **`84b219b`** (2026-03-19 11:15:05 -0500, *"feat(sidecar): add compact spec mode for real projects"*), que añade `scripts/install-spec-sidecar.sh` (+230 líneas) y la plantilla `templates/sidecar/` (`AGENTS.md`, `AI_START_HERE.md`, `INSTRUCTIONS.md`, `sdd.policy.yaml`, `scripts/`).

La regla no queda solo en la documentación: el instalador **la escribe dentro del proyecto destino**, en los stubs de reglas de agente que deja en la raíz (`scripts/install-spec-sidecar.sh:166` y `:188`):

```
Do not clone or copy the full framework repository into this project
unless the user explicitly asks for a standalone workspace.
```

Y el propio sidecar declara su razón de ser en `templates/sidecar/README.md:3`: mantiene el sistema operativo SDD del proyecto *"without flooding the project root"*.

El mismo commit borra del `README.md` el tip de `npx degit` que promovía copiar el template, y reescribe la tabla de comandos de `./scripts/*` a `./spec/scripts/*`, añadiendo dos filas nuevas: instalar sidecar y `init-project.sh --profile=full` para el caso standalone (hoy `README.md:170` y `:172`).

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Clonar/copiar el repositorio completo del framework en cada proyecto destino** — el modelo que imponía `4275060` (2026-03-12) | Inunda la raíz de un proyecto real con el framework entero. **No se elimina**: sobrevive como modo standalone explícito (`--profile=full`) |

No hay evidencia escrita de que se evaluaran otras alternativas (por ejemplo, distribuir el sidecar como paquete npm en vez de como plantilla copiada). Tampoco hay una spec que gobierne esta decisión: `84b219b` se implementó directo contra el release v1.4.0, y `specs/001-sdd-mcp-foundation/history.md` solo cubre la fundación MCP.

## Consequences / Consecuencias

**A favor**
- Un proyecto real adopta SDD sin mudarse ni ensuciar su raíz.
- La regla viaja **dentro** del proyecto destino, así que el agente que lo abra la lee sin conocer el framework.

**Costos aceptados**
- **Todos los scripts y `sdd-core` tuvieron que volverse agnósticos del layout.** El mismo commit añade `scripts/lib/sdd-root.sh` (+78) para resolver root clásico o sidecar, y toca `validate-sdd.sh`, `check-sdd-policy.sh`, `check-sdd-gate.sh`, `new-spec.sh`, `generate-status.sh`, `generate-roadmap.sh`, `confirm-user-consent.sh` y `create-www-project.sh`.
- **El verificador de política tiene que saber que un sidecar legítimamente no es un template.** `packages/sdd-core/src/policy.ts:159-162` lo dice en el comentario — *"a compact `spec/` sidecar has neither `www/` nor `create-www-project.sh` and must not be asked for them"* — y condiciona el chequeo a la presencia de `scripts/init-project.sh`. El mismo guard, duplicado, en `scripts/check-sdd-policy.sh:126-139`.
- **Cada regla nueva hay que escribirla dos veces**: en el template y en `templates/sidecar/`. Es deuda estructural permanente, no un costo de una vez.

## Vigencia / Status

**Vigente y reforzada.** No superada.

- La doctrina sidecar-first se propagó a `AGENT_OPERATING_SYSTEM.md`, `06-AI-RULES-MATRIX.md` y **los 8 archivos de reglas por agente** el 2026-07-17 (commit `ba0ae59`; `bitacora/global/PROJECT_LOG.md:69-70`).
- La ruta externa de `QUICKSTART.md:60-63` apunta a `install-spec-sidecar.sh`.
- `CLAUDE.md:16-17` lo sigue afirmando: *"Para proyectos reales externos, instala el sidecar compacto `spec/`"* (línea añadida por `ba0ae59`).
- Un fallo derivado se corrigió el 2026-07-20 (`8949bed`): el instalador copiaba las filas de `specs/INDEX.md` del template a los sidecars nuevos; ahora escribe un índice vacío.

## Cuándo revisar esta decisión / When to revisit

- **Si la duplicación template/sidecar empieza a divergir**: si aparece una regla o script que exista en uno y no en el otro, el costo aceptado dejó de ser aceptable y toca generar el sidecar desde una única fuente (o distribuirlo como paquete) en vez de copiarlo.
- **Si aparece un tercer layout** (por ejemplo, monorepo con varios sidecars): `scripts/lib/sdd-root.sh` y el guard de `policy.ts:162` asumen exactamente dos formas. Un tercero obliga a rediseñar la resolución de root, no a añadir un `if`.
- **Si el modo standalone deja de usarse de verdad**: hoy se conserva `--profile=full` por el caso de aprendizaje. Si nadie lo usa, retirarlo elimina la mitad de la duplicación.
- **Si el framework pasa a distribuirse solo como paquete npm ejecutable** (línea abierta por la spec `011-one-command-launcher`): "copiar el repositorio" dejaría de ser la alternativa a vencer y esta decisión perdería su contraparte.
