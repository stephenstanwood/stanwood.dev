#!/bin/zsh
# Daily Big Inning check. The existing launchd schedule stays in place.
set -uo pipefail
export PATH=/opt/homebrew/bin:/usr/local/bin:/usr/bin:/bin
cd "$HOME/scripts/big-inning-sync" || exit 1
LOG="$HOME/scripts/big-inning-sync/sync.log"
{
  echo "=== $(date -u +%Y-%m-%dT%H:%M:%SZ) ==="
  node sync.mjs
} >>"$LOG" 2>&1
STATUS=$?

post() {
  if [ -x "$HOME/.claude/scripts/post-to-tasks.sh" ]; then
    "$HOME/.claude/scripts/post-to-tasks.sh" "$1" >/dev/null 2>&1 || true
  fi
}
case $STATUS in
  0) ;;
  3) post "🐱 cat-signal: big-inning-sync got no verified MLB schedule — source unavailable during the season, unexpected empty page, or incomplete retained schedule. Current data preserved. Log: ~/scripts/big-inning-sync/sync.log" ;;
  *) post "🔴 big-inning-sync failed (exit $STATUS) — see ~/scripts/big-inning-sync/sync.log" ;;
esac
exit "$STATUS"
