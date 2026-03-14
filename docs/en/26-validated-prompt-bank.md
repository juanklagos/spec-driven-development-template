# Validated prompt bank

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

> Tested prompts that produce consistent, high-quality outputs across ChatGPT, Claude, Gemini, Copilot, and Cursor.

## 🎯 How to use this bank

1. Pick the prompt that matches your goal
2. Replace `[BRACKETS]` with your specific content
3. Paste into your preferred AI tool
4. Always include this context line first:

```text
Use https://github.com/juanklagos/spec-driven-development-template as the main guide.
Work with the idea/specs/bitacora structure. Before implementation, validate the active spec.
```

---

## Prompt 1: Convert idea to specification

**When to use:** You have a rough idea and need to formalize it into SDD structure.

```text
I have this idea: [DESCRIBE YOUR IDEA IN 2-3 SENTENCES].

Using the SDD template as reference:
1. Help me fill out idea/IDEA_GENERAL.md with: name, problem, goal, MVP scope, out of scope, target users.
2. Then create the first spec (spec.md) with: description, requirements, acceptance criteria, out of scope.
3. Create a matching plan.md with the technical approach.
4. Break down into tasks.md with 8-12 checkboxes.
5. Initialize history.md with the creation entry.

Do not skip any step. Show me the complete content for each file.
```

## Prompt 2: Split a complex idea into specs

**When to use:** Your idea is too big for a single spec and needs decomposition.

```text
Analyze this idea: [DESCRIBE YOUR COMPLEX IDEA].

1. Identify independent functional domains or features.
2. For each domain, propose a numbered spec (001, 002, 003...).
3. Define dependency order between specs.
4. For each spec, provide: title, one-paragraph description, and acceptance criteria.
5. Suggest which spec to implement first and why.
6. Do not implement any code until all ambiguities are resolved.
```

## Prompt 3: Review spec consistency

**When to use:** Before starting implementation, verify everything is aligned.

```text
Review the following SDD artifacts for consistency:
- IDEA_GENERAL.md: [paste or reference]
- spec.md: [paste or reference]
- plan.md: [paste or reference]
- tasks.md: [paste or reference]

Check for:
1. Requirements in spec.md that aren't covered by tasks in tasks.md
2. Tasks that don't map to any requirement
3. plan.md approach that conflicts with spec.md requirements
4. Missing acceptance criteria
5. Scope items that should be marked "out of scope"

Output a numbered list of gaps with specific fixes for each.
```

## Prompt 4: Generate session close (handoff + logbook)

**When to use:** At the end of every working session.

```text
I'm closing my work session. Help me generate:

1. A PROJECT_LOG.md entry with: goal, work completed, files modified, decisions made, blockers, next step, owner.
2. A handoff entry for bitacora/handoffs/ with: current state, pending items, blockers, who should pick up next.
3. Check if specs/INDEX.md needs status updates.
4. Check if history.md needs a new entry for any scope changes.

Context of this session:
- Active spec: [SPEC NUMBER AND NAME]
- What I worked on: [BRIEF DESCRIPTION]
- What's pending: [WHAT'S LEFT]
```

## Prompt 5: Adapt existing project to SDD

**When to use:** Retrofitting SDD structure into a codebase that already exists.

```text
Analyze this existing project at [PROJECT_PATH].
Do NOT modify any existing code or behavior.

1. Study the codebase and identify: main features, architecture patterns, dependencies.
2. Create idea/IDEA_GENERAL.md based on the current system's purpose.
3. Create a baseline spec (specs/001-baseline/) that documents current behavior as-is.
4. Suggest spec splits by domain if the system has multiple independent features.
5. Create an initial bitacora entry documenting this discovery session.
6. Recommend the next spec to create for evolution.
```

## Prompt 6: Resume work from previous session

**When to use:** Starting a new session after a break.

```text
I'm resuming work on my SDD project. Read in this order:
1. idea/IDEA_GENERAL.md — project vision
2. specs/INDEX.md — active specs
3. The latest file in bitacora/handoffs/ — where I left off
4. The active spec's tasks.md — current progress

Then tell me:
- What is the current state of the project?
- What should I work on next based on the handoff?
- Are there any consistency issues I should fix first?
```

---

## 📏 Output quality rules

Every AI response during SDD work should include:

1. **Session objective** — what are we doing?
2. **Active specification** — which spec are we working on?
3. **Immediate plan** — next 2-3 concrete actions
4. **Changes performed** — what was modified
5. **Validation** — did we run `validate-sdd.sh`?
6. **Exact next step** — one clear action for the next session
