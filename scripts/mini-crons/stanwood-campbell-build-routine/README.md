# Stanwood Campbell Build Routine

Recurring Mini Codex builder for `stanwood.dev/campbell`.

The selector is `scripts/campbell-build-routine.mjs`. It fingerprints the Campbell guide source, relevant project memory, and Codex memory, then emits one target prompt when the guide needs a standards pass. The marker is `scripts/mark-campbell-build-standard.mjs`, which writes:

`/Users/stephenstanwood/.codex/automations/stanwood-campbell-build-routine/campbell-build-standard.json`

Manual dry run:

```sh
node scripts/campbell-build-routine.mjs --json --target campbell --dry-run
```

Force a real run selection:

```sh
node scripts/campbell-build-routine.mjs --json --target campbell --force
```

The target is intentionally narrow: the Campbell city guide, its Campbell data/components/API helpers/assets, and shared files only when `/campbell` directly needs them. It must not work on `/about`, `/money`, `/tv`, shop, NBA Now, Show Swipe, or unrelated stanwood.dev surfaces.
