# Senior finishing findings

- Owners: initial `/root/senior_finish`, resumed `/root/senior_finish_resume`; actual `gpt-6-astra`, max; maker, independent: false.
- Started: 2026-10-09T22:07:51Z. Exclusive source and render ownership accepted.
- Baseline for this pass: the completed Sol candidate, not the old production design.
- Evidence budget: about 60 pre-batch image reads and 20 post-batch reads. Whole captures first; focused crops only for a suspected defect.
- Final read count: pre-batch 54, post-batch 19. Counts span the initial and resumed invocation.
- Accepted and frozen; exact artifact hashes and source binding are in `senior-acceptance.json`. Historical intermediate findings below are resolved by the final section.

## Candidate inspection

| Route | Widths read | What was seen | Decision |
| --- | --- | --- | --- |
| Home | 375, 1440 | Clear yellow zine identity, three useful favorites, then small grouped app links. Long phone page is real inventory. | Keep. |
| Lap Lab | 375, 1440 | Teal identity; only pool, time, pace above one strong action; optional details are quiet. | Keep. |

Pre-batch image reads: 4.

| TL;DR | 375, 1440 | One upload surface, output choice, essential processing limit. | Keep. |
| Nearest Coffee | 375, 1440 | Elegant serif single-purpose location entry and one action. | Keep. |
| Green Light | 375, 1440 | Friendly and legible. Desktop quiz begins too far below its short hero; task feels split. | Tighten hero-to-quiz spacing. |
| Museum Label | 375, 1440 | Placard aesthetic works. The nav tagline repeats the hero premise and wraps heavily on a phone. | Remove repeated nav tagline; preserve label style choices. |
| Redesign Rolodex | 375, 1440 | Useful controls and strong marker identity, but full-height centering pushes the tool too far down. | Bring the tool up with natural content spacing. |
| Which Model | 375, 1440 | Six task choices and one opinionated pick are clear. Footer narrates why model names are broad. | Remove that implementation explanation; keep opinion/try-your-task qualifier. |

Pre-batch image reads: 16.

| AI Radar | 375, 1440 | Dated source-first feed with clear hierarchy. No ornamental extra sections. | Keep. |
| Ship Clock | 375, 1440 | Local unavailable state is clear but tells the reader to refresh instead of offering a retry action. | Add a direct retry button using existing fetch path. |
| WTWTW | 375, 1440 | Six default teams present; complete seven-day schedule. The captured empty schedule is naturally repetitive. | Keep structure; final sweep verifies latest contrast fix. |
| MLB GameRank | 375, 1440 | Compact scoreboard identity, real retry action. Error reads the technical network exception. | Keep the tested Retry path. The error comes from the preserved shared sports engine, outside this finishing scope. |
| Driverless | 375, 1440 | Calm green editorial layout; scoped, dated Waymo figures and useful area links. | Keep facts, limitations and structure exactly. Correct legacy data pointer in AGENTS/CLAUDE per lead. |
| Campbell Events | 375, 1440 | Three stacked introductions; 18 expanded event cards plus source descriptions create an 8,003px phone page. | Fold Today briefing into a native disclosure, remove duplicated Events intro, compact event rows and source links. Preserve all 8 tabs and meaningful links. |

Pre-batch image reads: 34.

| Pixel Tide | 375, 1440 | Canvas leads, scene choices stay close, no guide sections. | Keep. |
| Pixel Aquarium | 375, 1440 | Playful pixel canvas. Mobile food colors leave an orphan swatch; feeding instruction repeats. | Balance the color control and remove duplicated intro. Repair direct click redraw while paused per lead finding. |
| Show Swipe | 375, 1440 | Large trailer plus two immediate decisions; compact filters. | Keep. |
| Shop | 375, 1440 | Strong single-item product view, price and size choice visible. | Keep product/pricing/checkout unchanged. |
| TV | 375, 1440 | Desktop four-column queue works; phone stacks every full-size card into 8,807px. | Use compact thumbnail/text rows on phones; keep every queue item and feedback control. |
| Family Room | 375, 1440 | Distinctive family TV launcher. Empty Sports heading is left visible when no games load. | Hide the empty sports section after a completed empty result. |
| Money | 375, 1440 | Current read-only view inspected; tables and navigation fit phone and desktop. | Keep. |
| LI entry | 375, 1440 | Unavailable datastore view; do not imply actual authenticated data proof. | Keep, inspect synthetic UI separately. |
| Scatos entry | 375, 1440 | Profile sign-in gate; distinct blue/purple identity. | Inspect synthetic UI and login state; preserve profiles/auth. |

Pre-batch image reads: 46.

| LI synthetic working view | 375, 1440 | Queue cards are usable, but six expanded controls precede the first record; reset/ranking explanation is prominent. | Keep search visible, fold the remaining filters into a native disclosure, shorten batch timing copy. |
| Scatos synthetic working view | 375, 1440 | Desktop two-column wish list/card works; mobile photo and listing details remain legible with fixed decision controls. | Keep; verify filters, saved state and decision visibility at extremes. |
| LI sign-in | 375, 1440 | Zine identity is clear; decorative words and two different pile names add small noise. | Keep identity, use the actual LinkedIn pile name and remove scattered decorative words. |
| Money sign-in | 375, 1440 | Candidate screenshot predates latest Money heading; current wide mono heading needs a responsive marker treatment. | Match the Money marker identity and fit 320px. |

Pre-batch image reads: 54. All 23 desktop/mobile surfaces, two private synthetic working views and the two additional sign-in routes read. Scatos sign-in is the same captured screen reached through /lg. No pixels re-read.

Lead source-backed corrections accepted into the same batch: frontend 3 MB upload limit and rejection tests (TL;DR/Museum), paused Aquarium direct-feed redraw and test, and current Driverless maintenance-source pointer in AGENTS/CLAUDE. APIs, auth, data feeds, checkout and scheduled tasks remain untouched.

## Implemented batch and first checks

The coherent batch implements the decisions above across 18 app/frontend source files, plus the two allowed repository-maintenance pointer corrections. It deletes repeated copy and UI, shortens the default Campbell events view without deleting any event, and preserves every source calendar through a native disclosure. The displayed listing/date/location/cost/description remain intact. TV retains every queue record and feedback action. LI retains all filters and state behavior behind a native disclosure while keeping search immediately visible.

The two file upload controls now advertise and enforce 3 MB. The [Vercel Functions limit](https://vercel.com/docs/functions/limitations#request-body-size) was rechecked live: the body limit is 4.5 MB; a 3 MiB raw file occupies about 4.19 MB as base64 plus small JSON metadata. No backend or storage change.

- Unit tests: 19 files, 163 passed.
- Astro check: 0 errors, 0 warnings, 22 existing hints.
- Production build: passes; local Node 26 / deployed Node 24 warning retained.
- Extended core workflows: 19/19 pass, including oversized PDF/image rejection before any API request, Ship Clock retry, LI filter disclosure, and direct mouse/touch food drawing while Aquarium remains paused. All external POSTs are intercepted.
- Final responsive, Campbell matrix, full captures and Axe remain in progress.

## Resumed finish — 2026-10-09T22:22:08Z

Exclusive source/render ownership continues under `/root/senior_finish_resume`, actual model `gpt-6-astra`, max. The initial invocation `/root/senior_finish` was interrupted after its source batch and passing core checks. No earlier pixels were re-read. The original 54 pre-batch reads remain recorded above.

Post-batch reads 1–3: `senior-responsive/money-320-1x-failure.png`, `money-1440-2x-failure.png`, and `lg-login-1440-2x-failure.png`. The Money total was sized against viewport width rather than its available panel width. The Scatos sign-in grid held two min-content columns at 200% CSS zoom. Repairs use container-sized type for the Money total and intrinsically wrapping sign-in columns; existing Money declarations were consolidated instead of appending overrides. No calculations or auth behavior changed.

Post-batch read 4: `senior-share/share-contact.png` (Lap Lab, TL;DR, Which Model and Driverless OG cards). Titles and scoped promises are legible at thumbnail size; stale broad OG taglines were replaced. Read 5: `senior-campbell/hero-overlap-1440.png`, a focused crop after the shortcut test exposed credit interception. The fixed-height hero placed actions in the credit band and an old active-hover selector overrode the new selected-tab surface. The hero now grows with its copy and reserves a credit band; the credit box hugs its content. Native tab rules now cover both rest and hover.

Additional final-sweep findings repaired: Radar summary contrast (4.47:1), WTWTW empty-day label contrast (2.24:1), Money/LI title consistency, TL;DR file-limit metadata, and duplicated Shop metadata. Compact JavaScript-disabled notices now identify the unavailable action only on affected app pages. Core app output and server auth remain unchanged.

Checks so far: Money/Scatos affected extreme recheck 12/12 pass; 26-route WCAG 2.2 A/AA sweep plus focused Radar/WTWTW corrections is clear. Landscape 844×390 is 26/26 clear of overflow/runtime errors. The bounded no-JS check retains static content and native sign-in forms; a word-count-only probe incorrectly flagged the terse Money form and was corrected to recognize the working native form. Five print outputs include a one-page Lap Lab workout; no print overflow. Local development LCP/CLS samples are diagnostic only, not production/field proof.

Post-batch read 6: `senior-campbell/long-lists-inspection.png`, opening and mid-list crops for City Hall and Businesses at 320px. The long page lengths came from real records, but the City Hall list also repeated speculative “Why it matters” prose and Businesses initially expanded 48 cards. Deleted the generic impact statements and their CSS. City Hall now begins with six hearings and Businesses with twelve entries, with all 18 hearings / 422 businesses available through Show more and existing filters. Official summaries, metadata and every source/action link remain. This is a focused compaction of the observed long-list defect, not a deletion of meaningful history.

## Final pixel reads and resolved checks

Reads 7–10: final core phone/desktop and all eight Campbell section contact sheets. Reads 11–14: private working/sign-in and tools phone/desktop sheets. Reads 15–16: final TV, Family Room, Driverless, Lap Lab, Coffee and Shop sheets. Read 17: five print openings and three no-JS states. Read 18: repaired Money at 320px/200% CSS zoom, Scatos sign-in zoom, compact TV queue and loaded replay links. Read 19: nineteen distinct favicons at 16px. Exact paths and SHA-256 values are in the acceptance receipt; the four sheets first read from the task's /tmp directory were copied byte-for-byte into `evidence/senior-contact/`. No pre-batch image was re-read.

The last full Axe pass caught eight loaded TV links using a 3.64:1 blue. The native link colour is now #0066cc; affected screenshots/Axe and the final check/build pass. The 84-row final capture receipt uses 69 standard + 6 synthetic private + 9 sign-in captures, replacing only the three TV rows with the corrected phase. Combined Axe coverage is 26 routes with zero selected WCAG 2/2.1/2.2 A/AA violations. Combined extreme coverage is 72/72, and Campbell is 24/24. All 19 core workflows pass; 163 core and 34 affected Campbell unit tests pass.

City Hall and Businesses at 320px now measure 7,023px and 3,792px, down from 12,032px and 10,374px in the initial extreme sweep. Six hearings and twelve businesses open initially, with all 18/422 records available. Remaining City Hall length earns its space through distinct official summaries, meeting records and source links. No source records were deleted.

The first favicon contact attempt was blocked by Astro's cross-origin dev-server protection because its page was about:blank; the same-origin rerun loads all nineteen assets. That probe failure is not a product defect. Private noindex pages intentionally omit public share metadata where not applicable. Local performance samples, print/no-JS smoke and CSS zoom are bounded checks, with no production, full-offline or physical-device claim.

## Sixteen-dimension sweep

| Dimension | Outcome | Evidence and limits |
| --- | --- | --- |
| First viewport | accepted | All 23 surfaces read at phone/desktop before the batch; final affected contact sheets confirm subject, promise and early controls. |
| Composition and rhythm | repaired | Removed repeated panels and copy; compact phone TV rows and bounded Campbell lists. City Hall 320px now 7023px and Businesses 3792px; remaining length is actual official records and source descriptions. |
| Typography | repaired | Preserved distinct app type; Money amount now follows available container width. 320px and CSS 200% zoom fit. |
| Colour and surface | repaired | Radar, WTWTW empty labels, Campbell active-hover tab and TV loaded links corrected; final selected Axe contrast rules clear. |
| Photography | accepted | Campbell all eight section crops, credits and event fallback checked; existing app/product/household images retained. No image generation or feed-photo edits. |
| Motion | accepted | Reduced-motion captures and paused Aquarium direct input work; Pixel Tide keyboard remains usable. No new decorative motion. |
| Interaction and states | accepted with scope limit | 19 core workflows plus Campbell list/filter/keyboard and retry checks pass. Default platform 404 was not redesigned or separately inspected; outside this app scope. |
| Navigation and orientation | accepted | Hub serves grouped app links; concise app footers preserve return paths. Campbell tabs/shortcuts and private profile controls retained. |
| Copy craft | repaired | Deleted generic impact paragraphs, repeated introductions and implementation narration. Outcome labels and factual comparison limits remain. |
| Performance | bounded proof | Local unthrottled development LCP/CLS samples and image/font source inspection completed. No production/field performance claim or new performance infrastructure. |
| Accessibility beyond the floor | accepted with scope limit | Final 26-route WCAG 2/2.1/2.2 A/AA selected Axe rules clear; headings/landmarks, focus and keyboard paths inspected. No physical screen-reader session. |
| Responsive | accepted with scope limit | 84 standard route-width captures, 72 extreme cases and 26 landscape views pass. 200% uses CSS zoom in Chromium; no physical-device or native browser-zoom claim. |
| Metadata and share surface | accepted | Public titles/descriptions/canonicals retained; corrected stale feature descriptions and four OG promises. 19 distinct favicon assets read at 16px. Private noindex unchanged; no public private-tool share-card requirement. |
| Print and no-JS | bounded proof | Five print exports and twelve no-JS routes checked. Lap Lab workout prints alone; dynamic tools explain JavaScript requirement while static content/native sign-in forms remain available. Not full offline app parity. |
| Distinctiveness | accepted; fleet comparison not applicable | Zine hub, quiet editorial tools, pixel games, TV and private household screens retain separate identities. Compared within this collection; no unrelated Stoa fleet audit. |
| Source hygiene | accepted | Native CSS consolidated at repaired sites; dead Driverless panels removed by builder, legacy data retained for old jobs. No fixture pages or QA processes left; diff check passes. |

Final state: accepted/frozen at 2026-10-09T22:47:38Z; no actionable findings. Source binding, actual invocation identities, retained claim locks and exact evidence coverage are in `senior-acceptance.json`. Read-only rendering and deployment authority transfers to the lead. Actual shipping proof is reserved for ignored `evidence/release.json`.
