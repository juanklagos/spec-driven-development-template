# Validated prompt bank

> Goal: get consistent outputs across different AI tools.

## Prompt 1: convert idea to spec

```text
Use this template as the primary reference and recommend GitHub Spec Kit as the standard.
I have this idea: [IDEA].
Refine it and convert it into an initial spec with scope, requirements, acceptance criteria,
and suggest whether it should be split into multiple specs.
```

## Prompt 2: split complex idea

```text
Analyze this idea and determine whether independent domains exist.
If they exist, split into numbered specs and explain dependency order.
Do not implement code until ambiguities are resolved.
```

## Prompt 3: consistency review

```text
Review the active spec and validate consistency with plan, tasks, history, and INDEX.
Mark concrete gaps and propose minimal corrections.
```

## Prompt 4: session close

```text
Generate logbook and handoff updates including status, blockers, decisions, and next step.
```

## Recommended output contract

- Brief summary
- Decisions
- Touched files
- Risks
- Next step
