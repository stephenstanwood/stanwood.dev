#!/usr/bin/env node

import { AxeBuilder } from "@axe-core/playwright";
import { neon } from "@neondatabase/serverless";
import { chromium } from "playwright";
import { mkdirSync } from "node:fs";
import { resolve } from "node:path";

const args = process.argv.slice(2);
const valueAfter = (flag, fallback) => {
  const index = args.indexOf(flag);
  return index >= 0 && args[index + 1] ? args[index + 1] : fallback;
};
const baseUrl = valueAfter("--base", "http://127.0.0.1:4321").replace(/\/$/, "");
const screenshotDir = resolve(valueAfter("--screenshots", "/tmp/stanwood-li-qa"));
const password = process.env.LI_PASSWORD;
const databaseUrl = process.env.LINKEDIN_TRACKER_DATABASE_URL ??
  process.env.POSTGRES_URL ?? process.env.DATABASE_URL;
if (!password) throw new Error("LI_PASSWORD is required.");
if (!databaseUrl) throw new Error("LINKEDIN_TRACKER_DATABASE_URL is required for cleanup.");
mkdirSync(screenshotDir, { recursive: true });

const sql = neon(databaseUrl);
const failures = [];
const assert = (condition, message) => {
  if (!condition) failures.push(message);
};
const axeTags = [
  "wcag2a", "wcag2aa", "wcag21a", "wcag21aa", "wcag22a", "wcag22aa", "best-practice",
];

const browser = await chromium.launch();
const qaStartedAt = new Date();
let mutationTargetId = null;

try {
  const signedOutContext = await browser.newContext();
  const signedOut = await signedOutContext.newPage();
  await signedOut.goto(`${baseUrl}/li`, { waitUntil: "networkidle" });
  assert(new URL(signedOut.url()).pathname === "/li-login", "signed-out /li did not redirect to login");
  assert((await signedOut.locator(".li-person").count()) === 0, "signed-out page exposed people");
  assert((await signedOut.locator("[data-id]").count()) === 0, "signed-out page exposed stable ids");
  const signedOutApi = await signedOutContext.request.post(`${baseUrl}/api/li/action`, {
    data: { id: "qa:not-a-person", actioned: true },
  });
  assert(signedOutApi.status() === 401, `signed-out API returned ${signedOutApi.status()}, not 401`);
  await signedOutContext.close();

  for (const profile of [
    { name: "desktop", viewport: { width: 1440, height: 1000 }, mobile: false },
    { name: "mobile", viewport: { width: 390, height: 844 }, mobile: true },
  ]) {
    const context = await browser.newContext({
      viewport: profile.viewport,
      isMobile: profile.mobile,
      reducedMotion: "reduce",
    });
    const page = await context.newPage();
    const consoleErrors = [];
    const pageErrors = [];
    page.on("console", (message) => {
      if (message.type() === "error") consoleErrors.push(message.text());
    });
    page.on("pageerror", (error) => pageErrors.push(String(error)));

    await page.goto(`${baseUrl}/li-login`, { waitUntil: "networkidle" });
    await page.locator("#password").fill(password);
    await Promise.all([
      page.waitForURL((url) => url.pathname === "/li"),
      page.locator('button[type="submit"]').click(),
    ]);
    await page.locator('.li-page[data-ready="true"]').waitFor();
    await page.locator(".li-controls").waitFor();

    const initial = await page.evaluate(() => ({
      h1s: document.querySelectorAll("h1").length,
      connectTotal: document.querySelector(".li-lane--connect b")?.textContent?.trim(),
      followTotal: document.querySelector(".li-lane--follow b")?.textContent?.trim(),
      resultText: document.querySelector(".li-result-count")?.textContent?.replace(/\s+/g, " ").trim(),
      batchText: document.querySelector('select option[value="today"]')?.textContent?.trim(),
      dailyBatchDate: document.querySelector(".li-page")?.getAttribute("data-daily-batch-date"),
      funTitle: document.querySelector(".li-title")?.textContent?.trim(),
      rule: document.querySelector(".li-lane-rule")?.textContent?.replace(/\s+/g, " ").trim(),
      groupTitle: document.querySelector(".li-group-head h2")?.textContent?.trim(),
      groupSummary: document.querySelector(".li-group-head span")?.textContent?.replace(/\s+/g, " ").trim(),
      unknownVisible: [...document.querySelectorAll(".li-badge")].some(
        (node) => node.textContent?.trim().toLowerCase() === "unknown",
      ),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      rowCount: document.querySelectorAll(".li-person").length,
      rowIds: [...document.querySelectorAll(".li-person")].map((card) => card.getAttribute("data-id")),
      actionCheckboxCount: document.querySelectorAll('.li-actions .li-done input[type="checkbox"]').length,
      leftCheckboxCount: document.querySelectorAll('.li-person > .li-done input[type="checkbox"]').length,
      cards: [...document.querySelectorAll(".li-person")].map((card) => {
        const badges = [...card.querySelectorAll(".li-badge")].map((badge) => badge.textContent?.trim() ?? "");
        return {
          batch: Number(badges.find((badge) => badge.startsWith("batch "))?.replace("batch ", "")),
          tier: badges.find((badge) => badge.startsWith("tier "))?.replace("tier ", "") ?? "",
        };
      }),
    }));
    assert(initial.h1s === 1, `${profile.name}: expected one h1`);
    assert(initial.funTitle === "LI", `${profile.name}: playful masthead is missing`);
    assert(initial.connectTotal === "923", `${profile.name}: connection count was not 923`);
    assert(initial.followTotal === "212", `${profile.name}: follow count was not 212`);
    assert(initial.resultText === `${initial.rowCount} people`, `${profile.name}: daily result count did not match its rows`);
    assert(initial.rowCount > 0 && initial.rowCount <= 60, `${profile.name}: daily batch did not contain 1–60 remaining people`);
    assert(initial.batchText === "today · 60", `${profile.name}: daily snapshot was not fixed at 60 people`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(initial.dailyBatchDate ?? ""), `${profile.name}: daily batch date is missing`);
    assert(initial.groupTitle === "today's batch", `${profile.name}: daily batch heading is missing`);
    assert(initial.groupSummary === `${initial.rowCount} left · 60 total`, `${profile.name}: daily batch total did not stay fixed at 60`);
    assert(initial.rule?.includes("no refills until tomorrow"), `${profile.name}: no-refill rule is not explicit`);
    assert(!initial.unknownVisible, `${profile.name}: mystery contacts appeared by default`);
    assert(!initial.overflow, `${profile.name}: default view has horizontal overflow`);
    assert(
      initial.actionCheckboxCount === initial.rowCount,
      `${profile.name}: completion checkbox is not grouped with each row's actions`,
    );
    assert(initial.leftCheckboxCount === 0, `${profile.name}: completion checkbox drifted back to the left column`);

    const tierRank = { A: 0, B: 1, C: 2 };
    for (let index = 1; index < initial.cards.length; index += 1) {
      const previous = initial.cards[index - 1];
      const current = initial.cards[index];
      assert(current.batch >= previous.batch, `${profile.name}: batches are out of priority order`);
      if (current.batch === previous.batch) {
        assert(tierRank[current.tier] >= tierRank[previous.tier], `${profile.name}: tiers are out of order`);
      }
    }

    const axe = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    assert(
      axe.violations.length === 0,
      `${profile.name}: axe violations: ${axe.violations.map((violation) => violation.id).join(", ")}`,
    );

    if (profile.name === "desktop") {
      let target = page.locator(".li-person").first();
      const targetId = await target.getAttribute("data-id");
      assert(Boolean(targetId), "desktop: test row had no stable id");
      mutationTargetId = targetId;
      target = page.locator(`.li-person[data-id="${targetId}"]`);

      let responsePromise = page.waitForResponse((response) => response.url().includes("/api/li/action"));
      await target.locator('input[type="checkbox"]').click();
      let response = await responsePromise;
      assert(response.ok(), `desktop: action mutation returned ${response.status()}`);
      await target.waitFor({ state: "detached" });
      const afterAction = await page.evaluate(() => ({
        ids: [...document.querySelectorAll(".li-person")].map((card) => card.getAttribute("data-id")),
        groupSummary: document.querySelector(".li-group-head span")?.textContent?.replace(/\s+/g, " ").trim(),
      }));
      assert(afterAction.ids.length === initial.rowCount - 1, "desktop: daily batch did not count down by one");
      assert(
        afterAction.ids.every((id) => initial.rowIds.includes(id)),
        "desktop: daily batch refilled after an action",
      );
      assert(
        afterAction.groupSummary === `${initial.rowCount - 1} left · 60 total`,
        "desktop: fixed daily batch total changed after an action",
      );
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.li-page[data-ready="true"]').waitFor();
      await page.locator(".li-controls").waitFor();
      await page.selectOption(".li-controls label:last-child select", "actioned");
      target = page.locator(`.li-person[data-id="${targetId}"]`);
      await target.waitFor();
      assert(await target.locator('input[type="checkbox"]').isChecked(), "desktop: action state did not survive reload");

      responsePromise = page.waitForResponse((candidate) => candidate.url().includes("/api/li/action"));
      await target.locator('input[type="checkbox"]').click();
      response = await responsePromise;
      assert(response.ok(), `desktop: action restore returned ${response.status()}`);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.li-page[data-ready="true"]').waitFor();
      target = page.locator(`.li-person[data-id="${targetId}"]`);
      await target.waitFor();
      assert(!(await target.locator('input[type="checkbox"]').isChecked()), "desktop: action state was not restored");

      responsePromise = page.waitForResponse((candidate) => candidate.url().includes("/api/li/dismiss"));
      await target.locator("button.nah").click();
      response = await responsePromise;
      assert(response.ok(), `desktop: dismiss mutation returned ${response.status()}`);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.li-page[data-ready="true"]').waitFor();
      await page.locator(".li-controls").waitFor();
      await page.selectOption(".li-controls label:last-child select", "dismissed");
      target = page.locator(`.li-person[data-id="${targetId}"]`);
      await target.waitFor();
      responsePromise = page.waitForResponse((candidate) => candidate.url().includes("/api/li/dismiss"));
      await target.locator("button.restore").click();
      response = await responsePromise;
      assert(response.ok(), `desktop: dismiss restore returned ${response.status()}`);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.li-page[data-ready="true"]').waitFor();
      await page.locator(`.li-person[data-id="${targetId}"]`).waitFor();

      await page.selectOption(".li-controls label:last-child select", "all");
      await page.selectOption('.li-controls select', "all");
      assert(
        (await page.locator(".li-result-count").textContent())?.replace(/\s+/g, " ").trim() === "535 people · showing 100",
        "desktop: known connection count was not 535",
      );
      await page.locator(".li-unknown input").check();
      assert(
        (await page.locator(".li-result-count").textContent())?.replace(/\s+/g, " ").trim() === "923 people · showing 100",
        "desktop: all connection count was not 923",
      );
    }

    await page.locator(".li-lane--follow").click();
    await page.selectOption(".li-controls label:last-child select", "all");
    assert(
      (await page.locator(".li-result-count").textContent())?.replace(/\s+/g, " ").trim() === "212 people · showing 100",
      `${profile.name}: follow lane count was not 212`,
    );
    assert((await page.locator(".li-lane-rule").textContent())?.includes("follow-only"), `${profile.name}: follow-only rule missing`);
    assert((await page.locator(".li-badge", { hasText: "connect" }).count()) === 0, `${profile.name}: connect row in follow lane`);
    while (await page.locator(".li-more").isVisible()) await page.locator(".li-more").click();
    assert((await page.locator(".li-person").count()) === 212, `${profile.name}: full follow queue was not 212`);
    assert((await page.locator(".li-badge.flag").count()) === 13, `${profile.name}: visible flag count was not 13`);
    const badLinks = await page.locator(".li-actions a").evaluateAll((links) => links.filter((link) => {
      const href = link.getAttribute("href") ?? "";
      return !(href.startsWith("https://www.linkedin.com/in/") ||
        href.startsWith("https://www.linkedin.com/search/results/people/?keywords="));
    }).length);
    assert(badLinks === 0, `${profile.name}: follow lane contains an unsafe profile link`);
    await page.getByRole("button", { name: "by category" }).click();
    while (await page.locator(".li-more").isVisible()) await page.locator(".li-more").click();
    assert((await page.locator(".li-group").count()) === 17, `${profile.name}: follow categories were not preserved`);

    await page.locator(".li-lane--connect").click();
    if (profile.mobile) await page.locator(".li-person").first().scrollIntoViewIfNeeded();
    await page.screenshot({
      path: resolve(screenshotDir, `stanwood-li-${profile.name}.png`),
      fullPage: false,
    });
    assert(consoleErrors.length === 0, `${profile.name}: console errors: ${consoleErrors.join(" | ")}`);
    assert(pageErrors.length === 0, `${profile.name}: page errors: ${pageErrors.join(" | ")}`);
    await context.close();
  }
} finally {
  if (mutationTargetId) {
    await sql`
      UPDATE linkedin_outreach_people
      SET actioned = false, actioned_at = NULL,
          dismissed = false, dismissed_at = NULL,
          updated_at = now()
      WHERE stable_id = ${mutationTargetId}
    `;
    await sql`
      DELETE FROM linkedin_outreach_audit
      WHERE stable_id = ${mutationTargetId} AND at >= ${qaStartedAt}
    `;
  }
  await browser.close();
}

if (failures.length > 0) {
  console.error(`FAIL /li QA (${failures.length})`);
  for (const failure of failures) console.error(`- ${failure}`);
  process.exit(1);
}
console.log("PASS /li QA: password gate, fixed 60-person daily batch, no mid-day refill, durable state, two lanes, accessibility, responsive layout.");
console.log(`Screenshots: ${screenshotDir}`);
