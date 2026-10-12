#!/usr/bin/env bash
# ==============================================================================
# DESANOMIA BRAIN INTEGRITY LINTER & SEMANTIC AUDITOR
# Verifies that markdown documentation files in brain/ maintain structural
# consistency, non-empty chapter bodies, sequential numbering, and physical safety interlocks.
# ==============================================================================
set -euo pipefail

REPO_ROOT="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"
BRAIN_DIR="${REPO_ROOT}/brain"

ERRORS=0

echo "🔍 [1/3] Checking for Physical Safety Interlocks in brain/04_TRD.md..."
for interlock in IL-01 IL-02 IL-03 IL-04 IL-05 IL-06 IL-07; do
    if ! grep -q "$interlock" "${BRAIN_DIR}/04_TRD.md"; then
        echo "❌ FATAL: Missing safety interlock $interlock in brain/04_TRD.md!"
        ERRORS=$((ERRORS + 1))
    fi
done
if [ $ERRORS -eq 0 ]; then
    echo "✅ All 7 Safety Interlocks (IL-01 to IL-07) are present."
fi

echo "🔍 [2/3] Checking sequential section numbering in brain/04_TRD.md..."
SECTIONS=$(grep -E "^## [0-9]+" "${BRAIN_DIR}/04_TRD.md" | awk '{print $2}' | tr -d '.' || true)
EXPECTED=1
for sec in $SECTIONS; do
    if [ "$sec" -ne "$EXPECTED" ]; then
        echo "❌ BROKEN SEQUENCE: Expected section ## ${EXPECTED}., found ## ${sec}."
        ERRORS=$((ERRORS + 1))
    fi
    EXPECTED=$((EXPECTED + 1))
done
if [ $ERRORS -eq 0 ]; then
    echo "✅ Chapter sequence is strictly continuous (1 through $((EXPECTED - 1)))."
fi

echo "🔍 [3/3] Checking for zombie headers (headings followed immediately by horizontal rule or next heading)..."
if grep -Pzo '## [^\n]+\n\n---' "${BRAIN_DIR}"/*.md >/dev/null 2>&1; then
    echo "❌ WARNING: Found empty heading followed immediately by separator line (zombie header)!"
    ERRORS=$((ERRORS + 1))
else
    echo "✅ Zero zombie headers detected."
fi

if [ $ERRORS -gt 0 ]; then
    echo "🛑 Integrity audit FAILED with $ERRORS error(s)."
    exit 1
else
    echo "🎉 All documentation integrity checks PASSED."
    exit 0
fi
