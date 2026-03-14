# Guía rápida para no programadores

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
- `spec.md` (requisitos + aceptación)
- `plan.md` (cómo se construye)
- `tasks.md` (checklist)
- `history.md` (entrada inicial)

4. Valida:

```bash
./scripts/validate-sdd.sh . --strict
./scripts/check-sdd-gate.sh .
```

5. Registra sesión en `bitacora/global/PROJECT_LOG.md`.

## Reglas obligatorias
- No implementar código sin `spec.md` aprobada y `plan.md` consistente.
- Si cambia la idea, primero actualiza documentación.

## Prompts recomendados
- [Matriz de prompts](./19-matriz-prompts-por-objetivo.md)
- [Banco de prompts validados](./26-banco-prompts-validados.md)

## Próximo paso
Pasa a la guía intermedia:
- [docs/es/14-guia-intermedia.md](./14-guia-intermedia.md)
