# Decisión clave - `www/<proyecto>` pasa de raíz obligatoria a workspace recomendado / Key decision - `www/` demoted from hard constraint to recommended default

## Date / Fecha

2026-03-18

## Context / Contexto

Cuatro días antes, el template había cerrado la puerta con llave. Dos commits del 2026-03-14 impusieron un confinamiento duro:

- `2750eb6` (10:47:02 -0500) — *"feat(workspace): enforce www execution root for runnable projects"*.
- `04968fd` (11:21:04 -0500) — *"feat(workspace): enforce runnable projects inside current chat folder"*, que añadió a `scripts/init-project.sh` un guard que salía con código `1` y el mensaje **"Error: target must be inside the current workspace root."**

La política lo declaraba explícitamente: `constrained_to_current_chat_workspace: true`.

El efecto práctico: **el template solo servía para proyectos que vivieran dentro del propio template**. Un proyecto real, con su repositorio ya existente en otra ruta del disco, no podía adoptar SDD sin mudarse.

## Decision / Decisión

Permitir rutas destino externas. `www/<proyecto>` deja de ser una restricción y pasa a ser el **valor por defecto recomendado**.

Estado en `sdd.policy.yaml:11-22` (bloque `execution_root`):

```yaml
constrained_to_current_chat_workspace: false
allow_external_target_paths: true
if_target_inside_template_use_default_workspace: true
recommended_not_required: true
```

## Por qué / Rationale — con un hueco declarado

El commit que revierte el confinamiento es **`5b008e4`** (2026-03-18 10:05:23 -0500), *"feat(workflow): support flexible target paths and document command results"* — enmarcado como **capacidad nueva, no como corrección**.

**No existe nota en bitácora ni entrada de spec que explique el porqué.** Los commits del 2026-03-18 que sí tocan `bitacora/` y `specs/` (`04d133a`, `3c29d86`, `015d181`, `56e087b`) pertenecen todos a la spec `001-sdd-mcp-foundation` y no mencionan el cambio de workspace. `CHANGELOG.md` tampoco lo registra. Esto se reconstruye del **diff de doctrina**, no de una justificación escrita:

- `CLAUDE.md` cambia el encabezado de **"Execution root"** a **"Execution workspace"** y añade la línea *"The user may choose another target path."*
- `execution_workspace_en` pasa de *"Use www/… for runnable target projects"* a *"**Prefer** www/… as the **recommended default** workspace"*.

La dirección del viaje es consistente con el **modo sidecar**, que aterriza al día siguiente (`84b219b`, 2026-03-19, *"feat(sidecar): add compact spec mode for real projects"*) y presupone que el proyecto real vive **fuera** del template. El confinamiento y el sidecar eran mutuamente excluyentes.

## El invariante que sí sobrevivió / The invariant that survived

Esto es lo importante del registro: **la regla nunca fue "quédate dentro del repo", sino "nunca mezcles trabajo de framework con trabajo de producto".**

Lo dice el propio guard, con su razón escrita al lado, en `scripts/new-spec.sh:21`:

```
# Block spec creation in template root to avoid mixing framework and runnable project work.
```

Ese guard rechaza crear specs cuando detecta a la vez `sdd.policy.yaml`, `scripts/create-www-project.sh` y `www/` — es decir, cuando estás parado en el template mismo. Sigue vivo.

También se conservan:

- `do_not_implement_in_template_root: true` (`sdd.policy.yaml:22`).
- El guard anidado de `scripts/init-project.sh:40-55`: si el destino está **dentro** del template, debe estar bajo `www/`; si está fuera, pasa sin objeción. El confinamiento no se borró, se **anidó**.

## Alternatives considered / Alternativas consideradas

| Alternativa | Por qué no |
|---|---|
| **Mantener el confinamiento duro** al workspace del chat actual (la versión de `04968fd`, cuatro días antes) | Hacía el template inaplicable a proyectos reales externos: obligaba a mudar el repositorio del usuario dentro del template para poder adoptar SDD |

No hay evidencia de que se hayan evaluado otras alternativas por escrito.

## Consequences / Consecuencias

**A favor**
- El template deja de ser un jardín cerrado: se puede instalar el sidecar `spec/` en un repositorio real y dejar el código donde ya vive.
- Habilita el modo sidecar del día siguiente (`84b219b`), que sería imposible bajo el confinamiento.

**Costos aceptados**
- La protección contra mezclar framework y producto pasa de ser una **frontera de ruta** (fácil de verificar) a una **frontera de intención** (depende de los guards de `new-spec.sh` y `init-project.sh`, y de que el agente respete `do_not_implement_in_template_root`).
- Un destino externo mal elegido ya no lo bloquea nada: la única red es el guard de raíz de template.

**Deuda de trazabilidad**
- Este cambio de doctrina se hizo **sin registro de decisión** en su momento. Este archivo es reconstrucción posterior, escrita el 2026-07-21 a partir de git y de los archivos citados. Es exactamente el vacío que `bitacora/decisiones/` existe para evitar.

## Vigencia / Status

**Vigente.** No superada por ningún registro posterior. El estado actual se verifica en `sdd.policy.yaml:11-22` y en la sección "Execution workspace" de `CLAUDE.md`.

## Cuándo revisar esta decisión / When to revisit

- **Si aparece un caso real de contaminación cruzada**: specs o código de un proyecto destino escritos por error en la raíz del template, o al revés. Sería señal de que la frontera de intención no basta y hay que volver a una frontera de ruta.
- **Si el guard de `scripts/new-spec.sh:21` deja de disparar** por un cambio en la detección (por ejemplo, si `www/` desaparece del template o `create-www-project.sh` se renombra): la condición es una conjunción de tres archivos y es frágil ante refactors.
- **Si el modo sidecar se retira o se reemplaza**: era la razón funcional de abrir las rutas externas; sin él, el confinamiento vuelve a ser barato.
- **Si el template pasa a distribuirse solo como paquete npm** y ya no se clona: el concepto de "dentro del template" pierde sentido y todo el bloque `execution_root` necesita reescritura, no ajuste.
