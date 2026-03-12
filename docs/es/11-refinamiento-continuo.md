# 🔁 Refinamiento continuo (Idea y Especificaciones)

Esta guía define cómo mejorar el proyecto cuando cambian ideas, prioridades o requisitos.

## 🎯 Objetivo

Mantener consistencia entre:

- `idea/IDEA_GENERAL.md`
- `specs/` (todas las especificaciones)
- `bitacora/` (registro real de lo que pasó)

## 📌 Regla principal

Cada cambio importante debe dejar rastro en 3 lugares:

1. Idea o especificación afectada.
2. Historial de la especificación.
3. Bitácora de sesión.

## 🧭 Tipos de cambio y acción obligatoria

| Tipo de cambio | Qué hacer | Dónde registrar |
|---|---|---|
| Cambio de visión del producto | Actualizar idea general | `idea/IDEA_GENERAL.md` + `bitacora/global/PROJECT_LOG.md` |
| Nuevo requisito | Crear o actualizar especificación | `specs/NNN-.../spec.md` + `specs/NNN-.../history.md` |
| Cambio técnico de implementación | Actualizar plan y tareas | `plan.md`, `tasks.md`, `history.md` |
| Ajuste por hallazgos | Actualizar investigación | `research.md`, `history.md`, bitácora diaria |
| Cambio de alcance | Marcar impacto y priorización | `specs/INDEX.md` + `history.md` |

## 📈 Flujo visual de refinamiento

```mermaid
flowchart LR
  A["Cambio detectado"] --> B["Clasificar tipo de cambio"]
  B --> C["Actualizar Idea o Spec"]
  C --> D["Registrar en history.md"]
  D --> E["Actualizar bitacora"]
  E --> F["Revalidar plan y tareas"]
```

## ✅ Checklist rápido de refinamiento

- [ ] ¿El cambio afecta idea general?
- [ ] ¿Se actualizó la spec activa?
- [ ] ¿Se registró entrada en `history.md`?
- [ ] ¿Se actualizó bitácora global o diaria?
- [ ] ¿Se revisaron tareas para evitar contradicciones?

## 📝 Formato recomendado para `history.md`

| Fecha | Tipo de cambio | Resumen | Archivos impactados | Responsable |
|---|---|---|---|---|
| 2026-03-12 | Cambio de alcance | Se dividió spec en dos fases | `spec.md`, `tasks.md` | IA |

## 🤖 Regla para herramientas de Inteligencia Artificial

Si detectas contradicción entre idea y spec:

1. No implementar de inmediato.
2. Proponer refinamiento.
3. Actualizar documentación.
4. Recién después continuar implementación.
