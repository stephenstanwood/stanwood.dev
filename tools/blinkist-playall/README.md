# Blinkist Play All

Chrome extension that adds a **Play all saved** button to your Blinkist library
and auto-advances through chapters and titles in order (oldest-saved first,
skipping finished books).

## Install (unpacked)

1. Go to `chrome://extensions`
2. Enable **Developer mode** (top right)
3. Click **Load unpacked**, pick this folder (`~/Projects/stanwood.dev/tools/blinkist-playall`)
4. Pin the extension (puzzle-piece icon → pin)

## Use

1. Open <https://www.blinkist.com/en/app/library>
2. Click the floating **▶ Play all saved** button (bottom right)
3. Confirm — the first title opens and starts playing
4. Use the popup (extension icon) to pause / resume / skip / clear

## Debug

Open DevTools on any Blinkist tab. All extension logs are prefixed `[BPA]`.
Background logs: `chrome://extensions` → this extension → **Service worker**
link → Console.

## Known rough edges (v0.1.0)

- DOM selectors are best-effort; Blinkist ships hashed class names. If the
  "Play all" button doesn't appear, check the console — we may need to update
  `findSavedSection` / `scrapeSavedItems` in `content.js`.
- "Finished" detection is heuristic (looks for `finished`/`completed` class
  tokens). May need adjustment.
- "Oldest saved first" assumes Blinkist displays newest-first and reverses —
  verify on first run.
- Auto-advance through chapters uses the reader's Next button if present,
  otherwise advances to the next book on the audio `ended` event.
