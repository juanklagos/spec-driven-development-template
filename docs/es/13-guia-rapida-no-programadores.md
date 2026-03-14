# 🚀 Guía rápida para no programadores

## 🌍 Par de idioma / Language pair

- Español: **13-guia-rapida-no-programadores.md**
- English: [../en/13-quick-guide-non-programmers.md](../en/13-quick-guide-non-programmers.md)


## 🗣️ Prompt amigable (copiar y pegar)

```text
Usando https://github.com/juanklagos/spec-driven-development-template, crea todo lo necesario para llevar a cabo mi proyecto de principio a fin.
Mi proyecto es: [explica tu proyecto en lenguaje simple].
Guíame por nivel y no omitas especificación, plan, tareas, bitácora y validación.
```


Para quién es:
- Para empezar en SDD con pasos claros y sin sobrecarga técnica.

## Objetivo
Completar un ciclo limpio:
1. idea definida
2. primera spec creada
3. primera entrada de bitácora
4. validaciones ejecutadas

## Pasos

1. Completa `idea/IDEA_GENERAL.md` con lenguaje simple.
2. Crea la primera spec:

```bash
./scripts/new-spec.sh "mi-primera-feature" "Responsable"
```

3. Completa en `specs/001-.../`:
- `spec.md`
- `plan.md`
- `tasks.md`
- `history.md`

4. Valida:

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

5. Registra sesión en `bitacora/global/PROJECT_LOG.md`.

## Pack de prompts (Principiante)

### Prompt A: completar idea
```text
Actúa como coach SDD para principiantes.
Ayúdame a completar idea/IDEA_GENERAL.md con lenguaje simple.
Haz una pregunta corta a la vez.
No asumas información faltante.
```

### Prompt B: crear primera spec
```text
Con base en idea/IDEA_GENERAL.md, crea specs/001-... con:
spec.md, plan.md, tasks.md, history.md.
Usa redacción clara y evita siglas sin explicar.
No implementes código.
```

### Prompt C: revisión antes de implementar
```text
Revisa consistencia entre spec.md, plan.md y tasks.md.
Lista brechas y correcciones exactas antes de implementar.
```

## Reglas obligatorias
- No código sin `spec.md` aprobada + `plan.md` consistente.
- Si cambia la idea, primero actualiza documentación.

## Más prompts
- [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)
- [Banco de prompts validados](./26-banco-prompts-validados.md)

## Próximo paso
- [docs/es/14-guia-intermedia.md](./14-guia-intermedia.md)

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
