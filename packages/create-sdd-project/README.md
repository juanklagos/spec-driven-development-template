# create-sdd-project

Scaffold a Spec-Driven Development project from [spec-driven-development-template](https://github.com/juanklagos/spec-driven-development-template) in one command. Bilingual EN/ES.

```bash
npx create-sdd-project my-app                 # interactive
npx create-sdd-project . --mode sidecar --yes # existing project, no prompts
npx create-sdd-project my-ws --mode full      # full standalone workspace
```

- **sidecar** (default): SDD artifacts live in `<target>/spec/`, your code stays in the target root. Recommended for real projects.
- **full**: copies the complete standalone template workspace.

Requires `git` and `bash` on PATH (Node >= 18).

> Publishing status: this package is prepared for npm but not published yet. Until then, use it from a local clone: `node packages/create-sdd-project/index.mjs <target>`.

License: PolyForm Noncommercial 1.0.0.
