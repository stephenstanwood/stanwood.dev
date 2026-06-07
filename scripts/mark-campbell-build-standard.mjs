#!/usr/bin/env node
/**
 * Mark the Campbell builder's current standards state.
 *
 * Intended for Codex routine sessions spawned by scripts/campbell-build-routine.mjs.
 */

import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, join } from "node:path";

const args = process.argv.slice(2);
const CODEX_HOME = process.env.CODEX_HOME ?? "/Users/stephenstanwood/.codex";
const AUTOMATION_ID = "stanwood-campbell-build-routine";
const TARGET_ID = "stanwood-campbell-guide";
const STATE_PATH = join(CODEX_HOME, "automations", AUTOMATION_ID, "campbell-build-standard.json");

function arg(name) {
  const idx = args.indexOf(name);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}

const target = arg("--target");
const status = arg("--status") ?? "partial";
const runId = arg("--run-id");
const memoryFingerprint = arg("--memory-fingerprint");
const projectFingerprint = arg("--project-fingerprint");
const note = arg("--note") ?? "";

if (!target || !["campbell", TARGET_ID].includes(target)) {
  console.error(
    `Usage: node scripts/mark-campbell-build-standard.mjs --target ${TARGET_ID} --status built-to-standard|blocked|partial|failed|running [--run-id <id>] [--memory-fingerprint <hash>] [--project-fingerprint <hash>] [--note <text>]`
  );
  process.exit(2);
}

if (!["built-to-standard", "blocked", "partial", "failed", "running"].includes(status)) {
  console.error(`Invalid status: ${status}`);
  process.exit(2);
}

function readState() {
  if (!existsSync(STATE_PATH)) return {};
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return {};
  }
}

const now = new Date().toISOString();
const prev = readState();
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

mkdirSync(dirname(STATE_PATH), { recursive: true });
writeFileSync(STATE_PATH, `${JSON.stringify(nextState, null, 2)}\n`);
console.log(`marked ${TARGET_ID} campbellBuildStandard.status=${status}`);
