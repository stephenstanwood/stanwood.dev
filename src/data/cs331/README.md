# CS 331 Midterm Lab

Personal, unlisted study pages at `/331` and `/331/outline`. Both documents carry
`noindex,nofollow` and are excluded from the sitemap. They use their own study
layout and keep progress in the visitor's browser.

The editable source lives in `/Users/stephenstanwood/Projects/cs331/midterm-prep`
and its existing Sites source repository, project
`appgprj_6ae2259bbb3c81918cce7d0be0e64942`. The two HTML files here are compiled
publication artifacts; the Astro routes emit them without a surrounding layout.

To update these pages, run `npm test` and `npm run build -- --base=/331` in the
source project, then copy `dist/index.html` to `game.html` and
`dist/outline/index.html` to `outline.html` here. Build and verify both routes.
Only these compiled documents belong in this repository. Canvas research,
student attempt history, credentials, and local QA captures stay in the source
project's ignored private directories.

The separate Sites publication continues using the source build without
`--base`, preserving its existing private audience. Progress export/import is
available in the game when moving between the two origins.

## Final Lab

`/331/final` uses `final.html`. It is unlisted and also carries
`noindex,nofollow`. The editable source is in
`/Users/stephenstanwood/Projects/cs331/final-prep`. Run `npm test` and
`npm run build` there, then copy `dist/index.html` here as `final.html`.
It contains the 61 adapted Canvas self-check questions from Modules 6–10
and 94 additional exercises. The quiz mode includes source links and worked
explanations. Canvas captures and student history stay outside publication.
