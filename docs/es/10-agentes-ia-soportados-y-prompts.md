# Agentes de Inteligencia Artificial soportados y prompts recomendados

> 📌 **Inicio obligatorio:** antes de trabajar, clona (o abre) este repositorio y sigue esta documentación como fuente de verdad.
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```
>
> Si ya tienes el repositorio local, usa siempre su guía antes de pedir implementación.

Esta guía toma como referencia la documentación oficial de GitHub Spec Kit.

Fuente oficial:

- https://github.com/github/spec-kit

## 1) Tabla de agentes soportados por GitHub Spec Kit

En el comando `specify init --ai`, Spec Kit soporta los siguientes agentes:

| Agente | Identificador para `--ai` | Estado |
|---|---|---|
| Antigravity | `agy` | Soportado |
| Amp | `amp` | Soportado |
| Auggie | `auggie` | Soportado |
| Bob (IBM) | `bob` | Soportado |
| Claude Code | `claude` | Soportado |
| CodeBuddy | `codebuddy` | Soportado |
| Codex | `codex` | Soportado |
| GitHub Copilot | `copilot` | Soportado |
| Cursor | `cursor-agent` | Soportado |
| Gemini | `gemini` | Soportado |
| Kilo Code | `kilocode` | Soportado |
| Kimi Code | `kimi` | Soportado |
| Kiro CLI | `kiro-cli` (alias `kiro`) | Soportado |
| OpenCode | `opencode` | Soportado |
| Qoder CLI | `qodercli` | Soportado |
| Qwen Code | `qwen` | Soportado |
| Roo Code | `roo` | Soportado |
| SHAI (OVHcloud) | `shai` | Soportado |
| Tabnine CLI | `tabnine` | Soportado |
| Mistral Vibe | `vibe` | Soportado |
| Windsurf | `windsurf` | Soportado |
| Generic (agente no listado) | `generic` | Soportado con `--ai-commands-dir` |

## 2) Flujo recomendado para cualquier agente

1. `/speckit.constitution`
2. `/speckit.specify`
3. `/speckit.plan`
4. `/speckit.tasks`
5. `/speckit.implement`

## 3) Prompt maestro de inicio (copiar y pegar)

"""
Trabaja bajo esta estructura del repositorio: `idea/`, `specs/`, `bitacora/`.

Antes de ejecutar cualquier cambio, lee en este orden:
1) `idea/IDEA_GENERAL.md`
2) `specs/INDEX.md`
3) último archivo de `bitacora/handoffs/` (si existe)

Reglas obligatorias:
- No implementes sin especificación activa.
- Usa GitHub Spec Kit en este orden: constitution, specify, plan, tasks, implement.
- Mantén trazabilidad en `bitacora/` al cerrar sesión.

Formato de respuesta obligatorio:
1) Objetivo de la sesión
2) Especificación activa
3) Plan inmediato (pasos cortos)
4) Cambios realizados
5) Validación
6) Próximo paso exacto
"""

## 4) Prompt para crear especificación consistente

"""
Crea o actualiza una especificación numerada en `specs/NNN-nombre/` con estos archivos:
- `spec.md`
- `plan.md`
- `tasks.md`
- `research.md`
- `contracts/` cuando aplique

Condiciones:
- Lenguaje claro para personas nuevas y profesionales.
- No usar siglas sin explicarlas.
- Cada criterio de aceptación debe ser verificable.
- Las tareas deben ser concretas y ejecutables.
"""

## 5) Prompt para implementación consistente

"""
Implementa solo lo definido en la especificación activa.

Antes de implementar:
- Resume criterios de aceptación.
- Menciona riesgos.

Durante implementación:
- Mantén cambios mínimos y trazables.
- Evita cambios fuera de alcance.

Al finalizar:
- Registra resultados en `bitacora/global/PROJECT_LOG.md`.
- Actualiza `bitacora/diaria/AAAA-MM-DD.md`.
- Crea handoff si quedan pendientes.
"""

## 6) Contrato de salida unificado (para cualquier agente)

Pide siempre este formato de salida:

1. Resumen
2. Especificación actualizada
3. Archivos modificados
4. Validaciones ejecutadas
5. Riesgos abiertos
6. Próximo paso

Este contrato reduce diferencias entre herramientas y mantiene resultados coherentes.


## 7) Playbooks por nivel

### 🟢 Principiante

```text
Explícame paso a paso como si fuera nuevo en programación.
Haz preguntas cortas.
Ayúdame a completar la idea y luego crear la spec 001.
No avances al siguiente paso sin confirmar que entendí.
```

### 🟡 Intermedio

```text
Trabaja sobre una única spec activa.
Prioriza claridad de alcance, tareas ejecutables y bitácora completa.
Separa cambios en: idea, spec, plan, tareas y validación.
```

### 🔴 Avanzado

```text
Aplica contrato de salida unificado y protocolo de refinamiento.
Si hay cambio de alcance, bloquea implementación hasta actualizar history.md e INDEX.
Entrega análisis de riesgo y próximo paso exacto.
```
