# Anti-Misuse Guide / Guía anti-uso incorrecto

Five ways people break this template, and what to do instead.

## Common mistakes / Errores comunes

1. Treating this template repository as if it were an active product implementation.
2. Forcing fake active specs in this repository just to satisfy checks.
3. Writing project-specific scope into template-level files without explicit intent.
4. Skipping refinement trace when requirements change.
5. Mixing template maintenance with client project execution in one undocumented flow.

## Corrective actions / Acciones correctivas

Template maintenance gets documented as a template improvement. Project execution moves to the target project path first. When the context is ambiguous, clarify before writing any implementation code — this repository has to stay a clean base that someone else can reuse.

## Quick decision rule / Regla rápida de decisión

Ask: is this change improving the template itself, or delivering a feature for a user's product?

- Template: update the docs, scripts or examples here.
- Product feature: execute in the target project repository and use this template as the guide.
