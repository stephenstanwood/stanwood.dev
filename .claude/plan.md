# Vibe Check — Implementation Plan

## Architecture Overview

Follows existing patterns: Astro page + React component + API route.

### Files to create

| File | Purpose |
|------|---------|
| `src/pages/vibe-check.astro` | Page shell with BaseLayout, CSS theme, header |
| `src/components/vibe-check/VibeCheck.tsx` | Main React component (form → loading → result) |
| `src/components/vibe-check/VibeScorecard.tsx` | Report card result display |
| `src/components/vibe-check/LoadingState.tsx` | Animated loading with rotating jokes |
| `src/pages/api/vibe-check.ts` | API route: screenshot → Claude vision → structured response |
| `src/lib/vibePrompt.ts` | System prompt + response schema for Claude |

### Files to modify

| File | Change |
|------|--------|
| `.env.example` | Add `SCREENSHOTONE_API_KEY` |

## Design Direction

**Retro report card / assessment slip** — consistent with stanwood.dev's zine aesthetic.

- **Fonts**: Space Mono (grades/metadata), Cabin (body), Permanent Marker (verdict headline)
- **Colors**: Cream bg (`#FAF8F3`), ink black, red stamp accent, muted category text
- **Motifs**: Dotted dividers, stamped letter grades, "CERTIFIED VIBES INSPECTED" seal, serial number, monospace metadata
- **Light theme** per user preference

## Technical Flow

```
User pastes URL → POST /api/vibe-check
  → Validate URL (reject private IPs, localhost, invalid formats)
  → Fetch screenshot from ScreenshotOne API (1280x800 viewport, PNG)
  → Send screenshot (base64) to Claude vision (claude-sonnet-4-6)
  → Parse structured JSON response
  → Return to client
```

### API Route Details (`/api/vibe-check.ts`)

- Rate limit: 20 req/min per IP (tighter than default — these are expensive calls)
- URL validation: reject localhost, private IPs (10.x, 192.168.x, 127.x), non-http(s), obviously invalid
- ScreenshotOne: `GET https://api.screenshotone.com/take?url={url}&viewport_width=1280&viewport_height=800&format=png&access_key={key}`
- Claude vision: send screenshot as base64 image, request structured JSON output
- Model: `claude-sonnet-4-6-20250514` (same as condense route — vision-capable, fast, cheap)

### Claude Prompt Strategy

System prompt instructs Claude to be a witty, observant design critic. Returns structured JSON:

```typescript
interface VibeResult {
  overall_grade: string;        // "A-", "B+", "C", etc.
  overall_vibe: string;         // one-line verdict
  categories: {
    design: { grade: string; note: string };
    tone: { grade: string; note: string };
    speed_feel: { grade: string; note: string };
    clarity: { grade: string; note: string };
    originality: { grade: string; note: string };
    trust: { grade: string; note: string };
  };
  main_read: string;            // short paragraph
  gentle_nudge: string;         // one constructive note
}
```

## React Component Flow

### State machine: `idle` → `loading` → `result` | `error`

**Idle state:**
- URL input field (large, centered)
- Example URLs below: apple.com, figma.com, craigslist.org, stanwood.dev
- CTA button: "check the vibe"

**Loading state:**
- Rotating loading messages every 2s:
  - "examining the energy..."
  - "reading the room..."
  - "consulting the design spirits..."
  - "checking fonts, vibes, and emotional residue..."
  - "please hold while we judge this website gently"
- Spinner animation

**Result state (VibeScorecard):**
- Report card layout with:
  - Overall grade (large stamped letter)
  - One-line vibe verdict (headline font)
  - Category rows: label + grade + short note
  - Main read paragraph
  - Gentle nudge section
  - "CERTIFIED VIBES INSPECTED" stamp/seal
  - Run number / timestamp metadata
  - "Check another" button

**Error state:**
- Friendly error message
- "Try again" button

## Implementation Order

1. API route + prompt (get the AI pipeline working)
2. Astro page shell + CSS theme
3. React form component (idle state)
4. Loading state with rotating messages
5. Scorecard component (result display)
6. Error handling + edge cases
7. Visual polish pass
8. Test with real URLs

## Env Variables Needed

- `SCREENSHOTONE_API_KEY` — user needs to sign up at screenshotone.com (free tier: 100/month)

## Scope — v1 only

- Single URL input → single result
- No share card generation
- No permalink/history
- No personality mode toggle
- No side-by-side compare
- Homepage tile is a follow-up task
