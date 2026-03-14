# WWW Workspace / Espacio WWW

EN:
- This folder is the execution workspace for real projects created from this template.
- Do not mix product implementation in the template root.
- Create each runnable project under `www/<project-name>/`.

ES:
- Esta carpeta es el espacio de ejecución para proyectos reales creados desde este template.
- No mezcles implementación de producto en la raíz del template.
- Crea cada proyecto ejecutable en `www/<nombre-proyecto>/`.

Recommended creation command / Comando recomendado:

```bash
./scripts/create-www-project.sh my-project codex
```

Default:
- EN: recommended scaffold (best default for project quality).
- ES: scaffold recomendado (mejor valor por defecto para calidad del proyecto).

Minimal scaffold (optional) / Scaffold mínimo (opcional):

```bash
./scripts/create-www-project.sh my-project codex --minimal-template
```

Without Spec Kit auto-init / Sin auto-init de Spec Kit:

```bash
./scripts/create-www-project.sh my-project codex --no-spec-kit
```

Full scaffold (optional) / Scaffold completo (opcional):

```bash
./scripts/create-www-project.sh my-project codex --full-template
```
