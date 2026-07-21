# Templates Library / Biblioteca de Plantillas

Use these files when you want to bootstrap fast without searching across the repository.

Usa estos archivos cuando necesites iniciar rápido sin buscar en todo el repositorio.

## Structure

- `templates/idea/IDEA_GENERAL.template.md`
- `specs/_template/spec.md` (canonical spec template — the only one the gate, `sdd_approve_spec` and `sdd_update_spec_sections` understand)
- `templates/spec/plan.template.md`
- `templates/spec/tasks.template.md`
- `templates/spec/research.template.md`
- `templates/spec/history.template.md`
- `templates/bitacora/daily.template.md`
- `templates/bitacora/handoff.template.md`
- `templates/bitacora/decision.template.md`

## Quick use

```bash
cp templates/idea/IDEA_GENERAL.template.md idea/IDEA_GENERAL.md
cp specs/_template/spec.md specs/001-my-feature/spec.md
```

Always copy the spec body from `specs/_template/spec.md`. It carries the
`## Estado de aprobación / Approval status` block and the canonical section
headings; a spec without them fails the gate and cannot be approved.

Copia siempre el cuerpo de la spec desde `specs/_template/spec.md`. Trae el
bloque `## Estado de aprobación / Approval status` y los encabezados canónicos;
una spec sin ellos falla la compuerta y no se puede aprobar.

These templates are language-neutral and work for Spanish and English teams.
