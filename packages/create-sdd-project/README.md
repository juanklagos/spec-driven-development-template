# create-sdd-project

Scaffold a Spec-Driven Development project from [spec-driven-development-template](https://github.com/juanklagos/spec-driven-development-template) in one command. Bilingual EN/ES.

```bash
npx @juanklagos/create-sdd-project my-app                 # interactive
npx @juanklagos/create-sdd-project . --mode sidecar --yes # existing project, no prompts
npx @juanklagos/create-sdd-project my-ws --mode full      # full standalone workspace
npx @juanklagos/create-sdd-project my-app --ref main      # from a branch, not the version tag
```

- **sidecar** (default): SDD artifacts live in `<target>/spec/`, your code stays in the target root. Recommended for real projects.
- **full**: copies the complete standalone template workspace.

## Which version you get / Qué versión te llevas

`create-sdd-project@X.Y.Z` clones the `vX.Y.Z` tag, so what lands in your project is the
same content `@juanklagos/sdd-core@X.Y.Z` carries inside. That is what makes
`sdd-mcp upgrade --dry-run` report nothing right after installing.

`create-sdd-project@X.Y.Z` clona el tag `vX.Y.Z`, así que lo que llega a tu proyecto es el
mismo contenido que `@juanklagos/sdd-core@X.Y.Z` lleva dentro.

- `--ref <git-ref>` clones that branch or tag instead. If it does not exist, the install
  fails naming it and never falls back to another ref. / Clona esa rama o tag en su lugar;
  si no existe, falla nombrándola y no cae a ninguna otra.
- If the `vX.Y.Z` tag is missing from the remote (local development, a mirror without
  tags), the install continues from the default branch **and says so**. / Si el tag no
  está en el remoto, la instalación continúa desde la rama por defecto **y lo dice**.
- The ref actually used is always printed before any file is copied. / La ref utilizada
  se imprime siempre antes de copiar nada.

Requires `git` and `bash` on PATH (Node >= 18).


License: MIT. Copyright (c) 2026 Juan Carlos Alvarez Lagos.
