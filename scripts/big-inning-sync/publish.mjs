import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync } from "node:child_process";
import { emitTs, stripStamp } from "./schedule.mjs";

const TARGET = "src/data/bigInningSchedule.ts";
const git = (repo, ...args) => execFileSync("git", ["-C", repo, ...args], { encoding: "utf8", stdio: ["ignore", "pipe", "pipe"] }).trim();

export function publishSchedule(repo, tuples, generatedAt) {
  const next = emitTs(tuples, generatedAt); // Validate before any Git operation.
  git(repo, "fetch", "origin", "main");
  const base = git(repo, "rev-parse", "origin/main");
  const previous = git(repo, "show", `${base}:${TARGET}`);
  if (stripStamp(previous.trim()) === stripStamp(next.trim())) return { outcome: "unchanged", base };

  // Never check out, reset, stage or commit in the shared Mini working tree.
  const temporary = fs.mkdtempSync(path.join(os.tmpdir(), "big-inning-publish-"));
  const checkout = path.join(temporary, "checkout");
  let added = false;
  try {
    git(repo, "worktree", "add", "--detach", checkout, base);
    added = true;
    fs.writeFileSync(path.join(checkout, TARGET), next);
    git(checkout, "add", "--", TARGET);
    git(checkout, "commit", "-m", `tv: refresh big inning schedule (${tuples.length} windows)`, "--", TARGET);
    const commit = git(checkout, "rev-parse", "HEAD");
    // A concurrent publication rejects normally; never force or reset to retry.
    git(checkout, "push", "origin", "HEAD:refs/heads/main");
    return { outcome: "published", base, commit };
  } finally {
    if (!added) fs.rmdirSync(temporary);
    else if (git(checkout, "status", "--porcelain") === "") {
      git(repo, "worktree", "remove", checkout);
      fs.rmdirSync(temporary);
    } else {
      console.error(`Preserved failed publication for inspection: ${checkout}`);
    }
  }
}
