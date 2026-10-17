#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { createHash } from "node:crypto";
import { fileURLToPath } from "node:url";
import { MLB_URL, tuplesFromRows, savedTuples, seasonDates, easternDate, expectedNoSchedule } from "./schedule.mjs";
import { publishSchedule } from "./publish.mjs";

const REPO = path.join(os.homedir(), "Projects/stanwood.dev");
const TARGET = path.join(REPO, "src/data/bigInningSchedule.ts");
const RECEIPT = process.env.BIG_INNING_RECEIPT_FILE || path.join(os.homedir(), ".local/state/big-inning-sync/latest-run.json");
const hash = bytes => createHash("sha256").update(bytes).digest("hex");
const log = message => console.log(`[${new Date().toISOString()}] ${message}`);

export async function scrape() {
  const { default: puppeteer } = await import("puppeteer");
  const browser = await puppeteer.launch({ headless: true, args: ["--no-sandbox"] });
  try {
    const page = await browser.newPage();
    await page.setUserAgent("Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Safari/605.1.15");
    const response = await page.goto(MLB_URL, { waitUntil: "domcontentloaded", timeout: 45000 });
    const httpStatus = response?.status() ?? 0;
    if (![200, 404].includes(httpStatus)) throw new Error(`MLB article returned HTTP ${httpStatus}`);
    // Salesforce keeps polling. Wait for the table or its rendered 404, never
    // interpret a still-loading shell as an absent schedule.
    await page.waitForFunction(() => /\d{1,2}\/\d{1,2}\/\d{2,4}/.test(document.body?.innerText || "")
      || Array.from(document.querySelectorAll("h1,h2,h3")).some(h => h.textContent.trim() === "404 Not Found"),
    { timeout: 45000 }).catch(() => {});
    const source = await page.evaluate(() => ({
      url: location.href,
      title: document.title,
      headings: Array.from(document.querySelectorAll("h1,h2,h3")).map(h => h.textContent.trim()),
      text: (document.body?.innerText || "").slice(0, 3000),
      rows: Array.from(document.querySelectorAll("tr")).map(tr => Array.from(tr.querySelectorAll("td,th"))
        .map(cell => (cell.textContent || "").replace(/\s+/g, " ").trim())),
    }));
    const notFound = httpStatus === 404 || (source.headings.includes("404 Not Found") && source.text.includes("We dropped the ball"));
    return { ...source, httpStatus, kind: notFound ? "not-found" : "article" };
  } finally {
    await browser.close();
  }
}

async function fetchSeason(year) {
  const url = `https://statsapi.mlb.com/api/v1/seasons/${year}?sportId=1`;
  const response = await fetch(url, { signal: AbortSignal.timeout(15000) });
  if (!response.ok) throw new Error(`MLB season metadata returned HTTP ${response.status}`);
  return { ...seasonDates(await response.json(), year), url };
}

function writeReceipt(receipt) {
  fs.mkdirSync(path.dirname(RECEIPT), { recursive: true, mode: 0o700 });
  const temporary = `${RECEIPT}.${process.pid}.tmp`;
  fs.writeFileSync(temporary, `${JSON.stringify(receipt, null, 2)}\n`, { mode: 0o600 });
  fs.renameSync(temporary, RECEIPT);
}

export async function main(args = process.argv.slice(2)) {
  if (args.some(arg => arg !== "--check")) throw new Error("Usage: node sync.mjs [--check]");
  const receipt = { startedAt: new Date().toISOString(), host: os.hostname(), mode: args.includes("--check") ? "check" : "sync", status: "error", exitCode: 2 };
  let before;
  try {
    before = fs.readFileSync(TARGET);
    receipt.scheduleBefore = hash(before);
    log(`starting big-inning ${receipt.mode}`);
    receipt.source = await scrape();
    const tuples = tuplesFromRows(receipt.source.rows);
    receipt.rows = tuples.length;
    log(`extracted ${tuples.length} schedule rows (${receipt.source.kind})`);
    if (!tuples.length) {
      receipt.exitCode = 3;
      // Only an actual removed article can qualify for the seasonal no-op.
      if (receipt.source.kind !== "not-found") throw new Error("No rows parsed; current schedule preserved");
      const today = easternDate();
      const year = Number(today.slice(0, 4));
      const currentSeason = await fetchSeason(year);
      const previousSeason = today < currentSeason.start ? await fetchSeason(year - 1) : null;
      receipt.seasons = { today, currentSeason, previousSeason };
      const expected = expectedNoSchedule({ source: receipt.source, tuples: savedTuples(before.toString()), today, currentSeason, previousSeason });
      if (!expected) throw new Error("Removed MLB schedule is not a verified seasonal no-op; current schedule preserved");
      Object.assign(receipt, expected);
      receipt.preservedWindows = savedTuples(before.toString()).length;
      log(`no published schedule after verified season end ${expected.completedSeason.end}; preserving ${receipt.preservedWindows} windows`);
    } else if (receipt.source.kind !== "article") {
      throw new Error("Refusing schedule rows from an MLB error page");
    } else if (receipt.mode === "check") {
      receipt.outcome = "schedule-available";
    } else {
      receipt.exitCode = 1;
      Object.assign(receipt, publishSchedule(REPO, tuples, new Date().toISOString()));
      log(`schedule ${receipt.outcome}`);
    }
    receipt.status = "ok";
    receipt.exitCode = 0;
  } catch (error) {
    receipt.error = error.message;
    console.error(error.message);
  } finally {
    receipt.completedAt = new Date().toISOString();
    receipt.scheduleAfter = fs.existsSync(TARGET) ? hash(fs.readFileSync(TARGET)) : null;
    receipt.sharedSchedulePreserved = receipt.scheduleBefore === receipt.scheduleAfter;
    // Both seasonal no-ops and checks must leave the saved schedule byte-exact.
    if ((receipt.mode === "check" || receipt.outcome === "no-published-schedule") && !receipt.sharedSchedulePreserved) {
      receipt.status = "error";
      receipt.exitCode = 1;
      receipt.error = "Saved schedule changed during a read-only run";
    }
    writeReceipt(receipt);
  }
  return receipt;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().then(receipt => { process.exitCode = receipt.exitCode; }).catch(error => {
    console.error(error.message); process.exitCode = 2;
  });
}
