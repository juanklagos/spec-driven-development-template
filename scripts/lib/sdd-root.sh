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
