#!/usr/bin/env bash
set -euo pipefail

usage() {
  echo "Usage: $0 --all | specs/NNN-name"
}

if [ "$#" -ne 1 ]; then
  usage
  exit 1
fi

score_one() {
  local dir="$1"
  local score=0
  local notes=()

  local required=(spec.md plan.md tasks.md research.md history.md)
  local present=0
  for f in "${required[@]}"; do
    if [ -f "$dir/$f" ]; then
      present=$((present + 1))
    fi
  done
  score=$((score + present * 4))
  if [ "$present" -lt 5 ]; then
    notes+=("missing required files")
  fi

  if [ -f "$dir/spec.md" ]; then
    local spec_hits=0
    rg -qi "objective|objetivo" "$dir/spec.md" && spec_hits=$((spec_hits + 1)) || true
    rg -qi "requirement|requisito" "$dir/spec.md" && spec_hits=$((spec_hits + 1)) || true
    rg -qi "acceptance|aceptaci[oó]n" "$dir/spec.md" && spec_hits=$((spec_hits + 1)) || true
    score=$((score + spec_hits * 6))
    [ "$spec_hits" -lt 3 ] && notes+=("spec.md lacks objective/requirements/acceptance")
  fi

  if [ -f "$dir/plan.md" ]; then
    local plan_hits=0
    rg -qi "milestone|hito|dependency|dependencia|risk|riesgo" "$dir/plan.md" && plan_hits=3 || true
    score=$((score + plan_hits * 3))
    [ "$plan_hits" -lt 3 ] && notes+=("plan.md lacks milestones/dependencies/risks")
  fi

  if [ -f "$dir/tasks.md" ]; then
    local task_count
    task_count=$(rg -c "^- \[[ xX]\]" "$dir/tasks.md" || true)
    if [ "$task_count" -ge 5 ]; then
      score=$((score + 15))
    elif [ "$task_count" -ge 3 ]; then
      score=$((score + 10))
      notes+=("tasks.md has limited task breakdown")
    elif [ "$task_count" -ge 1 ]; then
      score=$((score + 5))
      notes+=("tasks.md needs more actionable tasks")
    else
      notes+=("tasks.md has no checklist tasks")
    fi
  fi

  if [ -f "$dir/research.md" ]; then
    local research_hits=0
    rg -qi "decision|decisi[oó]n" "$dir/research.md" && research_hits=$((research_hits + 1)) || true
    rg -qi "rationale|justific|why|por qu[eé]" "$dir/research.md" && research_hits=$((research_hits + 1)) || true
    rg -qi "reference|referencia" "$dir/research.md" && research_hits=$((research_hits + 1)) || true
    score=$((score + research_hits * 5))
    [ "$research_hits" -lt 2 ] && notes+=("research.md needs clearer decision rationale")
  fi

  if [ -f "$dir/history.md" ]; then
    if rg -q "[0-9]{4}-[0-9]{2}-[0-9]{2}" "$dir/history.md"; then
      score=$((score + 12))
    else
      score=$((score + 6))
      notes+=("history.md has no dated entries")
    fi
  fi

  if [ "$score" -gt 100 ]; then
    score=100
  fi

  local grade
  if [ "$score" -ge 85 ]; then
    grade="A"
  elif [ "$score" -ge 70 ]; then
    grade="B"
  elif [ "$score" -ge 55 ]; then
    grade="C"
  else
    grade="D"
  fi

  echo "Spec: $dir"
  echo "Score: $score/100 (Grade $grade)"
  if [ "${#notes[@]}" -eq 0 ]; then
    echo "Notes: solid baseline"
  else
    echo "Notes:"
    for n in "${notes[@]}"; do
      echo "- $n"
    done
  fi
  echo
}

if [ "$1" = "--all" ]; then
  found=0
  while IFS= read -r d; do
    found=1
    score_one "$d"
  done < <(find specs -mindepth 1 -maxdepth 1 -type d -name '[0-9][0-9][0-9]-*' | sort)

  if [ "$found" -eq 0 ]; then
    echo "No numbered specs found."
  fi
else
  score_one "$1"
fi
