#!/usr/bin/env node
/**
 * Mini Codex routine selector for the stanwood.dev Campbell guide.
 *
 * This script does not build the page. It decides whether the Campbell surface
 * needs another standards pass, records a running marker, and prints the
 * target-specific prompt for a Codex routine session to execute.
 */

import { createHash, randomUUID } from "node:crypto";
import { execFileSync } from "node:child_process";
import {
  existsSync,
  lstatSync,
  mkdirSync,
  readFileSync,
  readdirSync,
  writeFileSync,
} from "node:fs";
import { dirname, join, relative, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const args = process.argv.slice(2);
const DRY = args.includes("--dry-run");
const JSON_OUT = args.includes("--json");
const FORCE = args.includes("--force");
const targetArg = valueAfter("--target");
const REPO_ROOT = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const CODEX_HOME = process.env.CODEX_HOME ?? "/Users/stephenstanwood/.codex";
const CLAUDE_MEMORY_DIR =
  "/Users/stephenstanwood/.claude/projects/-Users-stephenstanwood-Projects-stanwood-dev/memory";
const AUTOMATION_ID = "stanwood-campbell-build-routine";
const TARGET_ID = "stanwood-campbell-guide";
const STATE_PATH = join(CODEX_HOME, "automations", AUTOMATION_ID, "campbell-build-standard.json");
const STALE_RUNNING_MS = Number(process.env.CAMPBELL_BUILD_STALE_RUNNING_MS ?? String(6 * 60 * 60 * 1000));
const REBUILD_INTERVAL_MS = Number(process.env.CAMPBELL_BUILD_INTERVAL_MS ?? String(7 * 24 * 60 * 60 * 1000));

const TARGET_PATHS = [
  "src/pages/campbell.astro",
  "src/pages/api/campbell",
  "src/components/campbell",
  "src/lib/campbell",
  "src/data/campbell.ts",
  "src/data/campbellBusinesses.json",
  "src/data/campbellCouncilRecords.json",
  "src/data/campbellEvents.json",
  "src/data/campbellPublicHearings.json",
  "public/favicon-campbell.svg",
  "public/images/campbell.webp",
  "public/images/campbell",
  "scripts/campbell-build-routine.mjs",
  "scripts/mark-campbell-build-standard.mjs",
  "scripts/mini-crons/stanwood-campbell-build-routine/README.md",
  "scripts/sync-campbell-data.mjs",
  "src/layouts/BaseLayout.astro",
  "src/lib/ogPages.ts",
  "package.json",
  "package-lock.json",
  "astro.config.mjs",
  "tsconfig.json",
];

if (targetArg && !["campbell", TARGET_ID].includes(targetArg)) {
  console.error(`Unsupported target: ${targetArg}`);
  process.exit(2);
}

function valueAfter(flag) {
  const idx = args.indexOf(flag);
  return idx >= 0 ? args[idx + 1] ?? null : null;
}

function hashParts(parts) {
  const h = createHash("sha256");
  for (const part of parts) h.update(String(part)).update("\0");
  return h.digest("hex").slice(0, 20);
}

function listFiles(root, opts = {}) {
  if (!existsSync(root)) return [];
  const out = [];
  const max = opts.maxFiles ?? 1_500;
  const st = lstatSync(root);
  if (st.isFile()) return opts.include && !opts.include.test(root) ? [] : [root];

  const walk = (dir) => {
    if (out.length >= max) return;
    for (const name of readdirSync(dir).sort()) {
      const p = join(dir, name);
      const rel = relative(root, p);
      if (opts.exclude?.test(rel)) continue;
      const child = lstatSync(p);
      if (child.isDirectory()) {
        walk(p);
        continue;
      }
      if (!child.isFile()) continue;
      if (opts.include && !opts.include.test(rel)) continue;
      out.push(p);
      if (out.length >= max) return;
    }
  };
  walk(root);
  return out;
}

function gitTrackedFiles(pathspecs) {
  try {
    const out = execFileSync("git", ["ls-files", "-z", "--", ...pathspecs], {
      cwd: REPO_ROOT,
      encoding: "utf8",
    });
    return out.split("\0").filter(Boolean).map((p) => join(REPO_ROOT, p));
  } catch {
    return pathspecs.flatMap((p) => listFiles(join(REPO_ROOT, p)));
  }
}

function fileDigest(path) {
  const st = lstatSync(path);
  const rel = path.startsWith(REPO_ROOT) ? relative(REPO_ROOT, path) : path;
  if (st.size > 800_000 || /\.(pdf|png|jpg|jpeg|webp|gif|zip|sqlite|db)$/i.test(path)) {
    return `${rel}:${st.size}:${Math.floor(st.mtimeMs)}`;
  }
  return `${rel}:${st.size}:${hashParts([readFileSync(path, "utf8")])}`;
}

function memoryFingerprint() {
  const files = [
    join(CODEX_HOME, "memories/MEMORY.md"),
    join(CODEX_HOME, "memories/memory_summary.md"),
    join(CODEX_HOME, "skills/prototype-ui-design-loop/SKILL.md"),
    join(CODEX_HOME, "skills/claude-project-memory/SKILL.md"),
    join(CODEX_HOME, "skills/stoa-build/SKILL.md"),
    ...listFiles(join(CODEX_HOME, "memories/extensions/ad_hoc/notes"), {
      include: /\.md$/,
      maxFiles: 700,
    }),
    ...listFiles(CLAUDE_MEMORY_DIR, {
      include: /\.md$/,
      exclude: /(^|\/)(archive|archived)\//i,
      maxFiles: 500,
    }),
  ].filter((p, idx, arr) => existsSync(p) && arr.indexOf(p) === idx).sort();

  return {
    hash: hashParts(files.map(fileDigest)),
    files,
  };
}

function projectFingerprint() {
  const files = gitTrackedFiles(TARGET_PATHS)
    .filter((p, idx, arr) => arr.indexOf(p) === idx)
    .filter((p) => existsSync(p))
    .sort();
  return {
    hash: hashParts(files.map(fileDigest)),
    files,
  };
}

function readState() {
  if (!existsSync(STATE_PATH)) return null;
  try {
    return JSON.parse(readFileSync(STATE_PATH, "utf8"));
  } catch {
    return null;
  }
}

function writeState(state) {
  mkdirSync(dirname(STATE_PATH), { recursive: true });
  writeFileSync(STATE_PATH, `${JSON.stringify(state, null, 2)}\n`);
}

function msSince(value) {
  const t = Date.parse(value ?? "");
  return Number.isFinite(t) ? Date.now() - t : Infinity;
}

function shouldSkip(state, memoryHash, projectHash) {
  if (FORCE) return null;
  if (!state) return null;

  if (state.status === "running" && msSince(state.updatedAt ?? state.startedAt) < STALE_RUNNING_MS) {
    return `run ${state.runId ?? "(unknown)"} is still marked running`;
  }

  const sameFingerprints =
    state.memoryFingerprint === memoryHash && state.projectFingerprint === projectHash;

  if (state.status === "built-to-standard" && sameFingerprints) {
    if (msSince(state.builtAt ?? state.updatedAt) < REBUILD_INTERVAL_MS) {
      return "already built-to-standard for the current Campbell project and memory fingerprints";
    }
    return null;
  }

  if (state.status === "blocked" && sameFingerprints) {
    return "blocked for the current Campbell project and memory fingerprints";
  }

  return null;
}

function relativeFiles(files) {
  return files.map((p) => relative(REPO_ROOT, p)).sort();
}

function buildPrompt(runId, memoryHash, projectHash, files) {
  const markCommand =
    `node scripts/mark-campbell-build-standard.mjs --target ${TARGET_ID} ` +
    `--status built-to-standard --run-id ${runId} ` +
    `--memory-fingerprint ${memoryHash} --project-fingerprint ${projectHash} ` +
    `--note "Campbell guide verified"`;

  return `You are the Mini stanwood.dev Campbell Builder. Work in /Users/stephenstanwood/Projects/stanwood.dev.

Target: stanwood.dev/campbell, the Campbell, CA city guide and its directly supporting data, components, API helpers, images, and sync script.

Goal: periodically apply the latest lessons, standards, and tools from Stephen's recent prototype/site work to the Campbell guide. The page should feel photo-forward, polished, local, and useful; the writing should be plain English for residents. Do not turn it into a source-count brag sheet, a generated field guide, or a broad stanwood.dev cleanup.

Before editing:
- Run git pull --rebase origin main and inspect git status.
- Read AGENTS.md/CLAUDE.md if present, the stanwood.dev Claude memory, and the relevant Codex memories around Campbell, prototype UI lessons, and local scheduled work.
- Review /campbell in the current source before deciding what to improve.

Scope allowed:
- ${files.join("\n- ")}
- Shared layout/style files only when the Campbell route directly needs them.
- Tests or config only when needed for Campbell verification.

Out of scope:
- /about, /money, /tv, shop, private pages, NBA Now, Show Swipe, trademark/TMCat surfaces, unrelated homepage work, and any Stoa bid/proposal work.
- New autonomous panels, explainers, galleries, timelines, "six things" sections, SEO appendices, or filler content.
- Invented local facts, fake event descriptions, guessed statuses, or uncited new images. If a factual claim cannot be verified, leave it vague or skip it.

Campbell-specific bar:
- Keep the first viewport visually strong and unmistakably Campbell.
- Keep the obvious first click useful.
- Keep civic records, public hearings, events, businesses, safety, housing/property, and resident links plain-English and resident-centered.
- Exclude operational absences or team-only notices such as "No Wave Team Practice"; civic meetings and public hearings are welcome.
- If using outside visual/design tools or a provider-neutral design loop is materially useful, use what is currently callable; otherwise make the best local pass with browser/Playwright screenshot QA.

Verification:
- Run npm run build.
- Run focused tests/checks if you touch logic or data parsing; npx astro check is preferred when feasible.
- For visual changes, run a local dev or preview server and capture/review /campbell at desktop and mobile widths. Fix mobile overflow, overlapping text, blank hydration states, and large empty whitespace before shipping.

Shipping:
- Commit and push only real, verified Campbell improvements on main. Do not force-push. If there are no changes after review, that is fine.
- At closeout, run scripts/mark-campbell-build-standard.mjs with status built-to-standard, blocked, partial, failed, or running. Use this exact success form when finished:
${markCommand}
- If blocked or partial, keep the same run id, memory fingerprint, and project fingerprint, and put the exact blocker in --note.

Final response must include: target ${TARGET_ID}, project fingerprint ${projectHash}, status marked, commit sha if any, and exact remaining blocker if any. Keep it short.`;
}

const memory = memoryFingerprint();
const project = projectFingerprint();
const state = readState();
const skipReason = shouldSkip(state, memory.hash, project.hash);

if (skipReason) {
  const result = {
    selected: false,
    targetId: TARGET_ID,
    reason: skipReason,
    memoryFingerprint: memory.hash,
    projectFingerprint: project.hash,
    state,
  };
  if (JSON_OUT) console.log(JSON.stringify(result, null, 2));
  else console.log(`${TARGET_ID}: ${skipReason}`);
  process.exit(0);
}

const runId = randomUUID();
const projectFiles = relativeFiles(project.files);
const prompt = buildPrompt(runId, memory.hash, project.hash, projectFiles);
const nextState = {
  targetId: TARGET_ID,
  routine: AUTOMATION_ID,
  status: "running",
  runId,
  memoryFingerprint: memory.hash,
  projectFingerprint: project.hash,
  startedAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  note: FORCE ? "forced Campbell standards run" : "selected for Campbell standards run",
};

if (!DRY) writeState(nextState);

const result = {
  selected: true,
  targetId: TARGET_ID,
  title: "stanwood.dev Campbell guide",
  agency: "Campbell, CA",
  dryRun: DRY,
  forced: FORCE,
  runId,
  memoryFingerprint: memory.hash,
  projectFingerprint: project.hash,
  statePath: STATE_PATH,
  trackedFiles: projectFiles,
  prompt,
};

if (JSON_OUT) console.log(JSON.stringify(result, null, 2));
else console.log(prompt);
