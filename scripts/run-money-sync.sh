#!/bin/zsh
set -euo pipefail

export PATH="/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin:/opt/homebrew/sbin:/usr/sbin:/sbin"

LOCKDIR="/tmp/dev.stanwood.money-sync.lock"
if ! mkdir "$LOCKDIR" 2>/dev/null; then
  echo "money-sync: lock exists; exiting"
  exit 0
fi
trap 'rmdir "$LOCKDIR"' EXIT

cd "$HOME/Projects/stanwood.dev"

if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "money-sync: not on main; exiting"
  exit 1
fi

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "money-sync: repo dirty before run; exiting"
  exit 1
fi

git fetch origin main
git pull --ff-only origin main

node scripts/collect-money.mjs

if git diff --quiet -- src/data/money.json; then
  echo "money-sync: no money data changes"
  exit 0
fi

if [ "$(git rev-parse --abbrev-ref HEAD)" != "main" ]; then
  echo "money-sync: branch changed before commit; exiting"
  exit 1
fi

git add src/data/money.json
git commit -m "chore: update money dashboard data"
git push origin main
