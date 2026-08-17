# Public roadmap

<!-- sdd:doc-type:start -->

<p class="sdd-doc-type"><strong>Project</strong> Repository material: roadmap, releases and audits. Not product documentation.</p>

<!-- sdd:doc-type:end -->

## Purpose

This roadmap puts in writing where the framework is going, so nobody has to work
it out by reading commits.

## Where to look for what

This document does **not** track published versions. That list rots: one more
release and it lies. The numbers live where they are generated:

| What you want to know | Where it is |
| :--- | :--- |
| Which version is the latest | The [releases page](https://github.com/juanklagos/spec-driven-development-template/releases) |
| What changed in each one | [`CHANGELOG.md`](../../CHANGELOG.md) |
| What is being built right now | [`specs/INDEX.md`](../../specs/INDEX.md) — every spec with its status |
| Why something is the way it is | `bitacora/decisiones/` |

## What is already settled

The SDD framework with its multi-agent policy and the gate that enforces it. The
`spec/` sidecar for projects that already exist. Typed `sdd-core` and `sdd-mcp`
published on npm, with `stdio` and `Streamable HTTP`. The visual board, both as a
desktop app and in the browser. Connecting an agent in one step. And a test line
that runs the server rather than reading it.

## What is missing

This comes from the open specs, not from an intention. Every point can be checked
at its source:

- **The `npx` route for the one-command launcher.** Spec 011 is in progress: T1,
  T2 and T7 are done; T3–T6 and T8 remain.
- **Signing the desktop app on Windows.** There is a free path for OSI-approved
  licences, which MIT meets, and it is pending application. On macOS it is a
  decision, not an oversight: the Apple certificate costs 99 USD a year and one
  person maintains the project.
- **Browsing the documentation by type.** Deliberately out of scope in spec 035:
  index pages per document type, filtering search by type — which needs a
  Pagefind component — and the right-hand table of contents with a progress bar.

What is not in `specs/INDEX.md` is not planned. If something here matters to you,
an issue is the place to ask for it.

## The criteria that do not change

- GitHub Spec Kit remains the external reference for the workflow.
- A new feature has to **remove** friction. If it adds installation steps, it
  does not ship.
