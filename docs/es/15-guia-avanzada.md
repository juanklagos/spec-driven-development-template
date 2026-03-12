# 🧭 Guía avanzada (equipos exigentes y resultados unificados)

> ✅ **Inicio recomendado (baja fricción):** no necesitas clonar este repositorio si ya estás trabajando en un proyecto.
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


> Objetivo: lograr consistencia alta entre diferentes herramientas de Inteligencia Artificial.

## 🧱 Estrategia avanzada

1. Usa contrato de salida unificado.
2. Fuerza validaciones explícitas por sesión.
3. Exige refinamiento antes de cambios de alcance.
4. Controla calidad con TDD y BDD.

## 🗣️ Prompt maestro avanzado

```text
Sigue el estándar del repositorio.

Lectura obligatoria:
1) idea/IDEA_GENERAL.md
2) specs/INDEX.md
3) último handoff
4) docs/es/10-agentes-ia-soportados-y-prompts.md
5) docs/es/11-refinamiento-continuo.md

Reglas:
- No implementar sin spec activa.
- Si detectas cambio de alcance, actualiza history.md y bitácora antes de implementar.
- Entrega salida con este formato:
  1) Objetivo
  2) Cambios
  3) Validaciones
  4) Riesgos
  5) Próximo paso
```

## 📈 Métricas sugeridas

| Métrica | Objetivo |
|---|---|
| Especificaciones con `history.md` al día | 100% |
| Sesiones con bitácora completa | 100% |
| Cambios fuera de alcance | 0 |
| Pendientes sin handoff | 0 |

## 🔒 Criterio de calidad

Si no hay trazabilidad, el trabajo no está terminado.
