# 30-minute onboarding

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

> Get from zero to a validated SDD project in 30 minutes. This is your guided speed-run.

## ⏱️ Minute-by-minute plan

### 🕐 Minutes 0–5: Orientation

1. Read [`QUICKSTART.md`](../../QUICKSTART.md) — this gives you the full picture in 1 page
2. Skim [`AI_START_HERE.md`](../../AI_START_HERE.md) if you're using an AI assistant
3. Decide your mode:
   - **New project?** → Continue with Step 1 below
   - **Existing project?** → Use `adapt existing project` prompt from `QUICKSTART.md`

### 🕐 Minutes 5–12: Define your idea

4. Open `idea/IDEA_GENERAL.md`
5. Fill out these sections (don't overthink — you'll refine later):
   - **Project Name** — what's it called?
   - **Problem to solve** — 2 sentences max
   - **Main Goal** — the single most important outcome
   - **Initial Scope (MVP)** — 3–5 features as bullet points
   - **Out of Scope** — at least 2 things you will NOT build

> [!TIP]
> **AI shortcut:** paste your IDEA_GENERAL.md template to ChatGPT/Claude with:
> *"Help me fill this out for a project that [describe your idea in 1 sentence]"*

### 🕐 Minutes 12–22: Create first specification

6. Run: `./scripts/new-spec.sh "my-feature" "YourName"`
7. Open the generated `specs/001-my-feature/spec.md` and fill:
   - **Description** — what does this feature do?
   - **Requirements** — numbered list, be specific
   - **Acceptance criteria** — "The feature is done when..."
   - **Out of scope** — what this specific spec does NOT include
8. Open `plan.md` and write 3–5 sentences about your technical approach
9. Open `tasks.md` and break down the work into 5–10 checkboxes

### 🕐 Minutes 22–27: Initialize logbook

10. Open `bitacora/global/PROJECT_LOG.md`
11. Add your first session entry:
    ```markdown
    ### [YYYY-MM-DD HH:MM] Session 1
    - Goal: Set up SDD structure and define first spec
    - Work completed: Filled IDEA_GENERAL.md, created spec 001
    - Decisions: [what you decided about scope]
    - Next step: Review spec, start implementation
    - Owner: YourName
    ```

### 🕐 Minutes 27–30: Validate and celebrate

12. Run: `./scripts/validate-sdd.sh . --strict`
13. Fix any errors (there shouldn't be any if you followed the steps)
14. Commit your work:
    ```bash
    git add -A
    git commit -m "chore: initialize SDD structure with first spec"
    ```

## 🎯 Your result after 30 minutes

| What you have | Where it lives |
|---|---|
| ✅ Clear project vision | `idea/IDEA_GENERAL.md` |
| ✅ First specification | `specs/001-*/spec.md` |
| ✅ Technical plan | `specs/001-*/plan.md` |
| ✅ Task breakdown | `specs/001-*/tasks.md` |
| ✅ Session log entry | `bitacora/global/PROJECT_LOG.md` |
| ✅ Validated structure | `validate-sdd.sh` passes |

## 🤖 AI-assisted onboarding prompt

If you want the AI to guide you interactively:

```text
Using https://github.com/juanklagos/spec-driven-development-template as the main guide,
help me complete a 30-minute onboarding for my project: [DESCRIBE YOUR PROJECT].
Walk me through each step: idea definition, first spec creation, and logbook setup.
I want concrete outputs at each stage. Do not skip any steps.
```
