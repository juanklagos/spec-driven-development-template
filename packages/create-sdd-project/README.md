# create-sdd-project

Scaffold a Spec-Driven Development project from [spec-driven-development-template](https://github.com/juanklagos/spec-driven-development-template) in one command. Bilingual EN/ES.

```bash
npx @juanklagos/create-sdd-project my-app                 # interactive
npx @juanklagos/create-sdd-project . --mode sidecar --yes # existing project, no prompts
npx @juanklagos/create-sdd-project my-ws --mode full      # full standalone workspace
```

- **sidecar** (default): SDD artifacts live in `<target>/spec/`, your code stays in the target root. Recommended for real projects.
- **full**: copies the complete standalone template workspace.

Requires `git` and `bash` on PATH (Node >= 18).


License: PolyForm Noncommercial 1.0.0.
