---
description: Record one architecture decision in the decision log (what, why, what was rejected, when to revisit) / Registra una decisión de arquitectura en la bitácora de decisiones
argument-hint: [decision in one sentence]
---

Capture ONE decision and write it to the decision log. Respond in the user's language (EN/ES). Ask one short question at a time; never dump the whole questionnaire at once.

1. **Check it is worth recording.** A decision belongs in the log when at least one is true:
   - it chose between real alternatives (something else was actually on the table),
   - it will be expensive to reverse (multiple specs, migration, contract or license change),
   - a future reader would ask *"why is it like this?"* and the code alone would not answer.
   If none holds, say so and stop — a task note in `history.md` is enough. Do not pad the log.

2. **Interview the user** (skip anything `$ARGUMENTS` already answers):
   - **What was decided** — one sentence, in the imperative or the past tense, no hedging.
   - **Context** — what problem forced the choice? what was true at that moment?
   - **Alternatives** — what else was really considered, and why each was rejected. "None" is a valid answer; write "no alternatives were considered" rather than inventing a straw man.
   - **Consequences** — what improves, what trade-off is accepted, which specs/files are affected.
   - **When to revisit** — the concrete signal that should reopen this decision (a benchmark, a date, a dependency, a limit being hit).
   Summarize back in 5 bullets and get a "yes" before writing.

3. **Ground every claim in evidence.** Each rationale MUST point at a source: a commit (`hash` + date from `git log`, never a guessed date), a `file:line`, a spec `history.md` entry, a `CHANGELOG.md` line, a document in `idea/`, or the user's own words in this session. If a claim cannot be sourced, write it down as unsourced (*"no written rationale exists; reconstructed from the diff"*) instead of inventing one. A false decision record is worse than no record.

4. **Write the file**:
   - Path: `bitacora/decisiones/YYYY-MM-DD-<slug>.md` (sidecar projects: `./spec/bitacora/decisiones/...`).
   - Date: today's real date (`date +%F`), or the date of the commit the decision actually landed in if you are recording it after the fact.
   - Slug: short kebab-case, in the user's language, describing the decision — not the feature (`no-desktop-app`, not `desktop`).
   - Structure: copy `bitacora/templates/DECISION_TEMPLATE.md` and fill every section, including **When to revisit**. Keep the bilingual headings.

5. **Link it back**: mention the record in the active spec's `history.md` and in `bitacora/global/PROJECT_LOG.md`, and reference related records by filename when a decision extends, narrows or supersedes an earlier one. If it supersedes one, say so in both files — the old record stays, it is not deleted.

6. Confirm to the user with the path written and a one-line summary, and offer to add it to `bitacora/decisiones/README.md`.

Never fabricate a rationale, a date, or an alternative that was not really on the table. The value of this log is that it is true. / Nunca inventes justificación, fecha ni alternativa: el valor de esta bitácora es que es verdadera.
