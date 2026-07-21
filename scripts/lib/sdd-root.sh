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
# With NO argument the script resolves its own workspace ONLY when the caller
# is standing inside that workspace's project tree. That keeps the two
# documented convenience forms working — `./scripts/check-sdd-gate.sh` from the
# framework root and `./spec/scripts/check-sdd-gate.sh` from a sidecar project
# root — and closes the other half of the same fail-open bug the explicit-arg
# branch closed: verified 2026-07-21, `cd /tmp/empty && bash
# /path/to/template/scripts/validate-sdd.sh` printed "Validating SDD structure
# in: /path/to/template", walked all 11 framework specs and exited 0. A green
# report about a workspace the user is not in is worse than no report.
sdd_workspace_error() {
  local what="$1"
  {
    printf "Error: not an SDD workspace: %s\n" "$what"
    printf "EN: expected sdd.policy.yaml + idea/ + specs/ + bitacora/ in that path or in its spec/ sidecar.\n"
    printf "ES: se esperaba sdd.policy.yaml + idea/ + specs/ + bitacora/ en esa ruta o en su sidecar spec/.\n"
    printf "Install one with scripts/install-spec-sidecar.sh, or point at the right folder.\n"
  } >&2
}

# The tree a workspace legitimately governs. For a sidecar root (<project>/spec)
# that is the project itself, because the documented invocation is
# `./spec/scripts/x.sh` run from <project>.
sdd_governed_tree() {
  local root="$1"
  if [ "$(basename "$root")" = "spec" ]; then
    dirname "$root"
  else
    printf "%s\n" "$root"
  fi
}

sdd_require_root() {
  local input="${1-}"
  local fallback="${2-}"

  if [ -n "$input" ]; then
    if sdd_resolve_root "$input"; then
      return 0
    fi
    sdd_workspace_error "$input"
    return 1
  fi

  local fallback_root=""
  if [ -n "$fallback" ]; then
    fallback_root="$(sdd_resolve_root "$fallback" || true)"
  fi

  if [ -z "$fallback_root" ]; then
    printf "Error: could not resolve an SDD root (no path given and %s is not an SDD workspace).\n" "${fallback:-.}" >&2
    return 1
  fi

  local governed pwd_abs
  governed="$(sdd_governed_tree "$fallback_root")"
  pwd_abs="$(sdd_abs_dir "$PWD")"
  case "$pwd_abs/" in
    "$governed/"*)
      printf "%s\n" "$fallback_root"
      return 0
      ;;
  esac

  sdd_workspace_error "$pwd_abs"
  printf "Note: this script lives in %s. Pass that path explicitly if you meant to check it.\n" "$governed" >&2
  return 1
}

# Resolve the root for scripts that take no path argument at all
# (new-spec.sh, confirm-user-consent.sh): the current workspace first, then the
# script's own workspace under the same containment rule as sdd_require_root.
# Without the containment rule these two wrote into the framework checkout when
# run by absolute path from an unrelated directory.
sdd_require_local_root() {
  local fallback="${1-}"

  if sdd_resolve_root "$PWD"; then
    return 0
  fi

  sdd_require_root "" "$fallback"
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

# --- Cross-process allocation lock -------------------------------------------
#
# `mkdir` is the only atomic test-and-set that bash and Node both have on every
# filesystem this template supports, so it is the primitive both sides use.
#
# KEEP IN SYNC with withCrossProcessLock in packages/sdd-core/src/file-lock.ts:
# scripts/new-spec.sh and sdd-core's reserveSpecDir are the two supported ways
# to create a spec, and they must contend for the SAME on-disk lock directory
# (<sdd-root>/specs/.lock) or two tools racing still hand out the same number.
# Verified 2026-07-21: before this lock, two concurrent new-spec.sh runs with
# different feature names produced `001-alpha-feature 001-beta-feature` in 5/5
# trials.
#
# The lock directory holds an `owner` file, `<pid> <epoch-seconds> <agent>`, so
# a lock left behind by a killed process is recognised as stale and broken
# instead of wedging the workspace forever.
SDD_LOCK_STALE_SECONDS="${SDD_LOCK_STALE_SECONDS:-30}"
# Must exceed SDD_LOCK_STALE_SECONDS: a lock left by a killed process is only
# breakable once it is stale, so a shorter wait made the next command fail
# with a timeout instead of recovering.
SDD_LOCK_WAIT_SECONDS="${SDD_LOCK_WAIT_SECONDS:-45}"

sdd_lock_started_at() {
  awk 'NR==1{print $2}' "$1/owner" 2>/dev/null || true
}

sdd_acquire_lock() {
  local lock_dir="$1"
  local waited=0
  local started now

  while ! mkdir "$lock_dir" 2>/dev/null; do
    now="$(date +%s)"
    started="$(sdd_lock_started_at "$lock_dir")"
    if [ -n "$started" ] && [ "$((now - started))" -ge "$SDD_LOCK_STALE_SECONDS" ]; then
      # Whoever held this is gone or hung; breaking it is strictly better than
      # leaving the workspace unable to create specs.
      rm -rf "$lock_dir"
      continue
    fi
    if [ "$waited" -ge "$((SDD_LOCK_WAIT_SECONDS * 10))" ]; then
      printf "Error: timed out waiting for the spec allocation lock: %s\n" "$lock_dir" >&2
      printf "If no other tool is creating a spec, remove that directory and retry.\n" >&2
      return 1
    fi
    sleep 0.1
    waited=$((waited + 1))
  done

  printf "%s %s bash\n" "$$" "$(date +%s)" > "$lock_dir/owner" 2>/dev/null || true
  return 0
}

sdd_release_lock() {
  [ -n "${1:-}" ] || return 0
  rm -rf "$1"
}

# Extract the approval status value from a "- Estado / Status: `X`" line.
#
# One implementation, sourced by check-sdd-gate.sh and validate-sdd.sh, which
# each carried their own copy. It must agree with extractApprovalStatus() in
# packages/sdd-core/src/workspace.ts on every input; scripts/test-mcp-integration.mjs
# runs both over an adversarial table and fails if they diverge.
#
# The expression is anchored and non-greedy on purpose. A greedy `.*` captures the
# LAST backtick pair, so `- Estado / Status: \`Pendiente\` (target: \`approved\`)`
# extracted as "approved" and an unapproved spec read as approved.
sdd_extract_status_value() {
  status_line="${1:-}"
  case "$status_line" in
    *'`'*) ;;
    *) printf "" ; return 0 ;;
  esac
  printf "%s" "$status_line" \
    | sed -E 's/^[^`]*`([^`]*)`.*/\1/' \
    | sed -E 's/^[[:space:]]+//; s/[[:space:]]+$//'
}
