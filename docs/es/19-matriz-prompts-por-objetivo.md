# Matriz de prompts por objetivo

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🌍 Par de idioma / Language pair

- Español: **19-matriz-prompts-por-objetivo.md**
- English: [../en/19-prompt-matrix-by-goal.md](../en/19-prompt-matrix-by-goal.md)


## 🗣️ Prompt amigable (copiar y pegar)

Usa esto cuando no eres técnico y quieres que la IA haga la integración + guía completa:

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].

Si mi proyecto es nuevo, inicialízalo con este template y GitHub Spec Kit.
Si mi proyecto ya existe, adáptalo a idea/specs/bitacora sin romper el comportamiento actual.
Guíame paso a paso según mi nivel (principiante/intermedio/avanzado), con lenguaje claro.
No omitas especificación, plan, tareas, traza de refinamiento, bitácora y validación.
```


> Usa esta matriz para pedirle a cualquier IA resultados consistentes.

## Tabla principal

| Objetivo | Prompt base | Entregable esperado |
|---|---|---|
| Descubrir sistema legado | "Analiza este proyecto existente, documenta comportamiento actual y crea `idea/IDEA_GENERAL.md` + `specs/001-...` sin cambiar código" | Idea + spec base de ingeniería inversa |
| Crear spec nueva | "Trabaja sobre `specs/INDEX.md`, define la siguiente spec numerada y completa `spec.md`, `plan.md`, `tasks.md`, `research.md`, `history.md`" | Nueva spec completa |
| Refinar spec existente | "Refina la spec activa por cambios de alcance, actualiza `history.md` y registra impacto en bitácora" | Spec actualizada + traza |
| Preparar implementación | "Desde la spec activa, lista riesgos, plan de pruebas y tareas priorizadas antes de tocar código" | Plan técnico claro |
| Cerrar sesión | "Genera handoff con estado, pendientes y siguiente paso en `bitacora/handoffs/`" | Handoff listo |

## Prompt universal recomendado

```text
Usa https://github.com/juanklagos/spec-driven-development-template como guía principal.
Trabaja con la estructura idea/specs/bitacora.
Antes de implementar, valida spec activa y trazabilidad.
Al finalizar, deja bitácora y handoff.
```

## Reglas de consistencia

- Un cambio grande = una spec activa.
- No hay implementación sin `tasks.md`.
- Si cambia la idea, actualiza `history.md` y bitácora.

## 💡 Tips rápidos

- Empieza con una descripción corta del proyecto en lenguaje simple.
- Pide a la IA confirmar la spec activa antes de programar.
- Cierra cada sesión con validación y próximo paso claro.

## 📊 Flujo visual

```mermaid
flowchart LR
  A["Idea del proyecto"] --> B["Spec aprobada"]
  B --> C["Plan alineado"]
  C --> D["Tareas priorizadas"]
  D --> E["Implementación"]
  E --> F["Validación + Bitácora"]
```
