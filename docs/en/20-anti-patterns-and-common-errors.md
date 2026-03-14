# Anti-patterns and common errors

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

> [!CAUTION]
> These are the most frequent mistakes that break the SDD workflow. Learn them to avoid wasted sessions.

## 🚫 Critical anti-patterns

### 1. Coding before specifying

| Symptom | Impact | Fix |
|---|---|---|
| "Let me just build it real quick" | Directionless changes, scope creep | Write `spec.md` first, even if it's 10 lines |
| AI generates code without context | Hallucinated features, wrong architecture | Feed `IDEA_GENERAL.md` + active spec to the AI before asking for code |
| Skipping `plan.md` | Implementation doesn't match requirements | Always fill `plan.md` before opening your editor |

### 2. Invisible scope changes

| Symptom | Impact | Fix |
|---|---|---|
| "Oh, I also added X while I was at it" | Untracked work, broken traceability | Record every scope change in `history.md` |
| Requirements discussed only in chat/Slack | Lost decisions, conflicting understanding | Transfer decisions to `bitacora/decisiones/` |
| Changing priorities without updating INDEX | Team confusion about what's active | Update `specs/INDEX.md` status and priority immediately |

### 3. Session continuity failures

| Symptom | Impact | Fix |
|---|---|---|
| No handoff at end of session | Next session starts from scratch | Create `bitacora/handoffs/` entry every time |
| "I'll remember what I was doing" | Context loss after 24+ hours | Write it down — your future self is a stranger |
| Multiple specs in progress without tracking | Priority chaos, partial implementations | Keep `specs/INDEX.md` as single source of truth |

### 4. Template/product context confusion

| Symptom | Impact | Fix |
|---|---|---|
| AI modifies template files for a user project | Corrupted template | Clarify mode: `template maintenance` vs `project execution` |
| Creating specs for the template itself during project work | Mixed contexts | Separate repos or explicitly declare maintenance mode |

## ⚠️ Warning signals that SDD discipline is slipping

- `tasks.md` hasn't been updated in 3+ sessions
- `specs/INDEX.md` doesn't match reality
- `bitacora/` has no entries in the last week
- `history.md` shows no changes but code has evolved
- `validate-sdd.sh` hasn't been run since project start

## 📏 The one rule to remember

> **If it is not documented, it is not aligned. If it is not aligned, it will break.**
>
> **Si no está documentado, no está alineado. Si no está alineado, se va a romper.**

## 💡 Recovery protocol

If you catch yourself (or your team) breaking SDD discipline:

1. **Stop coding** immediately
2. Run `./scripts/validate-sdd.sh . --strict` to see what's missing
3. Fill the gaps: update the active spec, log decisions, create handoff
4. Only then resume implementation

This takes 15 minutes and saves hours of rework.
