import test from "node:test";
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";
import { tuplesFromRows, savedTuples, seasonDates, easternDate, expectedNoSchedule, emitTs } from "./schedule.mjs";
import { publishSchedule } from "./publish.mjs";

const currentSeason = { year: 2026, start: "2026-03-25", end: "2026-09-27" };
const tuples = [["09/27/26", "3:00 PM", "6:00 PM"]];
const source = { kind: "not-found", httpStatus: 200 };
const input = { source, tuples, today: "2026-10-17", currentSeason };

test("rendered Salesforce 404 after a completed season is a no-op", () => {
  assert.equal(expectedNoSchedule(input).outcome, "no-published-schedule");
  assert.equal(expectedNoSchedule({ ...input, source: { ...source, httpStatus: 404 } }).completedSeason.end, "2026-09-27");
});

test("in-season, opening-day and final-day missing articles remain failures", () => {
  for (const today of ["2026-03-25", "2026-08-20", "2026-09-27"]) {
    assert.equal(expectedNoSchedule({ ...input, today }), null);
  }
});

test("blank rendering and HTTP denials do not become seasonal success", () => {
  assert.equal(expectedNoSchedule({ ...input, source: { kind: "article", httpStatus: 200 } }), null);
  for (const httpStatus of [0, 403, 429, 500]) {
    assert.equal(expectedNoSchedule({ ...input, source: { ...source, httpStatus } }), null);
  }
});

test("an empty, incomplete, invalid or wrong-year snapshot cannot establish a no-op", () => {
  for (const rows of [[], [["09/26/26", "3:00 PM", "6:00 PM"]], [["09/27/25", "3:00 PM", "6:00 PM"]], [["09/27/26", "25:00 PM", "6:00 PM"]], [["02/30/26", "3:00 PM", "6:00 PM"]]]) {
    assert.equal(expectedNoSchedule({ ...input, tuples: rows }), null);
  }
});

test("preseason requires the prior official season boundary and expires on opening day", () => {
  const nextSeason = { year: 2027, start: "2027-03-25", end: "2027-10-03" };
  assert.equal(expectedNoSchedule({ ...input, today: "2027-01-01", currentSeason: nextSeason }), null);
  assert.equal(expectedNoSchedule({ ...input, today: "2027-03-24", currentSeason: nextSeason, previousSeason: currentSeason }).nextSeasonStart, "2027-03-25");
  assert.equal(expectedNoSchedule({ ...input, today: "2027-03-25", currentSeason: nextSeason, previousSeason: currentSeason }), null);
});

test("MLB season metadata must be complete, real and for the requested year", () => {
  const row = { seasonId: "2026", regularSeasonStartDate: "2026-03-25", regularSeasonEndDate: "2026-09-27" };
  assert.deepEqual(seasonDates({ seasons: [row] }, 2026), currentSeason);
  for (const payload of [{}, { seasons: [] }, { seasons: [{ ...row, seasonId: "2025" }] }, { seasons: [{ ...row, regularSeasonEndDate: "2026-02-30" }] }, { seasons: [{ ...row, regularSeasonEndDate: "2025-09-27" }] }]) {
    assert.throws(() => seasonDates(payload, 2026), /valid regular-season dates/);
  }
});

test("season comparisons use Eastern dates across UTC midnight", () => {
  assert.equal(easternDate(new Date("2026-09-28T02:00:00Z")), "2026-09-27");
  assert.equal(easternDate(new Date("2026-09-28T05:00:00Z")), "2026-09-28");
});

test("valid schedule rows round-trip, deduplicate, and preserve midnight windows", () => {
  const rows = [["Tuesday", "09/22/26", "10:00 PM", "12:30 AM"], ["Tuesday", "09/22/26", "10:00 PM", "12:30 AM"], ["Sunday", ...tuples[0]], ["Day", "Date", "Start", "End"], ["Bad", "02/30/26", "3:00 PM", "6:00 PM"]];
  const parsed = tuplesFromRows(rows);
  assert.equal(parsed.length, 2);
  assert.deepEqual(savedTuples(emitTs(parsed, "2026-10-17T00:00:00Z")), parsed);
  assert.deepEqual(savedTuples("export const BIG_INNING_RAW = [];"), []);
  assert.throws(() => emitTs([], "now"), /empty or invalid/);
});

const git = (repo, ...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

test("publication preserves a dirty shared checkout, branch and index; unchanged data does not commit", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "big-inning-test-"));
  try {
    const remote = path.join(root, "remote.git");
    const repo = path.join(root, "repo");
    fs.mkdirSync(remote);
    git(remote, "init", "--bare", "--initial-branch=main");
    execFileSync("git", ["clone", remote, repo], { stdio: "pipe" });
    git(repo, "config", "user.name", "Big Inning Test");
    git(repo, "config", "user.email", "test@example.invalid");
    fs.mkdirSync(path.join(repo, "src/data"), { recursive: true });
    fs.writeFileSync(path.join(repo, "src/data/bigInningSchedule.ts"), emitTs([["09/26/26", "3:00 PM", "6:00 PM"]], "before"));
    fs.writeFileSync(path.join(repo, "parallel.txt"), "base\n");
    git(repo, "add", "src/data/bigInningSchedule.ts", "parallel.txt");
    git(repo, "commit", "-m", "initial");
    git(repo, "push", "origin", "main");
    git(repo, "switch", "-c", "parallel-work");
    fs.writeFileSync(path.join(repo, "parallel.txt"), "staged parallel work\n");
    git(repo, "add", "parallel.txt");
    fs.appendFileSync(path.join(repo, "parallel.txt"), "unstaged parallel work\n");
    const before = [git(repo, "rev-parse", "HEAD"), git(repo, "branch", "--show-current"), git(repo, "diff"), git(repo, "diff", "--cached"), fs.readFileSync(path.join(repo, "src/data/bigInningSchedule.ts"), "utf8")];
    const result = publishSchedule(repo, tuples, "after");
    assert.equal(result.outcome, "published");
    assert.deepEqual([git(repo, "rev-parse", "HEAD"), git(repo, "branch", "--show-current"), git(repo, "diff"), git(repo, "diff", "--cached"), fs.readFileSync(path.join(repo, "src/data/bigInningSchedule.ts"), "utf8")], before);
    assert.deepEqual(savedTuples(git(remote, "show", "main:src/data/bigInningSchedule.ts")), tuples);
    assert.equal(publishSchedule(repo, tuples, "new timestamp").outcome, "unchanged");
    assert.equal(git(remote, "rev-parse", "main"), result.commit);
    assert.equal(git(repo, "worktree", "list", "--porcelain").match(/^worktree /gm).length, 1);
    assert.throws(() => publishSchedule(repo, [], "now"), /empty or invalid/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test("wrapper retains failing exit status and emits no alert for success", () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "big-inning-wrapper-"));
  try {
    const installed = path.join(root, "scripts/big-inning-sync");
    fs.mkdirSync(installed, { recursive: true });
    fs.mkdirSync(path.join(root, ".claude/scripts"), { recursive: true });
    const alert = path.join(root, "alerts");
    fs.writeFileSync(path.join(root, ".claude/scripts/post-to-tasks.sh"), `#!/bin/sh\nprintf '%s\\n' "$1" >> '${alert}'\n`, { mode: 0o755 });
    // A shell function overrides the binary without changing run.sh's PATH.
    const wrapper = fileURLToPath(new URL("./run.sh", import.meta.url));
    const run = status => spawnSync("/bin/zsh", ["-c", `node() { return ${status}; }; source "$1"`, "test", wrapper], { env: { ...process.env, HOME: root }, encoding: "utf8" });
    assert.equal(run(0).status, 0);
    assert.equal(fs.existsSync(alert), false);
    assert.equal(run(3).status, 3);
    assert.equal(fs.readFileSync(alert, "utf8").split("\n").filter(Boolean).length, 1);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
