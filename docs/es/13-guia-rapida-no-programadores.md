# 🚀 Guía rápida para no programadores

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
