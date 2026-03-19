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

cp -n "$ROOT_DIR/templates/sidecar/README.md" "$SPEC_ROOT/README.md"
cp -n "$ROOT_DIR/templates/sidecar/AGENTS.md" "$SPEC_ROOT/AGENTS.md"
cp -n "$ROOT_DIR/templates/sidecar/AI_START_HERE.md" "$SPEC_ROOT/AI_START_HERE.md"
cp -n "$ROOT_DIR/templates/sidecar/INSTRUCTIONS.md" "$SPEC_ROOT/INSTRUCTIONS.md"
cp -n "$ROOT_DIR/templates/sidecar/sdd.policy.yaml" "$SPEC_ROOT/sdd.policy.yaml"
cp -n "$ROOT_DIR/templates/sidecar/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md" \
  "$SPEC_ROOT/template-context/core-instructions/AGENT_OPERATING_SYSTEM.md"

cp -n "$ROOT_DIR/idea/IDEA_GENERAL.md" "$SPEC_ROOT/idea/IDEA_GENERAL.md"
cp -n "$ROOT_DIR/specs/README.md" "$SPEC_ROOT/specs/README.md"
cp -n "$ROOT_DIR/specs/INDEX.md" "$SPEC_ROOT/specs/INDEX.md"
cp -n "$ROOT_DIR/specs/_template/spec.md" "$SPEC_ROOT/specs/_template/spec.md"
cp -n "$ROOT_DIR/specs/_template/plan.md" "$SPEC_ROOT/specs/_template/plan.md"
cp -n "$ROOT_DIR/specs/_template/tasks.md" "$SPEC_ROOT/specs/_template/tasks.md"
cp -n "$ROOT_DIR/specs/_template/research.md" "$SPEC_ROOT/specs/_template/research.md"
cp -n "$ROOT_DIR/specs/_template/history.md" "$SPEC_ROOT/specs/_template/history.md"
cp -n "$ROOT_DIR/specs/_template/contracts/README.md" "$SPEC_ROOT/specs/_template/contracts/README.md"
cp -n "$ROOT_DIR/bitacora/README.md" "$SPEC_ROOT/bitacora/README.md"
cp -n "$ROOT_DIR/bitacora/global/PROJECT_LOG.md" "$SPEC_ROOT/bitacora/global/PROJECT_LOG.md"
cp -n "$ROOT_DIR/bitacora/templates/DAILY_TEMPLATE.md" "$SPEC_ROOT/bitacora/templates/DAILY_TEMPLATE.md"
cp -n "$ROOT_DIR/bitacora/templates/HANDOFF_TEMPLATE.md" "$SPEC_ROOT/bitacora/templates/HANDOFF_TEMPLATE.md"
cp -n "$ROOT_DIR/bitacora/templates/DECISION_TEMPLATE.md" "$SPEC_ROOT/bitacora/templates/DECISION_TEMPLATE.md"
cp -n "$ROOT_DIR/.sdd.README.template.md" "$SPEC_ROOT/.sdd/README.md"

cp -n "$ROOT_DIR/scripts/lib/sdd-root.sh" "$SPEC_ROOT/scripts/lib/sdd-root.sh"
cp -n "$ROOT_DIR/scripts/validate-sdd.sh" "$SPEC_ROOT/scripts/validate-sdd.sh"
cp -n "$ROOT_DIR/scripts/check-sdd-policy.sh" "$SPEC_ROOT/scripts/check-sdd-policy.sh"
cp -n "$ROOT_DIR/scripts/check-sdd-gate.sh" "$SPEC_ROOT/scripts/check-sdd-gate.sh"
cp -n "$ROOT_DIR/scripts/confirm-user-consent.sh" "$SPEC_ROOT/scripts/confirm-user-consent.sh"
cp -n "$ROOT_DIR/scripts/new-spec.sh" "$SPEC_ROOT/scripts/new-spec.sh"
chmod +x "$SPEC_ROOT/scripts/validate-sdd.sh" \
         "$SPEC_ROOT/scripts/check-sdd-policy.sh" \
         "$SPEC_ROOT/scripts/check-sdd-gate.sh" \
         "$SPEC_ROOT/scripts/confirm-user-consent.sh" \
         "$SPEC_ROOT/scripts/new-spec.sh"

if [ "$PROFILE" = "recommended" ]; then
  mkdir -p "$SPEC_ROOT/template-context/prompts"
  cp -n "$ROOT_DIR/template-context/README.md" "$SPEC_ROOT/template-context/README.md"
  cp -n "$ROOT_DIR/template-context/05-SDD-EXECUTION-GATE.md" "$SPEC_ROOT/template-context/05-SDD-EXECUTION-GATE.md"
  cp -n "$ROOT_DIR/template-context/06-AI-RULES-MATRIX.md" "$SPEC_ROOT/template-context/06-AI-RULES-MATRIX.md"
  cp -R "$ROOT_DIR/templates/." "$SPEC_ROOT/templates"
fi

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

write_root_md_stub() {
  local dest="$1"
  if [ -e "$dest" ]; then
    STUB_CONFLICTS+="$(basename "$dest")"$'\n'
    return 0
  fi
  cat > "$dest" <<'EOF'
# Project AI Entry Point

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
  if [ -e "$dest" ]; then
    STUB_CONFLICTS+="$(basename "$dest")"$'\n'
    return 0
  fi
  cat > "$dest" <<'EOF'
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
