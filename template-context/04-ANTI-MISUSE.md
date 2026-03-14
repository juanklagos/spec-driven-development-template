# Anti-Misuse Guide / Guía anti-uso incorrecto

## Common mistakes / Errores comunes

1. Treating this template repository as if it were an active product implementation.
2. Forcing fake active specs in this repository just to satisfy checks.
3. Writing project-specific scope into template-level files without explicit intent.
4. Skipping refinement trace when requirements change.
5. Mixing template maintenance tasks with client project execution tasks in one undocumented flow.

## Corrective actions / Acciones correctivas

- If the task is template maintenance, document changes as template improvements.
- If the task is project execution, switch context to the target project path.
- If context is ambiguous, clarify before implementation.
- Keep this repository as a clean, reusable base for others.

## Quick decision rule / Regla rápida de decisión

- Question: "Is this change improving the template itself, or delivering a concrete user product feature?"
- If template: update template docs/scripts/examples.
- If product feature: execute in the target project repository, using this template as guide.
