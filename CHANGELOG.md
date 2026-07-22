# Changelog

All notable changes to the SDD Template will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/).

---

## [Unreleased]

---

## [v2.2.0] — 2026-07-22

### Added
- **The SDD Builder now ships inside the npm package.** Until this release `builder/dist` never left the checkout: `packages/sdd-mcp` declared `files: ["dist"]` and the frontend lives outside it, so `npm pack` produced ~72 kB with no UI at all and using the visual board required cloning the repository. Two releases went out after that was identified. The tarball is now ~311 kB and carries `dist/builder-ui/`, so `npx -p @juanklagos/sdd-mcp sdd-mcp-http` opens a working board at `http://127.0.0.1:3334/builder` with nothing cloned. The build step fails loudly when the copy is empty or partial — both mechanisms it replaces failed silently, which is how an empty frontend shipped green.
- **El SDD Builder ya viaja dentro del paquete npm.** Hasta este release `builder/dist` no salía del checkout, así que el paquete pesaba ~72 kB sin interfaz y para usar el lienzo había que clonar el repositorio. Ahora el tarball lleva `dist/builder-ui/` y el lienzo abre sin clonar nada.
- **A three-state gate verdict.** `check-sdd-gate.sh` and the MCP tools answer `open | closed | blocked` instead of a green/red binary, and the gate prints an unsuppressible line declaring what it did **not** check — namely whether the project's code corresponds to an approved spec.
- **Human titles, consent from the canvas, and a Cmd+K palette** in the builder.

### Fixed
- **A recorded mitigation existed only on paper.** [The decision to run the consumer's scripts](bitacora/decisiones/2026-07-21-action-usa-los-scripts-del-consumidor.md) rests on `.sdd/TEMPLATE_VERSION` making a stale sidecar "detectable". The installer stamped it; nothing ever read it. `action.yml` now reads it and warns when the workspace predates the action — naming both versions and the refresh command. The decision itself is not reversed: which scripts run is unchanged, and the warning never touches the exit code. Its own revisit trigger had fired, because spec 012 fixed a *correctness* fail-open rather than a policy preference.
- **`sdd_project_root` returned the wrong directory in git worktrees and submodules**, where `.git` is a file holding a pointer rather than a directory, so the `-d` test silently failed.
- **No scaffolder wrote a `.gitignore` into the target project.** Every "that file is ignored" assumption in this framework was true in this repository and false in every project it installs into — including the one that matters: the consent log is evidence and must be tracked, while the rest of `.sdd/` is machine state that must not be.
- **`init-project.sh` copied the framework's own `specs/INDEX.md`**, handing a brand-new project a table of specs belonging to somebody else. `install-spec-sidecar.sh` had been fixed; this one had not.

### Changed
- `scripts/lib/sdd-scaffold.sh` — one place for what a scaffolder writes into the project it installs into. Both scaffolders source it instead of each carrying its own copy.

### Verified
- Each fix verified by reverting it and watching its test fail · version comparison across five cases including `2.10.0` vs `2.9.0`, which a lexicographic sort inverts · scaffolders exercised against a project with its own `.gitignore` · four SDD scripts at 0 errors · `mcp:test` · `mcp:pack:smoke`

---

## [v2.1.0] — 2026-07-21

Spec 012. The gate could not tell "you may implement" apart from "nothing is approved, so there is
nothing to implement" — both were green — and two separate defects let an unapproved spec read as
approved. This release fixes that and makes the gate state its own scope on every run.

### Added
- **A three-state verdict: `open` / `closed` / `blocked`**, on `GateResult` and `GateSummary`, derived from one rule (`computeVerdict` in `sdd-core`) so bash, the MCP tools, the dashboard and the builder cannot drift apart. Errors always win. `closed` is no longer painted red — nothing approved yet is where every project starts, and colouring it as a failure teaches people to ignore the colour.
- **A posture line, printed on every run and impossible to suppress**, stating what the gate checked and — the part that matters — what it did not: *"NOT checked: whether the project code corresponds to an approved spec."* A green result can no longer mean "we did not look".
- **`--require-open`** on `check-sdd-gate.sh`: exit 2 when the gate is closed, distinguishable from the 1 that means errors. Default exit codes are unchanged, so no existing Action consumer turns red.
- **`## Ámbito de archivos / File scope`** in the spec template, parsed (`extractFileScope`), exposed on `SpecSummary.fileScope` and `sdd_list_specs`, and **enforced by nothing**. The data starts accruing now so the code-correlation spec has something real to compare a pull request diff against instead of inventing a convention later.
- **A warning when the consent log names specs that do not exist here** — the "Use this template" and `degit` case, where a new project arrives certifying approvals its owner never gave.

### Fixed
- **An unapproved spec could read as approved (fail-open).** `check-sdd-gate.sh` and `validate-sdd.sh` each carried their own greedy `sed`, which captures the LAST backtick pair on the line. On `- Estado / Status: \`Pendiente\` (target: \`approved\`)` bash extracted `approved` while `workspace.ts` extracted `Pendiente`. One implementation now (`sdd_extract_status_value`), with a drift test that compares the two extractions over an adversarial table — the previous test pinned the regex constants and never the extraction, which is how this slipped through.
- **The dashboard told users with zero approved specs that implementation was allowed.** `dash.reason.open` rendered whenever `ok` was true, and `ok` is true when nothing is approved and nothing is broken.
- **`sdd_record_user_consent` never accepted `specId`**, though `recordUserConsent` has always taken it. Every consent recorded through the MCP server — this project's own primary agent interface — landed as a markerless legacy line, silently downgrading per-spec enforcement to a warning.
- **`validate-sdd.sh --strict` compared nothing in CI.** It called `git diff --name-only` with no revision range, which only reports uncommitted changes; after a clean checkout the tree is pristine, so the check had never once fired on a pull request. It now resolves a real base (`SDD_DIFF_BASE`, then `GITHUB_BASE_REF` against the remote-tracking ref), with every git call guarded. `.github/workflows/validate.yml` gained `fetch-depth: 0`, without which the base ref is not in the checkout.
- **`reset-template.sh --confirm` left inherited approvals behind.** The documented cleanup path deleted every spec and kept the consent log, including entries with no `[spec:]` marker that permanently downgrade future consent errors. It now archives the log into `.sdd/inherited/<date>/`.
- **`check-sdd-gate.sh` parsed arguments positionally**, so `./scripts/check-sdd-gate.sh --require-open` failed with "not an SDD workspace".

### Changed
- Claims across both READMEs, the docs site taglines, guide 50, the `/sdd:gate` command files and the `llms.txt` generator now describe what the gate verifies (approval, plan consistency, recorded consent) and no longer imply it inspects code. The 16 occurrences of the hard-stop phrase are deliberately untouched: they state the rule as an instruction to an agent, which is true, and `check-sdd-policy.sh` verifies their exact wording.

### Note for TypeScript consumers
`GateResult`, `GateSummary` and `SpecSummary` gained required fields (`verdict`, `verdict`, `fileScope`). They are return types, so reading code is unaffected; only code that *constructs* one of these objects by hand needs updating.

### Verified
- Four SDD scripts at 0 errors · `mcp:test` · `mcp:pack:smoke` (tarballs installed into a throwaway project) · site build 158 pages · builder typecheck and build
- The drift test verified failing against the previous code; the schema round-trip assertion verified failing with the field removed; `--require-open` verified returning 2 on a real sidecar install over a project with existing code

---

## [v2.0.0] — 2026-07-21

### BREAKING — relicensed to MIT
- **The license changed from PolyForm Noncommercial 1.0.0 to `MIT`.** Anyone may now use this at any company, in any product, commercially, and inside an open-source project, free and without asking. The only condition is the one MIT imposes: keep the copyright notice with copies and substantial portions.

  Three things forced it. `legal/COMMERCIAL_LICENSE.md` counted internal enterprise use as commercial, so no employee could use this at work — which was the whole point of the project. GitHub reported the repository as `spdx_id: NOASSERTION`, `name: "Other"`, because PolyForm is not machine-readable: to a corporate scanner it read as *unlicensed*, a harder block than a declared restrictive license. And the noncommercial restriction violates OSI's field-of-endeavor clause, so no open-source project could incorporate a file. Relicensing cost one commit: 145 commits, one author, zero external contributors.

  Versions already published under PolyForm stay under PolyForm; this applies from 2.0.0 forward. Recorded in [`bitacora/decisiones/2026-07-21-relicencia-mit.md`](bitacora/decisiones/2026-07-21-relicencia-mit.md), which supersedes the 2026-03-12 record.
- **The three published packages now actually contain a license.** All three 1.7.0 tarballs shipped with no `LICENSE` at all. `LICENSE`, `NOTICE` and `TEMPLATE-OUTPUT.md` are now on disk in each package directory *and* listed in each `files` array — npm silently ignores `files` entries naming a path that does not exist, so both halves are required.
- **`TEMPLATE-OUTPUT.md`** — a covenant not to assert: the specs, plans, tasks, decision records and logbooks you write by filling in the templates are yours, with no attribution owed. Deliberately not a second license, so scanners see exactly one SPDX identifier in the tarball.
- **`legal/COMMERCIAL_LICENSE.md` removed**, replaced by `legal/COMMERCIAL_SUPPORT.md`: there is nothing to buy, and paid support is a service rather than a permission.
- **`legal/TRADEMARK_POLICY.md` rewritten.** It used to claim the phrase "Spec-Driven Development Template" — a generic, unregistrable term — while forbidding use of the project name as a product brand and never granting fork-and-rename. It now disclaims the generic phrase, expressly permits forking, renaming, selling and hosting, and scopes what is claimed to the author's name, handle, the `@juanklagos` npm scope and the `io.github.juanklagos` MCP namespace.
- **`legal/CLA.md` rewritten** on the Apache ICLA shape: contributor retains copyright, the grant is non-exclusive, an express patent license (there was none before, and MIT has none), outbound MIT, plus DCO sign-off. The clause stating the project "is not open source under OSI terms" is gone.
- **Scaffolders no longer copy `legal/` into the user's project.** `init-project.sh --profile=full` used to `cp -R legal/`, handing the user this project's CLA, trademark policy and enforcement policy as if they were their own; the npm framework payload shipped the same folder. Both now emit `THIRD-PARTY-NOTICES.md` through `scripts/lib/sdd-attribution.sh`, which records what the project received and under what terms. It never writes a file named `LICENSE` into the target — that slot belongs to the user.

### Added
- **`scripts/check-license-surface.sh`, wired into `.github/workflows/validate.yml` as its own job.** Checks that exactly one `LICENSE*` sits at the root (two is what makes GitHub report `NOASSERTION`), that the package copies are byte-identical to it, that every tracked manifest declares `MIT`, that `LICENSE`/`NOTICE`/`TEMPLATE-OUTPUT.md` are both listed in `files` and present on disk, that no stale license term survives on a declaration surface, and that `server.json` has not fallen behind the packages — which would make the MCP Registry advertise the wrong version. The manifest list is derived at runtime from `git ls-files`, so a new package cannot silently escape it. Advisory for one release, `--strict` to fail. Verified against five injected regressions, and it caught a real one during development.

### Changed
- Version surface swept to `2.0.0` across the root, the three packages, `server.json`, both plugin manifests, the README badges and Action snippets in both languages, and guides 35 and 37.
- Guide 31 (legal framework) inverted in both languages: the two ❌ tables became one ✅ table where companies, consultancies, paid SaaS and open-source projects are all permitted.
- `AUTHORS.md` no longer lists employers, at the copyright holder's request. The copyright line reads `Juan Carlos Alvarez Lagos` everywhere.

### Fixed
- **`npx @juanklagos/sdd-mcp` crashed instead of starting (C1).** `dist/index.js` was published without an interpreter line, so the shell reinterpreted the JavaScript (`import: command not found`). Both entrypoints (`src/index.ts`, `src/http.ts`) now begin with `#!/usr/bin/env node`, which `tsc` preserves into `dist/`. CI never caught it because every smoke test ran `node dist/index.js` explicitly, never the package as a package.
- **An npm-installed server resolved its framework root to `<project>/node_modules` (C2).** `getFrameworkRoot()` walked `../../../` up from `dist/`, which is correct in the monorepo and wrong in `node_modules`: the five `sdd://` framework resources returned raw ENOENT and `sdd_create_workspace` failed with `bash <project>/node_modules/scripts/create-www-project.sh: No such file or directory`. `@juanklagos/sdd-core` now ships a `framework/` payload (policy, entry documents, guides, spec/bitácora templates and the scaffolding scripts, built at pack time by `scripts/build-framework-payload.mjs`) and `resolveFrameworkRoot()` reports which layout is live — `repo` (checkout, always preferred), `package` (bundled payload) or `missing`. A broken install now fails with one bilingual, actionable message (`frameworkAssetError`, defined once in sdd-core and used by both the scaffolder and the MCP resources) instead of leaking ENOENT.
- **New workspaces would have been created inside `node_modules`.** `getWorkspacesRoot()` splits "where the framework assets are" from "where `./www/<project-name>` goes": the repo root in a checkout (unchanged), the current working directory when installed from npm, and `SDD_WORKSPACES_ROOT` overrides both (`create-www-project.sh` honours the same variable).
- **The HTTP transport had no executable (m6).** `dist/http.js` shipped but was unreachable from an install; added the `sdd-mcp-http` bin. `packages/sdd-mcp/README.md` documented only the repo script `npm run mcp:http:start` and now documents both bins, the environment variables, and the fact that the SDD Builder UI is checkout-only — `/builder` on an npm install answers 503 with clone instructions rather than a bare "not built yet".
- **`sdd-mcp-http` listened on every interface and accepted drive-by CSRF (C3).** `server.listen(port, ...)` passed no host, so the socket was `*:3334` while the banner printed `127.0.0.1`: anyone on the LAN could `GET /api/board` and read the whole board. Worse, any web page the user merely visited could `POST /api/spec`, `POST /api/spec/:id/approve` (bypassing the template's own gate, recording an attacker as approver) and `POST /api/spec/:id/issues` (running the user's authenticated `gh`). The server now binds `SDD_MCP_HTTP_HOST ?? "127.0.0.1"`, prints the address it actually bound plus a no-authentication warning when that is not loopback, and applies one guard (`packages/sdd-mcp/src/security.ts`) before **any** route: mutating requests from a non-loopback `Origin` get `403`, and a non-JSON content type gets `415` so browsers are forced into a preflight that never succeeds. Loopback origins on any port, and requests with no `Origin` at all (CLI and MCP clients), still pass — the local-first UX is unchanged.
- **One unauthenticated request could kill the server (C4).** `readBody` accumulated the body into a string with no cap and no `try/catch`; a 600 MB chunked `POST /mcp` raised `RangeError: Invalid string length` inside the Promise executor and took the process down. Bodies are now bounded three ways: a declared `content-length` over the cap is refused with `413` before a byte is read, bytes are counted per chunk and the socket destroyed past the cap, and decoding/parsing runs inside `try/catch`. `SDD_MCP_MAX_BODY_BYTES` (default 2 MB) tunes it, and `http.ts` installs `uncaughtException`/`unhandledRejection` handlers that log and keep serving.
- **MCP Streamable HTTP sessions were never reclaimed (I15).** Only an explicit `DELETE /mcp` removed a session, so 400 abandoned sessions cost ~225 MB and a session from 800 sessions ago still answered `tools/list`; because the transport uses `enableJsonResponse: true` there is no long-lived stream whose close would notice. Sessions are now reclaimed on `DELETE`, on transport close (chained onto the SDK's own `onclose` instead of replacing it), after an idle TTL (`SDD_MCP_SESSION_TTL_MS`, default 10 min) and by a concurrent-session cap (`SDD_MCP_MAX_SESSIONS`, default 64) that evicts the least-recently-used session. Memory is now flat under churn: 1600 sequential sessions survive a 128 MB `--max-old-space-size`.

### Added
- **HTTP hardening regression guards in `npm run mcp:http:smoke`** (already wired into `.github/workflows/mcp.yml`): the server is unreachable on a non-loopback address — with a control server on `0.0.0.0` proving the probe is not vacuous — cross-origin `POST` to `/api/spec`, `/approve` and `/issues` returns 403, a form content type returns 415, same-origin/loopback-dev/no-Origin requests still pass, an oversized body returns 413 without killing the process, and idle plus over-cap MCP sessions are reclaimed. Each assertion was verified to fail on the pre-hardening server.
- **`npm run mcp:pack:smoke` (`scripts/smoke-test-npm-package.mjs`), wired into `.github/workflows/mcp.yml`.** It packs both packages, installs the tarballs into a throwaway project, and drives `node_modules/.bin/sdd-mcp` with no interpreter — the way `npx` does — asserting a real MCP handshake, both linked bins, the bundled payload, readable `sdd://` resources and a scaffolded workspace outside `node_modules`. Verified to fail on the pre-fix code for each of the four defects above.

### Changed
- **`/dashboard` redesigned to match the builder.** Three independent design directions went through a judge panel scored on coherence, clarity, i18n and correctness. The winner opens with a gate band, then a hairline KPI grid (approved / pending / done / tasks / errors / warnings) and a responsive spec list with progress bars and localized status badges. It also carries "open builder" links per spec and one global, panels for dependency warnings and gate errors, and dark/light taken from the builder's exact tokens. Still one server-rendered page with no dependencies and no build step.
- **The dashboard now speaks one language at a time**: `resolveDashboardLang` picks `?lang=es|en`, then `Accept-Language`, then `es`; an ES|EN toggle sits in the header and syncs with the builder's stored preference. The raw `Estado / Status` string from `spec.md` moved to a tooltip, so an English page no longer shows a Spanish badge.

### Fixed
- **One spec-state rule for every surface.** The canvas card, the kanban column, the drawer's implement gating and the dashboard each derived a spec's state on their own, and they disagreed: `SpecNode`'s regex missed the feminine `Aprobada` (approved in the kanban, pending on the canvas), and a spec with every task ticked but never approved read as "done" on the canvas while the dashboard called it pending. The rule now lives once in `sdd-core` (`specTone`, approval-first: no approval, no "done") and travels in `BoardSpecCard.tone` through the REST API and the MCP tools; every surface renders that value. Regression asserts for both edge cases added to `npm run mcp:test`.


### Added
- **SDD Builder v5 — pro UX (spec 010)**: major frontend redesign driven by the author's real-use feedback.
  - **Real i18n (R1)**: no more simultaneous "Guardar / Save" double labels anywhere. New `builder/src/i18n.ts` (flat ES/EN dictionary + `useT()` hook + `translate()` for stores), language detected from `navigator.language` with a persisted **ES/EN switcher** in the TopBar and `<html lang>` kept in sync. Localized end to end: TopBar, palette, welcome tour, all modals, spec sheet, kanban, toasts, client-side errors, tooltips, aria-labels, template gallery data, ✨ assistant drafts and the copyable agent prompts (now single-language). Honest limitation: errors produced by the server (REST/MCP) are still bilingual.
  - **shadcn/ui + Tailwind v4 (R4)**: official shadcn flow on Vite (`components.json` + `npx shadcn add` — button, dialog, tabs, sheet, badge, tooltip, select, accordion, sonner, separator, scroll-area). New oklch theme keeps the 🌱 green as `--primary`, light/dark via `prefers-color-scheme`; React Flow untouched. Modals are now Radix Dialogs, the kanban toast is sonner, and the drawer became a wide non-modal **Sheet**.
  - **Full per-section spec editor (R2)**: `updateSpecSections` (sdd-core) now covers the WHOLE spec template — user story, scenarios, EARS criteria, **requirements**, **spec properties**, **success criteria** and out of scope — still surgical, EN/ES-heading tolerant and approval-preserving. `approveSpec` accepts an optional **evidence** (always wins; without it, existing evidence is never overwritten). The spec sheet has four tabs: *Summary* (tasks, implement kickoff, issues, excerpt), *Edit spec* (ordered accordion, one form per section with add/remove/reorder + the live EARS lint), *Approval* (the real block as a form: read-only status/date, approver, evidence) and *Relations*. Extended: `PUT /api/spec/:id/sections`, `POST /api/spec/:id/approve`, MCP tools `sdd_update_spec_sections` and `sdd_approve_spec`.
  - **Purposeful connections (R3)**: creating a connection immediately opens a purpose picker — **contiene** (gray, epic→spec), **depende de** (amber), **bloquea** (red), **relacionada** (blue, default) or a free-text label — with icon + color on the edge (extends spec 009; `contiene`/`contains` are now canonical in sdd-core `classifyEdgeLabel` too, persisted as `#6b7280`, and never produce dependency warnings). The sheet's *Relations* tab lists incoming/outgoing connections with type change and delete.
  - **Guide 51 (R5)**: new "Connect your agent / Conecta tu agente" section (EN/ES) with the exact per-client commands — Claude Code (`claude mcp add sdd --env SDD_PROJECT_ROOT=$(pwd) -- npx -y @juanklagos/sdd-mcp`), Codex (`config.toml`), Gemini CLI (`settings.json`), Claude Desktop/ChatGPT (HTTP connector at `http://127.0.0.1:3334/mcp` + the embedded MCP App) — noting that agent writes appear live in `/builder`.
  - Integration test extended: full-template sections asserted on disk, evidence overwrite via `sdd_approve_spec`, and the `contiene` edge color. The five `docs/assets/builder/` captures were regenerated with the new look (Playwright, 1280×800 @2x, Spanish, plant-store demo with open gate + a real `⚠ 1 dep` warning).

### Verified (spec 010)
- Root + builder builds/typecheck green · extended `mcp:test` green · 3 SDD scripts at 0 errors · fresh sidecar sandbox on `:3399` driven from a real browser: 100% Spanish UI with a full switch to English, per-section forms writing spec.md surgically (approval intact), approval with custom evidence on disk, connection → purpose picker → `contiene` + gray color persisted in `board.canvas` (undo/redo safe), smoke of tour/templates/assistant/kanban/gate/undo/PNG and dark mode.

### Added
- **MCP App: the board inside your AI client (spec 006, phase 3 / R5)**: `sdd-mcp` now ships the SDD board as an MCP App (SEP-1865, the first official MCP extension — part of the 2026-07-28 protocol release, RC frozen since 2026-05-21), built with the official [`@modelcontextprotocol/ext-apps`](https://github.com/modelcontextprotocol/ext-apps) SDK (1.7.4).
  - New tool **`sdd_board_app`** linked via `_meta.ui.resourceUri` to the new **`ui://sdd/board.html`** resource (`text/html;profile=mcp-app`; the legacy `ui/resourceUri` key is also populated for older hosts). Hosts with MCP Apps render the view inside the chat; hosts without it get the same board + gate data as JSON text (a closed gate is view data, never a tool error).
  - The view is self-contained (no CDNs), bilingual EN/ES and light/dark aware (`prefers-color-scheme` + host theme): spec cards with approval status and task progress, an SVG mini-graph of the canvas with typed colored edges, the gate semaphore, dependency warnings, and a "↻ Actualizar / Refresh" button that re-invokes `sdd_board_app` through the official App bridge (JSON-RPC over postMessage).
  - The dependency-free ext-apps browser bundle (`app-with-deps`) is inlined at resource-read time by rewriting its single trailing `export{...}` into a `globalThis` assignment (`inlineEsmExports` in `packages/sdd-mcp/src/app.ts`; fails loudly if the upstream bundle shape changes). New modules: `app.ts`, `app-ui.ts`, and `schemas.ts` (shared zod shapes extracted from `server.ts` — one source of truth for classic tools and the App tool).
  - Dependencies (modelcontextprotocol org only): `@modelcontextprotocol/ext-apps ^1.7.4` (new), `@modelcontextprotocol/sdk ^1.27.1 → ^1.29.0` (peer requirement of the Apps SDK).
  - Integration test extended over real stdio: tool `_meta` (both keys), resource listing/read with the standard MIME type, well-formed self-contained HTML with the rewritten bridge, and `sdd_board_app` returning the fixture specs plus the same `dependencyWarnings` as `sdd_gate_summary`. Guide 51 (EN/ES) documents the feature and the standard's status; what to re-check after 2026-07-28 is noted in `specs/006-visual-spec-builder/history.md`.

### Changed
- **Guide 51 (SDD Builder) rewritten as a single visual manual with real screenshots**: `docs/en/51-sdd-builder-visual-guide.md` and `docs/es/51-guia-visual-sdd-builder.md` no longer read as stacked release notes ("what's new in v2/v3/v4") — they now flow as one product walkthrough: what it is → quick start → first project with the ✨ assistant → the canvas day to day (typed edges, gate, drawer) → editing/approving (EARS editor, implement-with-agent) → team view (kanban, issues, presence) → templates → from an AI agent (MCP tools + MCP App, orchestrator prompt kept verbatim) → honest limitations → canvas→disk quick reference. All honest-limitation bullets preserved; the pending website demo moved from "Roadmap" into limitations.
  - **Five real captures** added under `docs/assets/builder/` (canvas, drawer, assistant, kanban, templates; 1280×800 @2x, light theme, 57-154 KB each), taken with Playwright against a live builder on a fresh sidecar workspace ("Tienda de plantas": 4 specs, 2 approved, typed `bloquea`/`depende de` edges producing a real `⚠ 1 dep` gate warning, populated kanban columns).
  - **`site/scripts/sync-docs.mjs`**: image links (`![](../assets/…)`) are now rewritten to `raw.githubusercontent.com` URLs so the pictures actually render on the docs site (the generic GitHub *blob* rewrite serves HTML, which breaks `<img>`).

### Verified
- Root builds + typecheck green on SDK 1.29.0 · extended `mcp:test` green · 3 SDD scripts at 0 errors · transformed bridge validated with `node --check` and executed (exposes `App`) · browser render check in light and dark (fixture data, no console errors)
- Guide rewrite: `node site/scripts/sync-docs.mjs` emits raw image URLs for guide 51 (EN and ES) · `cd site && npm run build` green (158 pages) · 3 SDD scripts at 0 errors

## [v1.7.0] — 2026-07-21

### Added
- **SDD Builder v2 — easy mode (spec 007)**: six features that let a beginner run the whole SDD loop from the canvas.
  - **Gate semaphore (R1)**: live chip in the top bar (🟢 open / 🔴 closed) with a "Validate now / Validar ahora" button running the real `checkGate` + `validateProject`; per-spec errors appear as a red `⚠ N` badge with tooltip on the affected card. Refreshes automatically on disk changes (SSE). New `getGateSummary` in `sdd-core`, `GET /api/gate`, MCP tool `sdd_gate_summary`.
  - **Approve spec from the UI (R2)**: drawer button with inline confirmation that surgically fills the existing approval block of `spec.md` (status → `Aprobado`, today's date, approver, evidence when empty) and errors clearly when the block is missing. New `approveSpec` in `sdd-core`, `POST /api/spec/:id/approve`, MCP tool `sdd_approve_spec`.
  - **Welcome tour (R3)**: five anchored steps (palette → create spec → connect → tasks/drawer → gate) with a dependency-free overlay, "Don't show again" persisted in localStorage, re-launchable from the "?" button. Bilingual.
  - **Template gallery (R4)**: Web App, API/Backend, E-commerce and SaaS playbooks (data in `builder/src/templates.ts`) that create real specs plus a tidy pre-laid-out board with labeled edges; only allowed on a workspace with zero specs.
  - **Guided spec.md editor (R5)**: "Edit" tab in the drawer with user story, acceptance scenarios, EARS criteria (prefix autocompleted on focus) and out-of-scope fields. New `updateSpecSections` in `sdd-core` replaces ONLY those headings (tolerant to the EN/ES headings of both repo templates, appends missing ones) and never touches approval or requirements. `PUT /api/spec/:id/sections`, MCP tool `sdd_update_spec_sections`.
  - **Undo/redo + PNG export (R6)**: bounded canvas history (50 snapshots) with top-bar buttons and Cmd/Ctrl+Z / Shift+Cmd/Ctrl+Z, plus "📷 PNG" export via `html-to-image` (MIT) following the documented React Flow pattern.
- Integration test (`npm run mcp:test`) extended with the three new MCP tools, asserting the surgical edits on disk (approval block filled, unrelated sections preserved) and the per-spec grouping of gate issues.
- **SDD Builder v3 — AI without API keys (spec 008)**: the builder never calls an LLM itself; heuristics cover the quick wins and real intelligence is delegated to the user's agent via copyable prompts + MCP tools.
  - **✨ Assistant "Describe your project" (R1)**: top-bar wizard that turns one sentence into a draft board — idea note, 2-4 epics and 3-6 specs grouped by detected domains (auth, payments, catalog, admin, API, notifications, profile, search; generic MVP fallback) — previewed and editable (rename/remove, "Regenerate" rotates alternative names) before anything touches the disk. Accepting runs the same real calls as the template gallery (`POST /api/spec` per spec + pre-laid-out `PUT /api/board` with labeled idea→epic→spec edges); empty workspaces only. The "Have an AI agent?" section ships a bilingual MCP orchestrator prompt (documented in guide 51) so a connected agent does the same with real intelligence (`sdd_create_spec` + `sdd_update_spec_sections` + `sdd_board_*`). New `builder/src/assistant.ts` (pure heuristic), `prompts.ts`, `AssistantWizard.tsx`; gallery and assistant now share one `applyBoardPlan` store action.
  - **🤖 "Implement with agent" (R2)**: drawer button on an approved spec opens a copy-first modal with the exact kickoff prompt (workspace, spec folder, run the SDD gate — `/sdd:gate` or the sidecar scripts —, record consent, hard stop, tick tasks, session-close contract). Disabled with the hard-stop tooltip while the spec is not approved. No fragile deep links: one prompt works for any agent. Clipboard helper survives embeds where the Clipboard API hangs (timeout + `execCommand` fallback + honest "select and copy" hint).
  - **Live EARS lint (R3)**: typing acceptance criteria in the guided editor paints each row green (EARS-shaped) or amber with a short bilingual hint — `CUANDO/WHEN/SI/IF/MIENTRAS/WHILE … DEBERÁ/SHALL` skeleton and vague words without a measurable number (rápido/fácil/intuitivo/fast/easy/user-friendly). Advisory only, never blocks saving. The rule is exported for agents as `validateEarsCriterion` in `sdd-core` (spec-actions.ts) with a documented keep-in-sync copy in `builder/src/ears.ts`; covered by `npm run mcp:test` (including the JS regex gotcha: a trailing `\b` after the accented `DEBERÁ` never matches, so the pattern ends in a `(?!\w)` lookahead).
- **SDD Builder v4 — teams (spec 009)**: the board becomes usable by a small team working on the same specs.
  - **Kanban view (R1)**: a "🗺️ Lienzo/Canvas ↔ 📋 Tablero/Board" toggle in the top bar projects the SAME store data into three columns derived from the real .md state — Borrador/Draft·Pendiente, Aprobada/Approved (backticked `Estado / Status`), Hecha/Done (all tasks ticked; same rule as the canvas card). Cards show task progress and open the same drawer. v1 is read-only for approval: dragging a card to another column changes NOTHING on disk — a toast ("La aprobación se hace en la spec / Approval happens on the spec") offers an "Abrir spec / Open spec" CTA to the drawer where the real Approve button (spec 007) lives. No new dependencies (CSS grid + the dnd-kit already shipped).
  - **Typed edges + dependency warnings (R2)**: double-clicking a connection now opens a type selector — relacionada/related (default), depende de/depends on (amber), bloquea/blocks (red), plus free-text labels as before. The type is persisted in `board.canvas` through the existing `label` field (ES and EN spellings are both canonical) with an additive JSON Canvas `color` ("3" amber / "1" red) — existing edges keep working. New `getDependencyWarnings` in `sdd-core` (board.ts): for every typed edge between two real specs, warn when the dependent spec is approved but its dependency is not (`A --depende de--> B` means A depends on B; `A --bloquea--> B` means B depends on A). Surfaced everywhere: `dependencyWarnings` field in `GET /api/gate` and in the `sdd_gate_summary` MCP tool, an amber `⚠ N dep` chip next to the gate semaphore, and an amber `⚠ dep` badge on the dependent card (canvas and kanban). Advisory only — never closes the gate. `sdd_board_connect` and the frontend both derive the edge color from the label (self-healing, keep-in-sync sets documented in `board.ts`/`convert.ts`).
  - **Tasks → GitHub issues (R3)**: a "🐙 Crear issues / Create issues" button in the drawer calls `POST /api/spec/:id/issues` → new transport module `packages/sdd-mcp/src/github.ts` (gh CLI via `execFile`, argument arrays, no shell). One issue per PENDING task with traceable title `[<specId>] <task>` and a bilingual body linking the bundle's `tasks.md`; basic idempotency by title (`gh issue list --search` narrowed + exact local prefix filter) reports created/skipped/failed per task, shown as a visual summary with issue links. Preconditions fail with clear bilingual errors the UI shows as-is (not a git repo, no remote, gh not installed, gh not authenticated, remote not resolvable as a GitHub repo).
  - **Presence over SSE (R4)**: the existing `/api/events` hub broadcasts `presence {count}` on every connect/disconnect; the top bar shows a "👥 N" chip when more than one client is viewing the workspace (tooltip "N personas viendo este workspace / people viewing this workspace"), hidden while live sync is off.
- Integration test (`npm run mcp:test`) extended for spec 009: typed-edge color persisted by `sdd_board_connect`, spec→note typed edges never warn, a real approved→unapproved "depende de" edge produces exactly one `dependencyWarnings` entry in `sdd_gate_summary` (gate stays open), and the gh issue title/body builders are exercised without ever invoking the gh CLI.

### Verified
- Root + builder builds and typecheck · extended mcp:test · 3 SDD scripts at 0 errors
- Browser verification of all three packs against fresh sandbox workspaces (screenshots)

## [v1.6.1] — 2026-07-20

### Added
- **MCP board tools (spec 006 coherence review)**: agents connected over MCP can now see and drive the same board as `/builder` — `sdd_board_read`, `sdd_board_write`, `sdd_board_connect` (idempotent labeled edges), `sdd_read_tasks`, `sdd_set_task_done`. REST API and MCP tools share one composed layer in `sdd-core` (`getBoardView`, `readSpecTasks`, `setSpecTaskDone`, `connectBoardCards`): zero duplicated logic between transports. Integration test extended to cover all five tools (toggle written to disk, edge persisted in `board.canvas`).

### Changed
- **SOLID refactor of the HTTP transport**: `packages/sdd-mcp/src/http.ts` (monolith with workspace resolution, dashboard HTML, REST, SSE, statics, and MCP transport) split into cohesive modules — `workspace.ts`, `events.ts` (SSE hub factory with `dispose()`), `dashboard.ts`, `api.ts`, `static.ts`, `transport.ts`, `http-utils.ts` — with `http.ts` as thin composition. Same routes, formats, and status codes (smoke-verified against a sandbox sidecar).
- **sdd-core internal structure**: shared workspace primitives (`resolveSddRoot`, `listSpecs`, `getFrameworkRoot`, `ensureProjectRootAllowed`) extracted to an internal `workspace.ts` module, removing the `board.ts` ↔ `index.ts` circular import; stale compiled artifacts (`src/index.js`, `src/index.js.map`, `src/index.d.ts`) removed from version control.

### Docs
- Guide 42 (EN/ES) now documents `site/`, `builder/`, and `skills/`; guide 41 (EN/ES) documents the five new board tools; guide 51 (EN/ES) and `skills/sdd-workflow/SKILL.md` mention the MCP board tools; `/sdd:help`, `/sdd:new`, and `/sdd:tutor` briefly point to the builder as the visual alternative.

## [v1.6.0] — 2026-07-20

### Added
- Packages published to npm under the author scope: [`@juanklagos/sdd-core`](https://www.npmjs.com/package/@juanklagos/sdd-core), [`@juanklagos/sdd-mcp`](https://www.npmjs.com/package/@juanklagos/sdd-mcp), and [`@juanklagos/create-sdd-project`](https://www.npmjs.com/package/@juanklagos/create-sdd-project) (the unscoped name `create-sdd-project` is taken by a third party).
- README (EN/ES): `npx @juanklagos/create-sdd-project` as the fastest no-clone start, and npx-based MCP client config.
- `sdd-mcp` 1.5.1: `mcpName` field for MCP Registry ownership validation.

- **SDD Builder (phase 1, spec 006)**: visual drag-and-drop spec builder at `http://127.0.0.1:3334/builder` — React Flow canvas with typed cards (Idea/Epic/Spec) showing status and task progress, connections with editable labels, palette, and a detail drawer with clickable task checkboxes. Markdown stays the source of truth; layout persists to `specs/board.canvas` (open JSON Canvas format). New `board` module in `sdd-core`, REST API on the HTTP transport, and `builder/` frontend (Vite + React Flow + dnd-kit, all MIT). Build once with `npm run builder:build`.

- **SDD Builder phase 2 — live sync**: `GET /api/events` (SSE) with a debounced recursive watcher on `specs/`; the builder updates cards, progress bars and the open drawer in real time when files change on disk, reconciling by stable id without touching local positions; echo-guard after own saves; live indicator with auto-reconnect and a 60s ping watchdog (detects proxy-masked disconnects); amber banner when the server workspace changed; error hints now include `SDD_PROJECT_ROOT`.

### Fixed
- `createSpec` no longer leaves a half-created bundle behind when `specs/_template/` is missing (atomic cleanup on failure).

### Changed
- Internal `@sdd/*` scope renamed to `@juanklagos/*` across packages, imports, workspace scripts, and docs.

### Verified
- `npm run build` (monorepo + builder) · 3 SDD scripts at 0 errors
- Builder phases 1-2 verified end-to-end against real sidecar workspaces (browser screenshots, live sync via SSE, atomicity fix exercised)

## [v1.5.0] — 2026-07-17

### Added
- New guide 50, "SDD in 2026: state of the art and how this template compares", based on fresh industry research (Spec Kit, Kiro, OpenSpec, BMAD, Tessl, Agent OS, community critiques, 2026 trends):
  - `docs/en/50-sdd-state-of-the-art-2026.md`
  - `docs/es/50-estado-del-arte-sdd-2026.md`
- EARS notation (industry-standard verifiable acceptance criteria) taught in guide 12 (EN/ES) with patterns table, example, and checklist; EARS blocks added to `specs/_template/spec.md` and `templates/spec/spec.template.md`.
- Spec `002-interactive-onboarding` (Level 1 of `idea/PROPUESTAS_2026-07-17.md`), user-approved and implemented:
  - Portable Agent Skill: `skills/sdd-workflow/SKILL.md` (open Agent Skills standard, readable by 32+ tools).
  - Claude Code slash commands: `.claude/commands/sdd/` — `/sdd:help` (stage router), `/sdd:new`, `/sdd:spec`, `/sdd:gate`, `/sdd:close`.
  - VS Code / Copilot mirror: `.github/prompts/sdd-{new,gate,close}.prompt.md` + `.github/instructions/sdd-specs.instructions.md` (`applyTo: specs/**`).
  - `llms.txt` at the root + generator `scripts/generate-llms-txt.sh`.
  - `.devcontainer/devcontainer.json` + "Open in Codespaces" badge in both READMEs.
  - `demo.tape` (VHS) + `.github/workflows/demo.yml` to regenerate `docs/assets/demo.gif` on release/dispatch.
  - New "Built-in commands for your AI agent" section in README (EN/ES).
- Ideas backlog from fresh ecosystem research: `idea/PROPUESTAS_2026-07-17.md` (16 proposals in 3 effort tiers).
- Spec `003-distribution-and-tutor` (Level 2 of the proposals), user-approved and implemented:
  - Claude Code plugin + own marketplace: `.claude-plugin/marketplace.json` + `.claude-plugin/plugin.json` — install with `/plugin marketplace add juanklagos/spec-driven-development-template` then `/plugin install sdd@sdd-template`.
  - Conversational tutor `/sdd:tutor` (levels 1-3, graded by the real validation scripts) + Copilot mirror.
  - GSD-style discovery interview reinforced in `/sdd:new`.
  - GitHub Action (composite) at `action.yml`: `uses: juanklagos/spec-driven-development-template@main` runs structure + policy + gate in any CI, with sidecar/standalone autodetection.
  - `packages/create-sdd-project`: zero-dependency npm scaffolder (`npx create-sdd-project`), prepared for publication.
  - README (EN/ES): tutor row, plugin install, CI snippet.

- Spec `004-site-dashboard-community` (Level 3 of the proposals), user-approved and implemented:
  - Documentation site (`site/`): Astro Starlight with EN/ES i18n, search, and auto-sync of all 51 guides from `docs/` (frontmatter injection + link rewriting); deployed to GitHub Pages at https://juanklagos.github.io/spec-driven-development-template/ via the `site` workflow.
  - Visual dashboard: `GET /dashboard` on the `sdd-mcp` HTTP transport — specs, statuses, gate state and approval count for the resolved workspace (`SDD_PROJECT_ROOT` override supported), with graceful degradation outside SDD workspaces.
  - Community: GitHub Discussions enabled, "Community" section in README (EN/ES), and completion badges in `/sdd:tutor`.
  - MCP Registry preparation: `packages/sdd-mcp/server.json` (io.github.juanklagos/sdd-mcp).

- Spec `005-learning-for-everyone`, user-approved and implemented:
  - Level badges (Beginner/Intermediate/Advanced/Reference, bilingual) on every guide in the docs site sidebar, driven by a curated map in `site/scripts/sync-docs.mjs`; landing cards link the three level paths.
  - Interactive course `aprende-sdd` (GitHub Skills format, template repo): 4 auto-graded steps ending with the real SDD gate as exam, verified end-to-end in CI including the "Use this template" path — https://github.com/juanklagos/aprende-sdd
  - Course linked from README (EN/ES) learning section and Community, and from the site landings.

### Fixed
- `demo-gif` workflow: replaced broken `charmbracelet/vhs-action@v2` (ffmpeg installer failure found in the first real run) with direct vhs/ttyd/ffmpeg installation from the Charm apt repo.

### Changed
- Guide 08 (EN/ES) updated to the current Spec Kit command set: `speckit.*` namespace note, full command table including `/speckit.clarify`, `/speckit.analyze`, `/speckit.checklist`, `/speckit.taskstoissues`, and how the optional commands fit this template's gate; optional commands also reflected in `AGENT_OPERATING_SYSTEM.md` and `AI_START_HERE.md`.
- README (EN/ES) fully reorganized for first-time visitors: "What is this?" and "Choose your door" sections first, golden rule simplified, MCP moved to an optional advanced section, three essential reads highlighted.
- `docs/README.md` now indexes all 51 guides (EN/ES) grouped by topic; removed duplicate MCP entry and the stale "Next release prep" label.
- Sidecar-first workspace guidance propagated to the canonical `AGENT_OPERATING_SYSTEM.md`, `template-context/06-AI-RULES-MATRIX.md`, and all per-agent rule files (`CLAUDE.md`, `GEMINI.md`, `WINDSURF.md`, `ROO.md`, `AIDER.md`, `.cursorrules`, `.clauderules`, `.github/copilot-instructions.md`).
- `QUICKSTART.md` external-path route now recommends `install-spec-sidecar.sh` (sidecar) and reserves `init-project.sh --profile=full` for explicit standalone mode.
- Spec `001-sdd-mcp-foundation` status updated to `Done / Completada` in `specs/INDEX.md`; `STATUS.md` regenerated.

### Fixed
- Stale `v1.4.0` version strings updated to `v1.4.1` in README badges (EN/ES), versioning strategy (doc 37), and public roadmap (doc 35); launch kit copy (doc 34) now uses generic `v1.4.x`.

### Verified
- `npm run build` · `npm run typecheck`
- `./scripts/validate-sdd.sh . --strict` · `./scripts/check-sdd-policy.sh .` · `./scripts/check-sdd-gate.sh .`
- Site build (155 pages) + GitHub Pages deploy · demo-gif workflow run · course flow end-to-end in CI

## [v1.4.1] — 2026-03-19

### Changed
- Core documentation now states explicitly that GitHub Spec Kit is the base workflow reference for this framework.
- README, docs index, and structure guides now align the real-project model with the `spec/` sidecar architecture.
- Roadmap, launch kit, and versioning docs are now aligned with the current `v1.4.x` state.

### Verified
- `npm run build`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`

## [v1.4.0] — 2026-03-19

### Added
- Exact sidecar-mode prompts to keep advanced projects clean and avoid copying the full framework repository:
  - `docs/en/49-spec-sidecar-prompts.md`
  - `docs/es/49-prompts-sidecar-spec.md`

### Changed
- The professional default architecture is now explicit:
  - project code stays in the project root
  - SDD artifacts stay in `./spec/`
  - full template copy is only for explicit standalone mode
- `sdd-core` now resolves SDD roots automatically for both:
  - classic root layout
  - compact `spec/` sidecar layout
- `sdd-mcp` resources and tools now work correctly with sidecar projects created under `./www/<project-name>/`.
- `scripts/create-www-project.sh` now invokes nested scripts through `bash` for reliable execution from MCP/Node-driven flows.
- GitMCP docs now use local relative links compatible with offline markdown link checks.

### Fixed
- MCP integration test updated for sidecar workspace outputs (`projectRoot` + `sddRoot` + `layout`).
- Local link-check failures caused by absolute filesystem links in:
  - `docs/en/47-free-external-mcp-options.md`
  - `docs/en/48-how-to-connect-this-repo-with-gitmcp.md`
  - `docs/es/47-opciones-gratis-mcp-externo.md`
  - `docs/es/48-como-conectar-este-repo-con-gitmcp.md`

### Verified
- `npm run typecheck`
- `npm run build`
- `npm run mcp:test`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`

## [v1.3.1] — 2026-03-18

### Added
- Dedicated GitMCP connection guides:
  - `docs/en/48-how-to-connect-this-repo-with-gitmcp.md`
  - `docs/es/48-como-conectar-este-repo-con-gitmcp.md`

### Changed
- README, docs index, easy MCP guide, and free external MCP guide now point explicitly to the GitMCP step-by-step path.
- GitMCP is now explained more clearly: a free external MCP that serves repository context, handy for onboarding and for understanding a codebase, and not a replacement for `sdd-mcp`.

### Verified
- `npm run build`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`

## [v1.3.0] — 2026-03-18

### Added
- Easy MCP guides for non-technical users:
  - `docs/en/43-easy-mcp-guide.md`
  - `docs/es/43-guia-mcp-facil.md`
- Hosted onboarding MCP model docs:
  - `docs/en/44-hosted-mcp-onboarding-model.md`
  - `docs/es/44-modelo-onboarding-mcp-alojado.md`
- Client visual examples for easy MCP:
  - `docs/en/45-client-visual-examples-for-easy-mcp.md`
  - `docs/es/45-ejemplos-visuales-clientes-mcp-facil.md`
- Next release preparation docs:
  - `docs/en/46-v1.3.0-preparation.md`
  - `docs/es/46-preparacion-v1.3.0.md`
- Easy MCP resource:
  - `sdd-easy-mcp-guide`
- Easy MCP prompts:
  - `easy_start_project`
  - `easy_create_spec`
  - `easy_show_structure`
  - `easy_validate_project`
  - `easy_show_next_step`
  - `easy_close_session`

### Changed
- README, docs index, AI start guide, and MCP references now surface the easy path before the deep technical path.
- Media kit positioning now includes easy MCP onboarding.
- Internal package versions are now aligned with the framework release:
  - `@sdd/sdd-core` → `1.3.0`
  - `@sdd/sdd-mcp` → `1.3.0`

### Verified
- `npm run typecheck`
- `npm run build`
- `npm run mcp:smoke`
- `npm run mcp:http:smoke`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`

## [v1.2.0] — 2026-03-18

### Added
- Dedicated MCP CI workflow:
  - `.github/workflows/mcp.yml`
- MCP integration test covering:
  - workspace creation
  - spec creation
  - validation
  - gate checks
  - status and roadmap generation
  - project log and resource reads
- Public roadmap docs:
  - `docs/en/35-public-roadmap.md`
  - `docs/es/35-roadmap-publico.md`
- Tested client setup recipes:
  - `docs/en/36-client-setup-recipes.md`
  - `docs/es/36-recetas-setup-clientes.md`
- Versioning strategy docs:
  - `docs/en/37-versioning-strategy.md`
  - `docs/es/37-estrategia-versionado.md`
- Media/public launch assets:
  - `docs/assets/social-preview.svg`
  - `docs/en/38-media-kit.md`
  - `docs/es/38-kit-medios.md`
- Next release preparation docs:
  - `docs/en/39-v1.2.0-preparation.md`
  - `docs/es/39-preparacion-v1.2.0.md`
- Adoption-oriented GitHub issue templates:
  - `bug-report`
  - `use-case`
- End-to-end example:
  - `examples/002-mcp-end-to-end/`

### Changed
- Internal package versions are now aligned with the framework release:
  - `@sdd/sdd-core` → `1.2.0`
  - `@sdd/sdd-mcp` → `1.2.0`
- README and docs index now surface:
  - roadmap
  - client setup recipes
  - versioning strategy
  - media kit
  - next release prep
- Fixed `sdd_create_spec` to create the spec directory before creating `contracts/`.
- Repository positioning is now stated plainly: an operational SDD framework with AI guidance, the GitHub Spec Kit as reference, and MCP support.

### Verified
- `npm run typecheck`
- `npm run build`
- `npm run mcp:smoke`
- `npm run mcp:http:smoke`
- `npm run mcp:test`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`

## [v1.1.0] — 2026-03-18

### Added
- `packages/sdd-core` as typed reusable SDD logic for workspace, spec, validation, gate, roadmap, status, and logbook operations.
- `packages/sdd-mcp` as a real MCP server with:
  - `stdio` transport
  - `Streamable HTTP` transport
  - 12 operational tools
  - static resources plus active project resource templates
  - beginner-friendly MCP prompts
- MCP smoke tests for both transports:
  - `npm run mcp:smoke`
  - `npm run mcp:http:smoke`
- Copy/paste client configuration examples for:
  - Cursor
  - Claude Code
  - Codex
- Root `.mcp.json` so the repository can be connected quickly in project-scoped MCP workflows.
- Bilingual MCP setup guides:
  - `docs/en/33-mcp-server-guide.md`
  - `docs/es/33-guia-servidor-mcp.md`
- Launch kit docs for diffusion and reuse:
  - `docs/en/34-launch-kit.md`
  - `docs/es/34-kit-lanzamiento.md`

### Changed
- README and README.es now surface MCP as a first-class entry point with links to setup guides and copy/paste configs.
- MCP tools now expose `outputSchema` and return `structuredContent` for stronger client compatibility.
- Project context is now available through MCP resource templates for:
  - `specs/INDEX.md`
  - project log
  - latest handoff
  - project idea
  - per-spec documents

### Verified
- `npm run typecheck`
- `npm run build`
- `npm run mcp:smoke`
- `npm run mcp:http:smoke`
- `./scripts/validate-sdd.sh . --strict`
- `./scripts/check-sdd-policy.sh .`
- `./scripts/check-sdd-gate.sh .`

## [v1.0.1] — 2026-03-14

### Added
- `scripts/check-sdd-gate.sh` to enforce SDD implementation gate checks before coding.
- `template-context/09-SPECKIT-STANDARDIZATION-PLAN.md` with phased roadmap to evolve into a Spec Kit-centered framework.

### Changed
- **Spec Kit-first workflow standardization** across scripts and docs.
- `scripts/init-project-with-spec-kit.sh` now prioritizes `specify`, then `uv tool install`, then `uvx`.
- `scripts/init-project.sh` now propagates AI rule files, template context, and `check-sdd-gate.sh` into initialized projects.
- CI workflow now validates canonical AI rule assets and runs both:
  - `./scripts/validate-sdd.sh . --strict`
  - `./scripts/check-sdd-gate.sh .`
- AI rules now use `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md` as canonical source.
- Updated onboarding docs (`README.md`, `AGENTS.md`, `AI_START_HERE.md`, `QUICKSTART.md`, Spec Kit integration docs EN/ES) to include SDD gate and Spec Kit-first flow.
- Updated templates:
  - `specs/_template/spec.md` approval status fields clarified.
  - `specs/_template/plan.md` now includes dependencies, milestones, and risks sections.

### Removed
- References to deprecated root-level instruction files in active rule paths.

---

## [v1.0.0] — 2026-03-14

### 🎉 Initial Stable Release

#### Added
- **QUICKSTART.md** — 1-page, 5-step bilingual quick start guide for new users
- **CHANGELOG.md** — This file, tracking all version changes
- **scripts/reset-template.sh** — Clean reset script for starting fresh projects
- **Dogfooding:** `idea/IDEA_GENERAL.md` filled with the template's own vision and goals
- **Dogfooding:** `bitacora/global/PROJECT_LOG.md` populated with real session entries
- **Pre-commit hook** support via `.githooks/pre-commit`
- Version badge in README

#### Improved
- **10 documentation guides enriched** (docs 20-24, 26-29, 31 in EN + ES):
  - Anti-patterns guide with real scenarios and recovery protocol
  - Quality checklists with stage gates and daily routine
  - Team mode guide with roles, branch strategy, and communication protocol
  - 30-minute onboarding as minute-by-minute walkthrough
  - Architecture decisions with ADR-lite template and 3 examples
  - Validated prompt bank expanded to 6 tested prompts
  - Project type playbooks with detailed spec partitions
  - Legacy migration guide with 4-phase workflow and mermaid diagrams
  - Status dashboard guide with complete script documentation
  - Legal framework with clear allowed/restricted use tables
- **init-project.sh** — Now prints bilingual output (EN + ES)
- **validate-sdd.sh** — Improved IDEA_GENERAL.md content check (detects unfilled templates)
- **STATUS.md** — Cleaned to be a proper empty template instead of fake data
- **README.md** — Added Quickstart badge, version badge, and `degit` instructions

#### Changed
- **Legal files** moved to `legal/` directory (except LICENSE and NOTICE) to reduce root noise
- Updated legal document links throughout docs and README

#### Fixed
- STATUS.md no longer shows data from non-existent example spec

---

## [v0.9.0] — 2026-03-12

### Repository Polish & Audit (Pre-release)

#### Added
- `.gitkeep` files in `bitacora/diaria/`, `bitacora/handoffs/`, `bitacora/decisiones/`
- `.gitkeep` in `specs/_template/contracts/`, `playbooks/`, `examples/`
- GitHub Actions CI workflow (`validate.yml`)
- Golden Example: Weather App (`examples/001-weather-app-sdd/`)
- Examples: `new-project-example` and `adapt-existing-project-example`
- `template-context/` directory with 7 AI context files
- Guided prompts in `IDEA_GENERAL.md` template

#### Improved
- README restructured around a table that points to the docs by topic
- docs/README.md reorganized into 4 categories
- Bilingual documentation (EN/ES) for all 32 guides
