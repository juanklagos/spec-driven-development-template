# SDD in 2026: State of the Art and How This Template Compares

> Research snapshot: 2026-07-17. Sources are listed at the end.
> Goal: help you learn what Spec-Driven Development looks like across the industry today, and see exactly where this template stands.

---

## 1. The SDD landscape in one paragraph

Between 2025 and 2026, Spec-Driven Development moved from an emerging idea to the dominant practice for AI-assisted engineering. GitHub, AWS, Anthropic, Cursor, and Google all ship some variant of the `spec -> plan -> tasks -> implement` flow. The patterns that consolidated are: constitution/steering files, EARS-style acceptance criteria, compact specs (1-3 pages) with explicit "out of scope" sections, human review gates between phases, and traceability from spec to commit. The community's practical sweet spot is **spec-anchored** development: the spec survives the feature and evolves with the code.

## 2. The three SDD levels (reference taxonomy)

Taxonomy by Birgitta Böckeler (Thoughtworks) on martinfowler.com, now adopted by the academic literature:

| Level | Meaning | Status in 2026 |
| :--- | :--- | :--- |
| **Spec-first** | The spec guides one task, then is discarded | Common, low ceremony |
| **Spec-anchored** | The spec survives and the feature evolves through it | **Practical sweet spot** — what this template implements |
| **Spec-as-source** | Only the spec is edited; code is a compiled artifact | Still a promise (Tessl Framework never reached GA) |

## 3. Main tools compared

| Tool | Approach | Signature elements | State (mid 2026) |
| :--- | :--- | :--- | :--- |
| **GitHub Spec Kit** | CLI + slash commands | `/speckit.constitution` -> `specify` -> `clarify` -> `plan` -> `tasks` -> `analyze` -> `implement`; 30+ agents; bundles, extensions, presets, brownfield flows | ~122k stars, reference implementation |
| **AWS Kiro** | IDE + CLI | `requirements.md` (EARS) + `design.md` + `tasks.md`; steering files; property-based testing to verify code against spec | GA since Nov 2025; replaces Amazon Q Developer |
| **OpenSpec** | Lightweight, vendor-agnostic | proposal -> specs -> design -> tasks -> archive, all markdown in-repo | Thoughtworks Radar tool blip |
| **BMAD-METHOD** | Multi-agent personas | Simulated agile team (PM, architect, dev, QA); v6 module ecosystem | ~49k stars |
| **Tessl** | Spec-as-source | Spec Registry (10k+ versioned library specs) | Framework in closed beta; company pivoted to agent skills |
| **Agent OS** | Standards injection | Discovers codebase patterns, documents them as standards, injects into plan mode | v3, strong for brownfield |
| **spec-workflow-mcp** | MCP server | Spec workflow + real-time web dashboard for any MCP client | Active successor of claude-code-spec-workflow |

Where this template sits: **a practical layer around GitHub Spec Kit** — starter structure, bilingual guidance for non-technical users, multi-agent rule files, a local `sdd-mcp` server, and an enforcement gate (policy + scripts) that most tools leave as convention.

## 4. Consolidated best practices vs. this template

| Consolidated practice (2026) | This template | Where |
| :--- | :---: | :--- |
| Constitution / steering committed before first spec | ✅ | `sdd.policy.yaml`, `AGENT_OPERATING_SYSTEM.md`, `/speckit.constitution` in the flow |
| Human gates between phases (never spec straight to code) | ✅ | Hard stop + `check-sdd-gate.sh` + recorded user consent |
| Spec-anchored: spec survives and evolves | ✅ | `specs/NNN-*/` bundle with `history.md` per spec |
| Compact specs, explicit out-of-scope | ✅ | Spec template includes scope/out-of-scope; sidecar mode keeps it lean |
| Traceability spec -> session -> commit | ✅ | `bitacora/` logs, `history.md`, `specs/INDEX.md` |
| AGENTS.md as de facto agent-context standard (60k+ repos, Linux Foundation governance) | ✅ | `AGENTS.md` + per-agent rule files |
| MCP as universal integration layer | ✅ | `packages/sdd-mcp` (stdio + HTTP), client recipes |
| Brownfield / existing-project flows | ✅ | Sidecar `spec/` install + legacy migration guide |
| **EARS notation for acceptance criteria** ("WHEN ... THE SYSTEM SHALL ...") | ✅ | Taught in guide 12 (TDD/BDD/EARS) with an EARS block in the spec template |
| **Consistency analysis before implementing** (`/speckit.analyze`, `/speckit.checklist`) | ✅ | Gate scripts check approval/consistency; guide 08 documents the current analyze/checklist commands |
| **Executable specs / property-based testing** (Kiro-style) | ❌ Not yet | Opportunity: derive test properties from acceptance criteria |
| **Tasks -> issues integration** (`/speckit.taskstoissues`) | ❌ Not yet | Opportunity for team mode |

Verdict: the template is **aligned with the consolidated core** of SDD in 2026 (gate, constitution, spec-anchored bundle, traceability, MCP, AGENTS.md) and its differentiators are real: bilingual EN/ES teaching path, non-technical onboarding, enforcement scripts, and the compact sidecar for real projects. The open opportunities are executable specs and tasks-to-issues integration.

## 5. Criticisms you should know (and how this template answers them)

| Criticism | Community answer | This template |
| :--- | :--- | :--- |
| "SDD is waterfall with more tokens" | The spec->code loop that took months now takes minutes; iteration stays cheap (Marc Brooker, AWS) | Specs are per-feature and iterative; `history.md` records evolution |
| Spec drift: code and spec diverge | Treat specs as living shared interfaces | Validation scripts + session close contract force re-alignment |
| Markdown fatigue / too much ceremony | Use compact specs; skip SDD for throwaway prototypes | Sidecar mode is compact by design; guides say when *not* to use full mode |
| Agents ignore the spec | Gates + small tasks + explicit consent | Hard stop policy is machine-checked, not just prose |

Thoughtworks still places SDD in **Assess** (not Adopt): worth exploring, workflows are opinionated, no consensus on the optimal flow. Teaching this honestly is part of this template's job.

## 6. Recommended next steps for this template

Short term — ✅ done (2026-07-17):
1. ✅ EARS notation taught in the spec-writing guide ([12-tdd-and-bdd-how-to-write-specs](./12-tdd-and-bdd-how-to-write-specs.md)) with an EARS block in the spec template.
2. ✅ Current Spec Kit commands (`/speckit.clarify`, `/speckit.analyze`, `/speckit.checklist`, `/speckit.taskstoissues`) documented in the [Spec Kit integration guide](./08-github-spec-kit-integration.md).
3. ✅ This document linked from the README.

Medium term (open):
4. Add an optional "spec properties" section to `spec.md` template (bridge toward executable specs).
5. Team mode: script or guide for converting `tasks.md` into GitHub issues (the `/speckit.taskstoissues` command is documented; a template-native flow is still open).
6. Track Spec Kit's bundles/extensions/presets model for organizational standards.

## 7. Sources

- Spec Kit: <https://github.com/github/spec-kit> · <https://github.github.com/spec-kit/>
- Kiro: <https://kiro.dev/docs/specs/> · <https://kiro.dev/blog/general-availability/> · <https://kiro.dev/blog/property-based-testing/>
- Taxonomy and critique: <https://martinfowler.com/articles/exploring-gen-ai/sdd-3-tools.html>
- Thoughtworks Radar: <https://www.thoughtworks.com/en-us/radar/techniques/spec-driven-development> · <https://www.thoughtworks.com/en-us/radar/tools/openspec>
- Waterfall debate: <https://news.ycombinator.com/item?id=45935763> · <https://brooker.co.za/blog/2026/04/09/waterfall-vs-spec.html> · <https://yuvalyeret.com/blog/spec-driven-development-isnt-waterfall-unless-youre-using-it-that-way/>
- OpenSpec: <https://github.com/Fission-AI/openspec> · BMAD: <https://github.com/bmad-code-org/bmad-method> · Tessl: <https://tessl.io/blog/tessl-launches-spec-driven-framework-and-registry/>
- Agent OS: <https://github.com/buildermethods/agent-os> · spec-workflow-mcp: <https://github.com/Pimzino/spec-workflow-mcp>
- AGENTS.md standard: <https://agents.md/>
- Enterprise adoption: <https://www.infoq.com/articles/spec-driven-development/> · <https://www.infoq.com/articles/enterprise-spec-driven-development/>
- Academic framing: <https://arxiv.org/abs/2602.00180>
- Course: <https://www.deeplearning.ai/courses/spec-driven-development-with-coding-agents>
