# Anti-patrones y errores comunes

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Volver_al_índice-2D3139?style=for-the-badge" alt="Volver al índice"></a>

---

## 🌍 Par de idioma / Language pair

- Español: **20-anti-patrones-y-errores-comunes.md**
- English: [../en/20-anti-patterns-and-common-errors.md](../en/20-anti-patterns-and-common-errors.md)


## 🗣️ Prompt amigable (copiar y pegar)

Úsalo si no eres técnico y quieres que la IA lo integre todo y te vaya guiando:

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].

Si mi proyecto es nuevo, inicialízalo con este template y GitHub Spec Kit.
Si mi proyecto ya existe, adáptalo a idea/specs/bitacora sin romper el comportamiento actual.
Guíame paso a paso según mi nivel (principiante/intermedio/avanzado), con lenguaje claro.
No omitas especificación, plan, tareas, traza de refinamiento, bitácora y validación.
```


> [!CAUTION]
> Estos son los errores que más veces rompen el flujo SDD. Todos se ven inocentes en el momento.

## 🚫 Anti-patrones críticos

### 1. Codificar antes de especificar

| Síntoma | Impacto | Solución |
|---|---|---|
| "Déjame construirlo rápido" | Cambios sin dirección, scope creep | Escribe `spec.md` primero, aunque sean 10 líneas |
| La IA genera código sin contexto | Features alucinadas, arquitectura incorrecta | Alimenta `IDEA_GENERAL.md` + spec activa a la IA antes de pedir código |
| Saltarse `plan.md` | La implementación no coincide con los requisitos | Siempre llena `plan.md` antes de abrir tu editor |

### 2. Cambios de alcance invisibles

| Síntoma | Impacto | Solución |
|---|---|---|
| "Ah, de paso también agregué X" | Trabajo no rastreado, trazabilidad rota | Registra cada cambio de scope en `history.md` |
| Requisitos discutidos solo en chat/Slack | Decisiones perdidas, entendimiento conflictivo | Transfiere las decisiones a `bitacora/decisiones/` |
| Cambiar prioridades sin actualizar INDEX | Confusión del equipo sobre qué está activo | Actualiza `specs/INDEX.md` de inmediato |

### 3. Fallas de continuidad entre sesiones

| Síntoma | Impacto | Solución |
|---|---|---|
| Sin handoff al final de la sesión | La siguiente sesión arranca de cero | Crea entrada en `bitacora/handoffs/` cada vez |
| "Ya me voy a acordar de lo que estaba haciendo" | Pérdida de contexto después de 24+ horas | Escríbelo — tu yo del futuro es un extraño |
| Múltiples specs en progreso sin seguimiento | Caos de prioridades, implementaciones parciales | Mantén `specs/INDEX.md` como fuente única de verdad |

### 4. Confusión de contexto template/producto

| Síntoma | Impacto | Solución |
|---|---|---|
| La IA modifica archivos del template para un proyecto usuario | Template corrompido | Clarifica modo: `template maintenance` vs `project execution` |
| Crear specs para el template durante trabajo de proyecto | Contextos mezclados | Repos separados o declarar modo mantenimiento explícitamente |

## ⚠️ Señales de que la disciplina SDD se está rompiendo

- `tasks.md` no se ha actualizado en 3+ sesiones
- `specs/INDEX.md` no refleja la realidad
- `bitacora/` no tiene entradas en la última semana
- `history.md` no muestra cambios pero el código sí ha evolucionado
- `validate-sdd.sh` no se ha ejecutado desde el inicio del proyecto

## 📏 La regla que resume todo

> **La decisión que no escribiste es la discusión que vas a tener otra vez dentro de tres semanas.**

## 💡 Protocolo de recuperación

Si te descubres saltándote la disciplina, o descubres que el equipo lo está haciendo:

1. Para de escribir código. Ahora, no al terminar lo que estabas haciendo.
2. Ejecuta `./scripts/validate-sdd.sh . --strict` y mira qué falta.
3. Tapa los huecos: spec activa al día, decisiones documentadas, handoff creado.
4. Recién ahí vuelve a implementar.

Son quince minutos. El retrabajo que evitan se mide en días.
