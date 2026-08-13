/**
 * Shared state contract for the Campbell build routine.
 *
 * campbell-build-routine.mjs decides whether another standards pass is due and
 * writes the marker; mark-campbell-build-standard.mjs updates that same marker
 * from inside the Codex session it spawns. Both need to agree on where the file
 * lives and what identifies the target, so the constants live here rather than
 * being restated (and able to drift) in each script.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

export const CODEX_HOME = process.env.CODEX_HOME ?? "/Users/stephenstanwood/.codex";
export const AUTOMATION_ID = "stanwood-campbell-build-routine";
export const TARGET_ID = "stanwood-campbell-guide";
export const STATE_PATH = join(
  CODEX_HOME,
  "automations",
  AUTOMATION_ID,
  "campbell-build-standard.json",
);

/** Statuses mark-campbell-build-standard.mjs accepts, in rough lifecycle order. */
export const BUILD_STATUSES = [
  "running",
  "built-to-standard",
  "blocked",
  "partial",
  "failed",
];

/** Read the marker, or null when it's missing or unparseable. */
export function readState() {
  if (!existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

export function writeState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

/** The argv value following `flag`, or null when the flag is absent or trailing. */
export function flagValue(args, flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}
