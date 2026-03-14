# Architecture decisions

<a href="../README.md"><img src="https://img.shields.io/badge/⬅️_Back_to_index-2D3139?style=for-the-badge" alt="Back to index"></a>

---

> Cross-cutting architecture decisions should be recorded centrally so any team member (or AI) can understand the "why" behind the system.

## 📐 What qualifies as an architecture decision?

Not every choice needs a formal record. Use this guide:

| Record it | Don't bother |
|---|---|
| Choosing a database technology | Naming a variable |
| Deciding on authentication strategy | Picking a CSS color |
| Selecting a deployment platform | Choosing between for/while loop |
| Defining API versioning approach | Adding a utility function |
| Cross-spec dependencies or constraints | Changes within a single spec's scope |

**Rule of thumb:** If changing this decision later would require modifying multiple specs or significant refactoring, record it.

## 📝 Decision Record Template (ADR-lite)

Use this format for each decision. Store them in `bitacora/decisiones/` with filenames like `001-auth-strategy.md`.

```markdown
# ADR-001: [Decision Title]

## Status
Accepted | Proposed | Superseded by ADR-XXX

## Context
What problem are we facing? What forces are at play?

## Options Considered
1. **Option A:** [Description] — Pros: ... / Cons: ...
2. **Option B:** [Description] — Pros: ... / Cons: ...
3. **Option C:** [Description] — Pros: ... / Cons: ...

## Decision
We chose **Option X** because [rationale].

## Consequences
- Positive: [what improves]
- Negative: [what trade-offs we accept]
- Specs affected: [list spec numbers]

## Date
YYYY-MM-DD
```

## 📚 Example decisions

### ADR-001: Authentication strategy
- **Context:** Need client-side auth for SPA + API
- **Options:** JWT in localStorage vs. httpOnly cookie vs. OAuth2 code flow
- **Decision:** httpOnly cookie with CSRF token
- **Impact:** Improved client-side security, requires CSRF middleware on all state-changing endpoints
- **Specs affected:** 001-auth, 003-api-security

### ADR-002: Database technology
- **Context:** Need persistent storage for user data and settings
- **Options:** PostgreSQL vs. MongoDB vs. SQLite
- **Decision:** PostgreSQL with Prisma ORM
- **Impact:** Strong relational support, team already familiar; requires hosting a database server
- **Specs affected:** 001-data-model, 002-user-profiles, 004-reporting

### ADR-003: Monorepo vs. multi-repo
- **Context:** Frontend and backend need to share types and API contracts
- **Options:** Monorepo (Turborepo) vs. separate repos with shared npm package
- **Decision:** Monorepo with Turborepo
- **Impact:** Easier shared type management, single CI pipeline; slightly more complex initial setup
- **Specs affected:** All specs

## 🔗 Integration with SDD workflow

- **When to create:** Before implementation, ideally during `plan.md` writing
- **Where to store:** `bitacora/decisiones/NNN-title.md`
- **How to reference:** In `spec.md` or `plan.md`, link to the ADR: "See ADR-002 for database choice"
- **When to update:** If a decision is reversed or superseded, update the status and create a new ADR
