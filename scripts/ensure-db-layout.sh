#!/usr/bin/env bash
set -euo pipefail

ROOT_DIR="$(cd "${1:-$(pwd)}" && pwd)"
CANONICAL_DB="${CLAWQA_CANONICAL_DB_PATH:-$ROOT_DIR/prisma/dev.db}"
NESTED_DB="$ROOT_DIR/prisma/prisma/dev.db"
ENV_FILE="${CLAWQA_ENV_FILE:-$ROOT_DIR/.env}"
REQUIRE_DB="${CLAWQA_REQUIRE_DB:-0}"
FIX_MISSING_SYMLINK="${CLAWQA_FIX_DB_SYMLINK:-0}"
EXPECTED_DATABASE_URL="file:$CANONICAL_DB"

fail() {
  echo "[db-guard] $*" >&2
  exit 1
}

realpath_safe() {
  python3 - "$1" <<'PY'
import os, sys
print(os.path.realpath(sys.argv[1]))
PY
}

if [[ -f "$ENV_FILE" ]]; then
  CURRENT_DATABASE_URL="$(grep -E '^DATABASE_URL=' "$ENV_FILE" | tail -n 1 | cut -d= -f2- | tr -d '"' | tr -d "'")"
  if [[ -z "$CURRENT_DATABASE_URL" ]]; then
    fail "DATABASE_URL is missing in $ENV_FILE"
  fi

  if [[ "$CURRENT_DATABASE_URL" != "$EXPECTED_DATABASE_URL" ]]; then
    fail "DATABASE_URL must be $EXPECTED_DATABASE_URL but is $CURRENT_DATABASE_URL"
  fi
fi

if [[ "$REQUIRE_DB" == "1" && ! -f "$CANONICAL_DB" ]]; then
  fail "Canonical DB is missing: $CANONICAL_DB"
fi

mkdir -p "$(dirname "$NESTED_DB")"

if [[ -e "$NESTED_DB" || -L "$NESTED_DB" ]]; then
  if [[ ! -L "$NESTED_DB" ]]; then
    fail "Nested DB path exists as a real file: $NESTED_DB. Refusing deploy because duplicate DB files can drift."
  fi

  CANONICAL_REAL="$(realpath_safe "$CANONICAL_DB")"
  NESTED_REAL="$(realpath_safe "$NESTED_DB")"

  if [[ "$CANONICAL_REAL" != "$NESTED_REAL" ]]; then
    fail "Nested DB symlink resolves to $NESTED_REAL instead of canonical DB $CANONICAL_REAL"
  fi
elif [[ "$FIX_MISSING_SYMLINK" == "1" ]]; then
  ln -s ../dev.db "$NESTED_DB"
fi

EXISTING_PATHS=()
for candidate in "$CANONICAL_DB" "$NESTED_DB"; do
  if [[ -e "$candidate" || -L "$candidate" ]]; then
    EXISTING_PATHS+=("$(realpath_safe "$candidate")")
  fi
done

if [[ ${#EXISTING_PATHS[@]} -gt 0 ]]; then
  UNIQUE_REALPATHS="$(printf '%s
' "${EXISTING_PATHS[@]}" | sort -u)"
  UNIQUE_COUNT="$(printf '%s
' "$UNIQUE_REALPATHS" | sed '/^$/d' | wc -l | tr -d ' ')"
  if [[ "$UNIQUE_COUNT" -gt 1 ]]; then
    fail "Multiple physical SQLite files detected:\n$UNIQUE_REALPATHS"
  fi
fi

echo "[db-guard] OK — canonical DB path enforced at $CANONICAL_DB"
