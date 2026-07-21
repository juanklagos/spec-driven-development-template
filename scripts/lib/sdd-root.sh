#!/usr/bin/env bash

sdd_abs_dir() {
  local input="${1:-.}"
  if [ -d "$input" ]; then
    (cd "$input" && pwd)
  else
    local parent
    parent="$(dirname "$input")"
    printf "%s/%s\n" "$(cd "$parent" && pwd)" "$(basename "$input")"
  fi
}

sdd_has_layout() {
  local candidate="$1"
  [ -f "$candidate/sdd.policy.yaml" ] \
    && [ -d "$candidate/idea" ] \
    && [ -d "$candidate/specs" ] \
    && [ -d "$candidate/bitacora" ]
}

sdd_resolve_root() {
  local input="${1:-.}"
  local abs
  abs="$(sdd_abs_dir "$input")"

  if sdd_has_layout "$abs"; then
    printf "%s\n" "$abs"
    return 0
  fi

  if sdd_has_layout "$abs/spec"; then
    printf "%s\n" "$abs/spec"
    return 0
  fi

  return 1
}

# Resolve the SDD root for a script entry point, FAILING CLOSED.
#
# Usage: ROOT="$(sdd_require_root "$ROOT_INPUT" "$SCRIPT_DIR/..")" || exit 1
#
# An explicit argument that is not an SDD workspace is a hard error. The
# previous `sdd_resolve_root "$1" || sdd_resolve_root "$SCRIPT_DIR/.."` chain
# silently fell back to the checkout the script shipped with, so pointing the
# gate at an empty directory — or at a real project with no SDD workspace —
# validated THIS framework instead and printed "0 error(s)", exit 0. Through
# action.yml (whose fallback is the action's own checkout, a complete workspace
# with approved specs and a tracked .sdd/user-consent.log) every consumer
# without an SDD workspace got three green groups in CI.
#
# With NO argument at all the script still resolves its own workspace, which is
# the `./scripts/check-sdd-gate.sh` convenience form.
sdd_require_root() {
  local input="${1-}"
  local fallback="${2-}"

  if [ -n "$input" ]; then
    if sdd_resolve_root "$input"; then
      return 0
    fi
    {
      printf "Error: not an SDD workspace: %s\n" "$input"
      printf "EN: expected sdd.policy.yaml + idea/ + specs/ + bitacora/ in that path or in its spec/ sidecar.\n"
      printf "ES: se esperaba sdd.policy.yaml + idea/ + specs/ + bitacora/ en esa ruta o en su sidecar spec/.\n"
      printf "Install one with scripts/install-spec-sidecar.sh, or point at the right folder.\n"
    } >&2
    return 1
  fi

  if [ -n "$fallback" ] && sdd_resolve_root "$fallback"; then
    return 0
  fi

  printf "Error: could not resolve an SDD root (no path given and %s is not an SDD workspace).\n" "${fallback:-.}" >&2
  return 1
}

sdd_project_root() {
  local sdd_root="$1"

  if [ -d "$sdd_root/.git" ]; then
    printf "%s\n" "$sdd_root"
    return 0
  fi

  if [ "$(basename "$sdd_root")" = "spec" ] && [ -d "$sdd_root/../.git" ]; then
    (cd "$sdd_root/.." && pwd)
    return 0
  fi

  printf "%s\n" "$sdd_root"
}

sdd_relative_prefix() {
  local project_root="$1"
  local sdd_root="$2"

  if [ "$project_root" = "$sdd_root" ]; then
    printf "%s\n" ""
  else
    printf "%s\n" "${sdd_root#$project_root/}"
  fi
}

sdd_rel_from() {
  local base="$1"
  local target="$2"

  if [ "$base" = "$target" ]; then
    printf ".\n"
  elif [[ "$target" == "$base/"* ]]; then
    printf ".%s\n" "${target#$base}"
  else
    printf "%s\n" "$target"
  fi
}
