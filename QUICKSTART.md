# ⚡ Quickstart / Inicio Rápido

> **5 steps to your first specification / 5 pasos a tu primera especificación**

---

## Step 1 · Get the template / Obtén el template

Choose one / Elige una opción:

```bash
# Option A: GitHub "Use this template" button (recommended)
# → Click "Use this template" on the GitHub page

# Option B: degit (clean copy, no git history)
npx degit juanklagos/spec-driven-development-template my-project

# Option C: git clone
git clone https://github.com/juanklagos/spec-driven-development-template.git my-project
```

```bash
cd my-project
```

---

## Step 2 · Define your idea / Define tu idea

Open `idea/IDEA_GENERAL.md` and fill out at minimum:

| Section / Sección | What to write / Qué escribir |
|---|---|
| **Project Name** | Your app or service name |
| **Problem to solve** | 1–2 sentences about the pain point |
| **Main Goal** | The single most important outcome |
| **Initial Scope (MVP)** | 3–5 bullet points of core features |

> [!TIP]
> Don't overthink it. You can refine later — SDD has a built-in refinement protocol.
> No pienses demasiado. Puedes refinar después — SDD tiene un protocolo de refinamiento integrado.

---

## Step 3 · Create your first spec / Crea tu primera spec

```bash
# Automatic (recommended)
./scripts/new-spec.sh "my-feature" "YourName"

# Manual: create specs/001-my-feature/ with these files:
# spec.md, plan.md, tasks.md, research.md, history.md
```

Then open `specs/001-my-feature/spec.md` and define:
- **Requirements** — what must be built
- **Acceptance criteria** — how you'll know it's done
- **Out of scope** — what this spec does NOT cover

---

## Step 4 · Log your first session / Registra tu primera sesión

Open `bitacora/global/PROJECT_LOG.md` and add:

```markdown
### [2026-03-14 09:00] Session 1 / Sesión 1
- Goal / Objetivo: Define initial idea and first specification
- Work completed / Trabajo realizado: Filled IDEA_GENERAL.md, created spec 001
- Decisions made / Decisiones tomadas: Chose [X] as MVP scope
- Next step / Próximo paso: Review spec and start plan.md
- Owner / Responsable: YourName
```

---

## Step 5 · Validate / Valida

```bash
./scripts/validate-sdd.sh . --strict
```

Expected output: `0 error(s)`. You're ready to build! 🎉

---

## What's next? / ¿Qué sigue?

| Need / Necesitas | Read / Lee |
|---|---|
| Understand SDD deeply | [Complete 3-level path](./docs/en/18-complete-3-level-path.md) |
| Use AI assistants | [Supported agents & prompts](./docs/en/10-supported-ai-agents-and-prompts.md) |
| Work with Lovable | [Lovable guide](./docs/en/17-working-with-lovable.md) |
| Full documentation | [docs/README.md](./docs/README.md) |

---
*Created using the [Spec-Driven Development Template](https://github.com/juanklagos/spec-driven-development-template)*
