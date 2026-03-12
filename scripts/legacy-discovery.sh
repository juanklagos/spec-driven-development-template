#!/usr/bin/env bash
set -euo pipefail

TARGET="${1:-.}"
OUT_DIR="${2:-analysis/legacy-discovery}"

mkdir -p "$OUT_DIR"

ROUTES_FILE="$OUT_DIR/routes-signals.txt"
FLOWS_FILE="$OUT_DIR/flow-signals.txt"
REPORT_FILE="$OUT_DIR/legacy-discovery-report.md"

rg -n --no-ignore -S "Route::|router\.|app\.(get|post|put|delete|patch)\(|FastAPI\(|@Get\(|@Post\(|@RequestMapping|path\(|endpoint|/api/" "$TARGET" \
  > "$ROUTES_FILE" || true

rg -n --no-ignore -S "login|register|signup|checkout|payment|profile|reset password|forgot|2fa|otp|verification|cart|order" "$TARGET" \
  > "$FLOWS_FILE" || true

route_count=$(wc -l < "$ROUTES_FILE" | xargs)
flow_count=$(wc -l < "$FLOWS_FILE" | xargs)

suggested_specs=()
if rg -qi "login|register|2fa|otp|verification" "$FLOWS_FILE"; then
  suggested_specs+=("001-authentication-baseline")
fi
if rg -qi "checkout|payment|order|cart" "$FLOWS_FILE"; then
  suggested_specs+=("002-commerce-flow-baseline")
fi
if rg -qi "profile|settings|account" "$FLOWS_FILE"; then
  suggested_specs+=("003-account-management-baseline")
fi
if [ "${#suggested_specs[@]}" -eq 0 ]; then
  suggested_specs+=("001-core-system-baseline")
fi

cat > "$REPORT_FILE" <<EOF2
# Legacy Discovery Report / Reporte de descubrimiento legado

Target analyzed / Objetivo analizado: $TARGET
Generated at / Generado en: $(date -u +"%Y-%m-%d %H:%M UTC")

## Signals found / Señales encontradas

- Route/API signals: $route_count
- User flow signals: $flow_count

## Suggested first specs / Specs iniciales sugeridas

$(for s in "${suggested_specs[@]}"; do echo "- $s"; done)

## Suggested prompting / Prompt sugerido

\`\`\`text
Using this project as legacy baseline, do reverse engineering into the SDD template.
Create idea/IDEA_GENERAL.md and the first numbered spec(s), preserving current behavior.
Recommend GitHub Spec Kit command flow and split into multiple specs if independent flows are detected.
\`\`\`

## Evidence files / Archivos de evidencia

- $ROUTES_FILE
- $FLOWS_FILE
EOF2

echo "Generated $REPORT_FILE"
echo "Next step: create spec(s) from suggested baseline." 
