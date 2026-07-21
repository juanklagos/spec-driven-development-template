#!/usr/bin/env bash
set -euo pipefail

if [ "$#" -lt 1 ] || [ "$#" -gt 2 ]; then
  echo "Usage: $0 /path/to/project [--profile=minimal|recommended]"
  echo "Example: $0 /absolute/path/to/project"
  echo "Example: $0 ./www/my-project --profile=recommended"
  exit 1
fi

TARGET="$1"
PROFILE="recommended"
if [ "${2:-}" != "" ]; then
  case "$2" in
    --profile=minimal) PROFILE="minimal" ;;
    --profile=recommended) PROFILE="recommended" ;;
    *)
      echo "Error: unsupported profile: $2"
      echo "Use --profile=minimal or --profile=recommended"
      exit 1
      ;;
  esac
fi

SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"
ROOT_DIR="$(cd "$SCRIPT_DIR/.." && pwd)"
source "$SCRIPT_DIR/lib/sdd-attribution.sh"

TARGET_PARENT="$(dirname "$TARGET")"
mkdir -p "$TARGET_PARENT"
TARGET_ABS="$(cd "$TARGET_PARENT" && pwd)/$(basename "$TARGET")"

if [ "$TARGET_ABS" = "$ROOT_DIR" ]; then
  echo "Error: refusing to install sidecar in the framework root."
  exit 1
fi

case "$TARGET_ABS/" in
  "$ROOT_DIR/"*)
    case "$TARGET_ABS/" in
      "$ROOT_DIR/www/"*) ;;
      *)
        echo "Error: targets inside this repository must live under ./www/<project-name>."
        exit 1
        ;;
    esac
    ;;
esac

SPEC_ROOT="$TARGET_ABS/spec"
mkdir -p "$TARGET_ABS" \
         "$SPEC_ROOT/idea" \
         "$SPEC_ROOT/specs/_template/contracts" \
         "$SPEC_ROOT/bitacora/global" \
         "$SPEC_ROOT/bitacora/diaria" \
         "$SPEC_ROOT/bitacora/handoffs" \
         "$SPEC_ROOT/bitacora/decisiones" \
         "$SPEC_ROOT/bitacora/templates" \
         "$SPEC_ROOT/.sdd" \
         "$SPEC_ROOT/.github" \
         "$SPEC_ROOT/template-context/core-instructions" \
         "$SPEC_ROOT/scripts/lib" \
         "$TARGET_ABS/.github"

# Never clobber content the user may have edited — but never abort either.
#
# This used to be `cp -n`, whose BSD implementation (macOS, verified
# 2026-07-21) exits 1 when the destination already exists. Under `set -e` that
# turned the FIRST already-installed file into a silent death: a second run of
# the installer printed nothing at all and exited 1, so re-running it — which
# QUICKSTART.md, both READMEs and docs/{en,es}/51-*.md all tell users to do —
# repaired nothing.
copy_if_absent() {
  [ -e "$2" ] || cp "$1" "$2"
}

# Framework-owned files. These are OURS: the gate, the validators and the root
# resolver they share. A stale copy from an older template — or a tampered one
# (verified 2026-07-21: `exit 0  # TAMPERED` in check-sdd-gate.sh survived a
# reinstall byte-for-byte) — is a broken gate, so reinstalling repairs them.
copy_framework_file() {
  cp -f "$1" "$2"
}

copy_if_absent "$ROOT_DIR/templates/sidecar/README.md" "$SPEC_ROOT/README.md"
copy_if_absent "$ROOT_DIR/templates/sidecar/AGENTS.md" "$SPEC_ROOT/AGENTS.md"
copy_if_absent "$ROOT_DIR/templates/sidecar/AI_START_HERE.md" "$SPEC_ROOT/AI_START_HERE.md"
copy_if_absent "$ROOT_DIR/templates/sidecar/INSTRUCTIONS.md" "$SPEC_ROOT/INSTRUCTIONS.md"
copy_if_absent "$ROOT_DIR/templates/sidecar/sdd.policy.yaml" "$SPEC_ROOT/sdd.policy.yaml"
copy_if_absent "$ROOT_DIR/templates/sidecar/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md" \
  "$SPEC_ROOT/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md"

copy_if_absent "$ROOT_DIR/idea/IDEA_GENERAL.md" "$SPEC_ROOT/idea/IDEA_GENERAL.md"
copy_if_absent "$ROOT_DIR/specs/README.md" "$SPEC_ROOT/specs/README.md"
# Write a clean spec index for the new workspace instead of copying the
# framework repo index (which carries this template's own spec rows).
if [ ! -f "$SPEC_ROOT/specs/INDEX.md" ]; then
  cat > "$SPEC_ROOT/specs/INDEX.md" << 'INDEXEOF'
# Specification Index / Índice de especificaciones

| Number / Número | Name / Nombre | Status / Estado | Priority / Prioridad | Owner / Responsable | Updated / Actualización |
|---|---|---|---|---|---|
INDEXEOF
fi
copy_if_absent "$ROOT_DIR/specs/_template/spec.md" "$SPEC_ROOT/specs/_template/spec.md"
copy_if_absent "$ROOT_DIR/specs/_template/plan.md" "$SPEC_ROOT/specs/_template/plan.md"
copy_if_absent "$ROOT_DIR/specs/_template/tasks.md" "$SPEC_ROOT/specs/_template/tasks.md"
copy_if_absent "$ROOT_DIR/specs/_template/research.md" "$SPEC_ROOT/specs/_template/research.md"
copy_if_absent "$ROOT_DIR/specs/_template/history.md" "$SPEC_ROOT/specs/_template/history.md"
copy_if_absent "$ROOT_DIR/specs/_template/contracts/README.md" "$SPEC_ROOT/specs/_template/contracts/README.md"
copy_if_absent "$ROOT_DIR/bitacora/README.md" "$SPEC_ROOT/bitacora/README.md"
copy_if_absent "$ROOT_DIR/bitacora/global/PROJECT_LOG.md" "$SPEC_ROOT/bitacora/global/PROJECT_LOG.md"
copy_if_absent "$ROOT_DIR/bitacora/templates/DAILY_TEMPLATE.md" "$SPEC_ROOT/bitacora/templates/DAILY_TEMPLATE.md"
copy_if_absent "$ROOT_DIR/bitacora/templates/HANDOFF_TEMPLATE.md" "$SPEC_ROOT/bitacora/templates/HANDOFF_TEMPLATE.md"
copy_if_absent "$ROOT_DIR/bitacora/templates/DECISION_TEMPLATE.md" "$SPEC_ROOT/bitacora/templates/DECISION_TEMPLATE.md"

# Keep the empty logbook folders alive through git clones: validate-sdd.sh
# requires them, and git does not track empty directories.
for keep_dir in global diaria handoffs decisiones; do
  [ -f "$SPEC_ROOT/bitacora/$keep_dir/.gitkeep" ] || : > "$SPEC_ROOT/bitacora/$keep_dir/.gitkeep"
done

# Seed a clean, empty decision index for the new workspace instead of copying
# this framework's own records.
if [ ! -f "$SPEC_ROOT/bitacora/decisiones/README.md" ]; then
  cat > "$SPEC_ROOT/bitacora/decisiones/README.md" << 'DECIDXEOF'
# Decision log / Bitácora de decisiones

EN: One file per decision, `YYYY-MM-DD-<slug>.md`, from `../templates/DECISION_TEMPLATE.md`.
ES: Un archivo por decisión, `YYYY-MM-DD-<slug>.md`, desde `../templates/DECISION_TEMPLATE.md`.

Record a decision when **any** of these is true / Registra una decisión cuando se cumpla **alguna**:

- it chose between real alternatives / eligió entre alternativas reales;
- it will be expensive to reverse / revertirla será caro;
- a future reader would ask *"why is it like this?"* / alguien preguntará después *"¿por qué es así?"*.

Every rationale points at a source (commit, `file:line`, spec history, CHANGELOG, `idea/`). If none exists, say so — never invent one.
Cada justificación apunta a una fuente. Si no existe, dilo — nunca la inventes.

Use `/sdd:decision` to capture one interactively. / Usa `/sdd:decision` para capturarla conversando.

## Records / Registros

| Date / Fecha | Decision / Decisión | File / Archivo |
|---|---|---|
DECIDXEOF
fi
copy_if_absent "$ROOT_DIR/.sdd.README.template.md" "$SPEC_ROOT/.sdd/README.md"

# The gate and its dependencies are refreshed on every install, not preserved:
# they are the enforcement machinery, not user content.
copy_framework_file "$ROOT_DIR/scripts/lib/sdd-root.sh" "$SPEC_ROOT/scripts/lib/sdd-root.sh"
copy_framework_file "$ROOT_DIR/scripts/lib/sdd-attribution.sh" "$SPEC_ROOT/scripts/lib/sdd-attribution.sh"
copy_framework_file "$ROOT_DIR/scripts/validate-sdd.sh" "$SPEC_ROOT/scripts/validate-sdd.sh"
copy_framework_file "$ROOT_DIR/scripts/check-sdd-policy.sh" "$SPEC_ROOT/scripts/check-sdd-policy.sh"
copy_framework_file "$ROOT_DIR/scripts/check-sdd-gate.sh" "$SPEC_ROOT/scripts/check-sdd-gate.sh"
copy_framework_file "$ROOT_DIR/scripts/confirm-user-consent.sh" "$SPEC_ROOT/scripts/confirm-user-consent.sh"
copy_framework_file "$ROOT_DIR/scripts/new-spec.sh" "$SPEC_ROOT/scripts/new-spec.sh"
chmod +x "$SPEC_ROOT/scripts/validate-sdd.sh" \
         "$SPEC_ROOT/scripts/check-sdd-policy.sh" \
         "$SPEC_ROOT/scripts/check-sdd-gate.sh" \
         "$SPEC_ROOT/scripts/confirm-user-consent.sh" \
         "$SPEC_ROOT/scripts/new-spec.sh"

if [ "$PROFILE" = "recommended" ]; then
  mkdir -p "$SPEC_ROOT/template-context/prompts"
  copy_if_absent "$ROOT_DIR/template-context/README.md" "$SPEC_ROOT/template-context/README.md"
  copy_if_absent "$ROOT_DIR/template-context/05-SDD-EXECUTION-GATE.md" "$SPEC_ROOT/template-context/05-SDD-EXECUTION-GATE.md"
  copy_if_absent "$ROOT_DIR/template-context/06-AI-RULES-MATRIX.md" "$SPEC_ROOT/template-context/06-AI-RULES-MATRIX.md"
  cp -R "$ROOT_DIR/templates/." "$SPEC_ROOT/templates"
fi

# Version stamp, written unconditionally so a sidecar can always say what
# template it was installed from and when it was last refreshed. Nothing
# recorded this before: `grep -rn "TEMPLATE_VERSION"` across the repo returned
# nothing, so a sidecar carrying a two-releases-old gate looked identical to a
# current one.
#
# Two homes for the version: a checkout has package.json at ROOT_DIR, while an
# npm install runs from packages/sdd-core/framework/, whose package.json is one
# level up. Reading only the first made this script die under `set -e` inside
# the published tarball.
read_template_version() {
  local candidate
  for candidate in "$ROOT_DIR/package.json" "$ROOT_DIR/../package.json"; do
    if [ -f "$candidate" ]; then
      sed -n 's/.*"version"[[:space:]]*:[[:space:]]*"\([^"]*\)".*/\1/p' "$candidate" | head -n 1
      return 0
    fi
  done
  printf "unknown\n"
}
TEMPLATE_VERSION="$(read_template_version)"
cat > "$SPEC_ROOT/.sdd/TEMPLATE_VERSION" <<EOF
template_version=${TEMPLATE_VERSION:-unknown}
profile=$PROFILE
installed_at=$(date '+%Y-%m-%d %H:%M:%S %z')
source=https://github.com/juanklagos/spec-driven-development-template
EOF

write_sidecar_md_rule() {
  local dest="$1"
  cat > "$dest" <<'EOF'
# Sidecar AI Rule

Canonical source:
- `template-context/core-instructions/AGENT_OPERATING_SYSTEM.md`

No code before approved spec and consistent plan.
Use spec/ as the SDD sidecar and keep runnable code in project root.
This is the recommended default workspace inside a real project.

Read:
- `AGENTS.md`
- `AI_START_HERE.md`
- `INSTRUCTIONS.md`
EOF
}

write_sidecar_text_rule() {
  local dest="$1"
  cat > "$dest" <<'EOF'
Canonical source: template-context/core-instructions/AGENT_OPERATING_SYSTEM.md
No code before approved spec and consistent plan.
Use spec/ as the SDD sidecar and keep runnable code in project root.
This is the recommended default workspace inside a real project.
EOF
}

write_sidecar_md_rule "$SPEC_ROOT/CLAUDE.md"
write_sidecar_md_rule "$SPEC_ROOT/GEMINI.md"
write_sidecar_md_rule "$SPEC_ROOT/WINDSURF.md"
write_sidecar_md_rule "$SPEC_ROOT/AIDER.md"
write_sidecar_md_rule "$SPEC_ROOT/ROO.md"
write_sidecar_text_rule "$SPEC_ROOT/.cursorrules"
write_sidecar_text_rule "$SPEC_ROOT/.clauderules"
write_sidecar_text_rule "$SPEC_ROOT/.github/copilot-instructions.md"

# A stub we wrote carries this marker, so re-installing does not report our own
# files back to the user as if they were theirs (verified 2026-07-21: a second
# install warned about all 11 root files, 10 of them written by the installer).
SDD_STUB_MARKER="SDD sidecar pointer — generated by install-spec-sidecar.sh"

is_our_stub() {
  [ -f "$1" ] && grep -qF "$SDD_STUB_MARKER" "$1" 2>/dev/null
}

write_root_md_stub() {
  local dest="$1"
  if [ -e "$dest" ] && ! is_our_stub "$dest"; then
    STUB_CONFLICTS+="$(basename "$dest")"$'\n'
    return 0
  fi
  cat > "$dest" <<'EOF'
# Project AI Entry Point

<!-- SDD sidecar pointer — generated by install-spec-sidecar.sh -->

This project keeps its SDD operating system in `./spec/`.

Do not clone or copy the full framework repository into this project unless the user explicitly asks for a standalone workspace.

Read first:
- `./spec/AGENTS.md`
- `./spec/AI_START_HERE.md`
- `./spec/INSTRUCTIONS.md`

Canonical framework reference:
- https://github.com/juanklagos/spec-driven-development-template
EOF
}

write_root_text_stub() {
  local dest="$1"
  if [ -e "$dest" ] && ! is_our_stub "$dest"; then
    STUB_CONFLICTS+="$(basename "$dest")"$'\n'
    return 0
  fi
  cat > "$dest" <<'EOF'
# SDD sidecar pointer — generated by install-spec-sidecar.sh
Canonical source: spec/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md
Use spec/ as the SDD sidecar and keep runnable code in project root.
This is the recommended default workspace inside a real project.
Do not clone or copy the full framework repository into this project unless the user explicitly asks for a standalone workspace.
No code before approved spec and consistent plan.
EOF
}

STUB_CONFLICTS=""
write_root_md_stub "$TARGET_ABS/AGENTS.md"
write_root_md_stub "$TARGET_ABS/AI_START_HERE.md"
write_root_md_stub "$TARGET_ABS/INSTRUCTIONS.md"
write_root_md_stub "$TARGET_ABS/CLAUDE.md"
write_root_md_stub "$TARGET_ABS/GEMINI.md"
write_root_md_stub "$TARGET_ABS/WINDSURF.md"
write_root_md_stub "$TARGET_ABS/AIDER.md"
write_root_md_stub "$TARGET_ABS/ROO.md"
write_root_text_stub "$TARGET_ABS/.cursorrules"
write_root_text_stub "$TARGET_ABS/.clauderules"
write_root_text_stub "$TARGET_ABS/.github/copilot-instructions.md"

sdd_write_attribution "$SPEC_ROOT" "$ROOT_DIR"

if [ -n "$STUB_CONFLICTS" ]; then
  cat > "$SPEC_ROOT/ROOT_AI_STUB_CONFLICTS.md" <<EOF
# Root AI Stub Conflicts

The installer did not overwrite existing root AI files.

Files left untouched:

$STUB_CONFLICTS
If needed, merge the guidance from the new sidecar entry points manually.
EOF
fi

cat <<EOF
✅ Compact SDD sidecar installed at:
   $SPEC_ROOT
   template $(sed -n 's/^template_version=//p' "$SPEC_ROOT/.sdd/TEMPLATE_VERSION"), profile $PROFILE

What this means:
- Your app code stays in the project root.
- Your SDD operating system stays inside ./spec/.
- The full framework repository was not copied into the project.

Recommended next steps:
  cd "$TARGET_ABS"
  ./spec/scripts/new-spec.sh "first-feature" "Owner"
  ./spec/scripts/validate-sdd.sh . --strict
  ./spec/scripts/check-sdd-policy.sh .
  ./spec/scripts/check-sdd-gate.sh .

If you want GitHub Spec Kit in the project root:
  specify init . --ai codex
  # or
  uvx --from git+https://github.com/github/spec-kit.git specify init . --ai codex
EOF

# The conflicts have to be SAID, not filed. This is the failure mode the whole
# template exists to prevent: an agent reads the project's own CLAUDE.md, never
# learns ./spec/ exists, and writes code with no gate. Verified 2026-07-21: with
# a pre-existing root CLAUDE.md the installer exited 0 printing the normal
# success banner, and the only record was spec/ROOT_AI_STUB_CONFLICTS.md, a file
# nothing in the repo reads or mentions.
if [ -n "$STUB_CONFLICTS" ]; then
  cat >&2 <<EOF

⚠️  WARNING: these root AI rule files already existed and were NOT modified:

$(printf "%s" "$STUB_CONFLICTS" | sed 's/^/   - /')
   Agents read those files, so right now they do not know ./spec/ exists.
   Los agentes leen esos archivos, así que hoy no saben que existe ./spec/.

   Paste this into each of them / Pega esto en cada uno:

   ## SDD
   This project keeps its SDD operating system in \`./spec/\`.
   No code before approved spec and consistent plan.
   Read first: \`./spec/AGENTS.md\`, \`./spec/AI_START_HERE.md\`, \`./spec/INSTRUCTIONS.md\`.

   Full list: $SPEC_ROOT/ROOT_AI_STUB_CONFLICTS.md
EOF
fi
