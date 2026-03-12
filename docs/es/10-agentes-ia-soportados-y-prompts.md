# Agentes de Inteligencia Artificial soportados y prompts recomendados

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

> [!TIP]
> **Inicio recomendado (baja fricción):** no necesitas clonar este repositorio si ya estás trabajando en un proyecto.
>
> **Regla obligatoria:** indica a la IA que debe trabajar usando este template y sus guías como referencia principal.
>
> Opciones:
> - Si ya tienes este repositorio en local, úsalo directamente.
> - Si trabajas en otro proyecto, pide a la IA adaptar ese proyecto usando esta guía.
> - Si no tienes este repositorio, puedes clonarlo como opción:
>
> ```bash
> git clone https://github.com/juanklagos/spec-driven-development-template.git
> cd spec-driven-development-template
> ```

## ⭐ Uso explícito del repositorio base

Usa siempre este repositorio como referencia principal:

- `https://github.com/juanklagos/spec-driven-development-template`

### 🆕 Caso 1: crear un proyecto nuevo desde esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template crea un proyecto nuevo para [OBJETIVO].
Si no tengo este repositorio disponible en local, indícame cómo obtenerlo; luego inicializa la estructura y guíame paso a paso para definir idea, primera spec y bitácora.
No saltes pasos.
```

### ♻️ Caso 2: adaptar un proyecto existente usando esta base

Prompt sugerido para la IA:

```text
Usando https://github.com/juanklagos/spec-driven-development-template y su guía, adapta este proyecto existente: [RUTA_DEL_PROYECTO].
Mantén el código actual, integra la estructura idea/specs/bitacora, crea la primera spec basada en lo que ya existe y deja trazabilidad completa.
```

### ✅ Resultado mínimo esperado

- Proyecto creado o adaptado con estructura estándar.
- Primera especificación creada.
- Bitácora inicial registrada.
- Próximo paso claro para continuar.


Esta guía toma como referencia la documentación oficial de GitHub Spec Kit.

Fuente oficial:

- https://github.com/github/spec-kit

## 1) Tabla de agentes soportados por GitHub Spec Kit

En el comando <kbd>specify init --ai</kbd>, Spec Kit soporta los siguientes agentes:

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

1. <kbd>/speckit.constitution</kbd>
2. <kbd>/speckit.specify</kbd>
3. <kbd>/speckit.plan</kbd>
4. <kbd>/speckit.tasks</kbd>
5. <kbd>/speckit.implement</kbd>

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

### <img src="https://img.shields.io/badge/🟢_Principiante-238636?style=flat-square" alt="Principiante">

```text
Explícame paso a paso como si fuera nuevo en programación.
Haz preguntas cortas.
Ayúdame a completar la idea y luego crear la spec 001.
No avances al siguiente paso sin confirmar que entendí.
```

### <img src="https://img.shields.io/badge/🟡_Intermedio-D29922?style=flat-square" alt="Intermedio">

```text
Trabaja sobre una única spec activa.
Prioriza claridad de alcance, tareas ejecutables y bitácora completa.
Separa cambios en: idea, spec, plan, tareas y validación.
```

### <img src="https://img.shields.io/badge/🔴_Avanzado-DA3633?style=flat-square" alt="Avanzado">

```text
Aplica contrato de salida unificado y protocolo de refinamiento.
Si hay cambio de alcance, bloquea implementación hasta actualizar history.md e INDEX.
Entrega análisis de riesgo y próximo paso exacto.
```
