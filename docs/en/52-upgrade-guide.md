# Upgrade guide

<!-- sdd:doc-type:start -->

> **How-to** · Steps for one specific job. Assumes you already know the basics.

<!-- sdd:doc-type:end -->

## Purpose

Bring a project that already uses SDD up to date, knowing in advance what gets
touched and what is yours. Before spec 029 there was no upgrade path: there was
the side effect of reinstalling, with no name and no warning.

## The rule, in one sentence

**Framework files are repaired; yours are not touched unless you ask.**

## Look before it touches anything

```bash
npx @juanklagos/sdd-mcp@latest upgrade --project-root . --dry-run
```

It writes nothing. It tells you which version you have installed, which one the
server brings, which files it would repair and — the part that matters — which
ones are yours and differ from the new version.

## Apply

```bash
npx @juanklagos/sdd-mcp@latest upgrade --project-root .
```

Repairs framework files, recreates missing ones, leaves yours untouched and
moves `.sdd/TEMPLATE_VERSION`. If you are already up to date it writes nothing
and says so.

## What is "framework" and what is "yours"

| Group | Files | What the upgrade does |
| :--- | :--- | :--- |
| **Framework** | `scripts/check-sdd-gate.sh`, `check-sdd-policy.sh`, `validate-sdd.sh`, `confirm-user-consent.sh`, `new-spec.sh`, `scripts/lib/*` | Always repaired, no questions |
| **Yours** | `sdd.policy.yaml`, `specs/_template/*`, `template-context/*`, `bitacora/` templates, `AGENTS.md` and friends | Never written without `--apply` |

The framework group is the machinery that enforces the rules: a stale — or
tampered — copy is a broken gate. Spec 021 watched an `exit 0  # TAMPERED`
survive a reinstall byte for byte.

## Adopting the new version of a file of yours

When the upgrade tells you `sdd.policy.yaml` differs, you have three ways out:
leave it (the default), diff it yourself, or adopt the new version **losing your
edits in that file**:

```bash
npx @juanklagos/sdd-mcp@latest upgrade --project-root . --apply sdd.policy.yaml
```

It accepts several, comma-separated.

## From the agent

With the MCP connected (see [guide 51](./51-sdd-builder-visual-guide.md)):

- `sdd_check_version` — the comparison, writing nothing.
- `sdd_upgrade` — with `dryRun: true` first, and `applyPreserved: ["..."]` for
  the files of yours you decide to adopt.

## From the canvas

When the project is behind, the builder shows a strip with both versions and the
exact command. It only warns: running the upgrade is yours.

## Why the version number is not enough

`upToDate` compares **content**, not just the marker's number. A project can say
`template_version=2.4.0` and have a tampered gate; to this tool that is not up
to date.

## If the scaffolder stops you

`npx @juanklagos/create-sdd-project@latest .` on a project that already has
`spec/` overwrites nothing: it names the upgrade command for you. That is the
path.
