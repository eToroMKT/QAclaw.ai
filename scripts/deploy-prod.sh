#!/usr/bin/env bash
set -euo pipefail

APP_DIR="${APP_DIR:-/var/www/clawqa-nextjs}"
cd "$APP_DIR"

export CLAWQA_CANONICAL_DB_PATH="$APP_DIR/prisma/dev.db"
export CLAWQA_ENV_FILE="$APP_DIR/.env"
export CLAWQA_REQUIRE_DB=1
export CLAWQA_FIX_DB_SYMLINK=1

if [[ ! -f "$CLAWQA_ENV_FILE" ]]; then
  echo "[deploy] Missing env file: $CLAWQA_ENV_FILE" >&2
  exit 1
fi

bash scripts/ensure-db-layout.sh "$APP_DIR"

git fetch origin main
git reset --hard origin/main
npm ci
npx prisma generate
bash scripts/ensure-db-layout.sh "$APP_DIR"
npm run build
pm2 restart clawqa-nextjs --update-env || pm2 start npm --name clawqa-nextjs -- start -- -p 3170
bash scripts/ensure-db-layout.sh "$APP_DIR"

echo "[deploy] complete"
