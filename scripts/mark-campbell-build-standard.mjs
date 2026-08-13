#!/usr/bin/env node
/**
 * Mark the Campbell builder's current standards state.
 *
 * Intended for Codex routine sessions spawned by scripts/campbell-build-routine.mjs.
 */

import {
  AUTOMATION_ID,
  BUILD_STATUSES,
  TARGET_ID,
  flagValue,
  readState,
  writeState,
} from "./campbell-build-state.mjs";

const args = process.argv.slice(2);

const target = flagValue(args, "--target");
const status = flagValue(args, "--status") ?? "partial";
const runId = flagValue(args, "--run-id");
const memoryFingerprint = flagValue(args, "--memory-fingerprint");
const projectFingerprint = flagValue(args, "--project-fingerprint");
const note = flagValue(args, "--note") ?? "";

if (!target || !["campbell", TARGET_ID].includes(target)) {
  console.error(
    `Usage: node scripts/mark-campbell-build-standard.mjs --target ${TARGET_ID} --status ${BUILD_STATUSES.join("|")} [--run-id <id>] [--memory-fingerprint <hash>] [--project-fingerprint <hash>] [--note <text>]`
  );
  process.exit(2);
}

if (!BUILD_STATUSES.includes(status)) {
  console.error(`Invalid status: ${status}`);
  process.exit(2);
}

const now = new Date().toISOString();
const prev = readState() ?? {};
const nextState = {
  ...prev,
  targetId: TARGET_ID,
  routine: AUTOMATION_ID,
  status,
  runId: runId ?? prev.runId ?? null,
  memoryFingerprint: memoryFingerprint ?? prev.memoryFingerprint ?? null,
  projectFingerprint: projectFingerprint ?? prev.projectFingerprint ?? null,
  note,
  updatedAt: now,
  ...(status === "running" ? { startedAt: prev.startedAt ?? now } : {}),
  ...(status === "built-to-standard" ? { builtAt: now, blockedAt: null } : {}),
  ...(status === "blocked" ? { blockedAt: now } : {}),
};

writeState(nextState);
console.log(`marked ${TARGET_ID} campbellBuildStandard.status=${status}`);
