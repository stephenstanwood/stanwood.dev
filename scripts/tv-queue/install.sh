#!/bin/bash
# Install or update the dev.stanwood.tv-listings LaunchAgent. Run on the Mini
# from any checkout of this repo; it copies nightly.py and (re)loads the plist.
set -euo pipefail
HERE="$(cd "$(dirname "$0")" && pwd)"
LABEL=dev.stanwood.tv-listings
DOMAIN="gui/$(id -u)"
DEST="$HOME/.local/share/tv-listings"
PLIST="$HOME/Library/LaunchAgents/$LABEL.plist"

mkdir -p "$DEST" "$HOME/.local/state/tv-listings"
install -m 755 "$HERE/nightly.py" "$DEST/nightly.py"
if ! cmp -s "$HERE/$LABEL.plist" "$PLIST" || ! launchctl print "$DOMAIN/$LABEL" >/dev/null 2>&1; then
  launchctl bootout "$DOMAIN/$LABEL" 2>/dev/null || true
  install -m 644 "$HERE/$LABEL.plist" "$PLIST"
  launchctl enable "$DOMAIN/$LABEL"
  launchctl bootstrap "$DOMAIN" "$PLIST"
fi
launchctl print "$DOMAIN/$LABEL" | grep -E '^\s*(state|program|path) =' || true
