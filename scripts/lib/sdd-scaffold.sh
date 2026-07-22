#!/usr/bin/env bash
# What a scaffolder writes into the project it installs into.
#
# One reason to change: the shape of a fresh workspace. Both scaffolders source
# this instead of each carrying its own copy — install-spec-sidecar.sh had the
# empty spec index inline while init-project.sh copied the framework's own,
# which is how a brand-new project ended up with an index listing specs that
# belong to somebody else.
#
# --- .gitignore ---
# The entries an SDD workspace needs in the project that hosts it.
#
# No scaffolder wrote one before, so every "that file is ignored" assumption in
# this framework was true in THIS repository and false in every project it
# installs into. The consent log is the sharpest case: it is evidence and must
# be tracked, while everything else under .sdd/ is machine state that must not.
# Without a .gitignore, both were tracked.
#
# The rules, in the order they must appear:
#   .sdd/*                 machine state (locks, version stamp, archives)
#   !.sdd/user-consent.log EXCEPT the consent log, which is the audit trail
#   specs/.lock/           transient allocation lock, only on disk after a kill
#
# Deliberately small. This writes into a file the user owns, so it adds the
# minimum that makes the framework behave and nothing that expresses taste.

SDD_GITIGNORE_HEADER="# --- Spec-Driven Development workspace ---"

# sdd_gitignore_rules <prefix>
# `prefix` is "" for a standalone layout and "spec/" for a sidecar.
sdd_gitignore_rules() {
  local prefix="${1:-}"
  printf "%s\n" \
    "${prefix}.sdd/*" \
    "!${prefix}.sdd/user-consent.log" \
    "${prefix}specs/.lock/"
}

# sdd_ensure_gitignore <project_dir> [prefix]
#
# Idempotent and additive: appends only the rules that are not already present,
# under an identifiable header, and never reorders, rewrites or removes a line
# the user wrote. Running it twice changes nothing the second time.
sdd_ensure_gitignore() {
  local project_dir="$1"
  local prefix="${2:-}"
  local gitignore="$project_dir/.gitignore"

  [ -d "$project_dir" ] || return 0

  local missing=""
  local rule
  while IFS= read -r rule; do
    [ -n "$rule" ] || continue
    # Exact whole-line match: a rule is present or it is not. Substring matching
    # would treat ".sdd/*" as covered by "!.sdd/user-consent.log".
    if [ -f "$gitignore" ] && grep -qxF -- "$rule" "$gitignore"; then
      continue
    fi
    missing="${missing}${rule}
"
  done <<EOF_RULES
$(sdd_gitignore_rules "$prefix")
EOF_RULES

  [ -n "$missing" ] || return 0

  # Keep the user's last line intact: append a separating blank line only when
  # the file exists and does not already end with one.
  if [ -f "$gitignore" ] && [ -s "$gitignore" ]; then
    if [ -n "$(tail -c 1 "$gitignore")" ]; then
      printf "\n" >> "$gitignore"
    fi
    printf "\n" >> "$gitignore"
  fi

  if ! grep -qxF -- "$SDD_GITIGNORE_HEADER" "$gitignore" 2>/dev/null; then
    printf "%s\n" "$SDD_GITIGNORE_HEADER" >> "$gitignore"
  fi
  printf "%s" "$missing" >> "$gitignore"
}

# --- Spec index ---

# sdd_write_empty_spec_index <specs_dir>
#
# A fresh project gets an EMPTY index. Copying the framework's own handed the
# user a table of specs that do not exist in their project — and, because the
# gate reads the index, a workspace that described somebody else's work.
# Only writes when the file is absent: never clobber an index the user has.
sdd_write_empty_spec_index() {
  local specs_dir="${1:-}"
  [ -d "$specs_dir" ] || return 0
  [ -f "$specs_dir/INDEX.md" ] && return 0

  cat > "$specs_dir/INDEX.md" <<'SDD_INDEX_EOF'
# Specification Index / Índice de especificaciones

| Number / Número | Name / Nombre | Status / Estado | Priority / Prioridad | Owner / Responsable | Updated / Actualización |
|---|---|---|---|---|---|
SDD_INDEX_EOF
}
