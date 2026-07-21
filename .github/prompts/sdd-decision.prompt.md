---
mode: agent
description: Record one architecture decision in the decision log (mirror of /sdd:decision)
---

Capture ONE decision and write it to `bitacora/decisiones/`. Respond in the user's language (EN/ES). Ask one short question at a time.

1. Check it is worth recording: it chose between real alternatives, OR it will be expensive to reverse, OR a future reader would ask "why is it like this?". If none holds, say so and stop.
2. Interview: what was decided, context, alternatives rejected (and why), consequences, and **when to revisit** (the concrete signal that reopens it). Summarize back and get a "yes" before writing.
3. Ground every claim in evidence: a commit hash + date from `git log`, a `file:line`, a spec `history.md` entry, a `CHANGELOG.md` line, a doc in `idea/`, or the user's own words. If a rationale cannot be sourced, write that it is unsourced instead of inventing one.
4. Write `bitacora/decisiones/YYYY-MM-DD-<slug>.md` (sidecar: `./spec/bitacora/decisiones/...`) from `bitacora/templates/DECISION_TEMPLATE.md`, filling every section including **When to revisit**. Real date from `date +%F`, never a guess.
5. Link it from the active spec's `history.md`, from `bitacora/global/PROJECT_LOG.md`, and from `bitacora/decisiones/README.md`. If it supersedes an earlier record, say so in both — the old record is never deleted.

Never fabricate a rationale, a date, or an alternative that was not really on the table.

Canonical source: `.claude/commands/sdd/decision.md` — keep both in sync.
