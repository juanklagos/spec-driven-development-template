# Release checklist

<!-- sdd:doc-type:start -->

<p class="sdd-doc-type"><strong>How-to</strong> Steps for one specific job. Assumes you already know the basics.</p>

<!-- sdd:doc-type:end -->

## 🌍 Language pair / Par de idioma

- English: **09-release-checklist.md**
- Español: [../es/09-release-checklist.md](../es/09-release-checklist.md)

> [!TIP]
> For startup instructions and prompts, use:
> - [`AI_START_HERE.md`](../../AI_START_HERE.md)
> - [Prompt matrix](./19-prompt-matrix-by-goal.md)
> - [Validated prompt bank](./26-validated-prompt-bank.md)

## 🗣️ Friendly prompt (copy/paste)

```text
Using https://github.com/juanklagos/spec-driven-development-template, run a release-readiness review on my project.
My project is: [describe project].
Check this list, tell me what is missing, and propose exact next actions in simple language.
```

## What this list is for

This is **the** list to run before publishing a version, every time. Run the
commands from the repository's main folder.

There were two other lists — [39](./39-v1.2.0-preparation.md) and
[46](./46-v1.3.0-preparation.md) — written for specific releases that already
shipped. They are kept as a historical record and are not followed.

## 1. The gate first

No release without a green gate, the same way there is no code without a spec.

```bash
./scripts/check-sdd-gate.sh
```

- [ ] The gate passes: 0 errors.
- [ ] Every spec touched in this cycle is approved and its plan is consistent.
- [ ] Decisions taken are recorded in `bitacora/decisiones/`.

## 2. Code

```bash
npm run typecheck && npm run build && npm test
```

- [ ] `npm run typecheck` passes.
- [ ] `npm run build` passes.
- [ ] `npm test` passes — unit tests plus the MCP integration test.

## 3. The MCP server actually answers

The three smoke tests start the server and talk to it; they do not read the
code, they run it.

```bash
npm run mcp:smoke && npm run mcp:http:smoke && npm run mcp:pack:smoke
```

- [ ] `mcp:smoke` passes — stdio transport.
- [ ] `mcp:http:smoke` passes — Streamable HTTP.
- [ ] `mcp:pack:smoke` passes — **the important one before publishing**: it
      packs the tarball exactly as it would go to npm and runs it. This is the
      test that caught an exact internal pin making npm download the already
      published `sdd-core` instead of the one inside the tarball.

## 4. Documentation

```bash
npm run docs:types && npm run docs:links && npm run docs:contrast
```

- [ ] `docs:types` leaves no uncommitted changes — each guide's type header
      comes from `site/src/guides.mjs`, so the two cannot disagree.
- [ ] `docs:links` passes on all three surfaces: `docs/`, the npm payload and
      the built site.
- [ ] `docs:contrast` passes — no colour pair below WCAG AA.
- [ ] No statement about the interface describes something that no longer
      exists.
- [ ] English and Spanish say the same thing.

## 5. Versions aligned

The four packages and `server.json` carry **a single number**, the repository
release ([guide 37](./37-versioning-strategy.md)).

- [ ] `packages/sdd-core`, `packages/sdd-mcp`, `packages/create-sdd-project` and
      the root package match.
- [ ] `packages/sdd-mcp/server.json` matches them.
- [ ] The `sdd-mcp` pin on `sdd-core` did not fall behind.

You do not check this by eye: `release-integrity.test.ts` does, inside
`npm test`. When it fails it names the exact file to fix.

## 6. Publish

- [ ] `CHANGELOG.md` has this version's entry, saying what changed and not just
      the numbers.
- [ ] The git tag, the package versions and the changelog agree.
- [ ] The copy/paste MCP configurations in the docs match this version.

## First time only

These are from the repository's initial publication, already done. They stay
here because they serve anyone starting their own project from this template:

- [ ] `LICENSE`, `CONTRIBUTING.md` and `CODE_OF_CONDUCT.md` present.
- [ ] Issue and pull request templates in `.github/`.
- [ ] Repository description and topics set on GitHub.
- [ ] `idea/`, `specs/` and `bitacora/` with their templates, and at least one
      complete sample spec.
