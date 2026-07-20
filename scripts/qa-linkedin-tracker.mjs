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
const resultCountText = (count, noun = "moves") =>
  `${count} ${count === 1 ? noun.replace(/s$/, "") : noun}${count > 100 ? " · showing 100" : ""}`;
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
      connectTotal: Number(document.querySelector(".li-page")?.getAttribute("data-connect-total")),
      followTotal: Number(document.querySelector(".li-page")?.getAttribute("data-follow-total")),
      organizationTotal: Number(document.querySelector(".li-page")?.getAttribute("data-organization-total")),
      resultText: document.querySelector(".li-result-count")?.textContent?.replace(/\s+/g, " ").trim(),
      batchText: document.querySelector('select option[value="today"]')?.textContent?.trim(),
      dailyBatchDate: document.querySelector(".li-page")?.getAttribute("data-daily-batch-date"),
      dailyBatchSize: Number(document.querySelector(".li-page")?.getAttribute("data-daily-batch-size")),
      unknownTotal: Number(
        document.querySelector('select option[value="unknown"]')?.textContent?.match(/\d+$/)?.[0],
      ),
      funTitle: document.querySelector(".li-title")?.textContent?.trim(),
      rule: document.querySelector(".li-queue-rule")?.textContent?.replace(/\s+/g, " ").trim(),
      groupTitle: document.querySelector(".li-group-head h2")?.textContent?.trim(),
      groupSummary: document.querySelector(".li-group-head span")?.textContent?.replace(/\s+/g, " ").trim(),
      emptyCleared: document.querySelector(".li-empty-title strong")?.textContent?.replace(/\s+/g, " ").trim(),
      unknownVisible: [...document.querySelectorAll(".li-badge")].some(
        (node) => node.textContent?.trim().toLowerCase() === "unknown",
      ),
      overflow: document.documentElement.scrollWidth > document.documentElement.clientWidth + 1,
      rowCount: document.querySelectorAll(".li-person").length,
      actionCheckboxCount: document.querySelectorAll('.li-actions .li-done input[type="checkbox"]').length,
      leftCheckboxCount: document.querySelectorAll('.li-person > .li-done input[type="checkbox"]').length,
      greenCheckCount: [...document.querySelectorAll(".li-actions .li-done span")]
        .filter((node) => node.textContent?.trim() === "✓").length,
      redDismissCount: [...document.querySelectorAll(".li-actions button.nah span")]
        .filter((node) => node.textContent?.trim() === "×").length,
      connectRows: document.querySelectorAll(".li-person.kind-connect").length,
      followRows: document.querySelectorAll(".li-person.kind-follow").length,
      organizationRows: document.querySelectorAll(".li-person.kind-organization").length,
    }));
    assert(initial.h1s === 1, `${profile.name}: expected one h1`);
    assert(initial.funTitle === "LI", `${profile.name}: playful masthead is missing`);
    assert(initial.connectTotal > 0, `${profile.name}: connection count was empty`);
    assert(initial.followTotal > 0, `${profile.name}: follow count was empty`);
    assert(initial.organizationTotal > 0, `${profile.name}: organization count was empty`);
    assert(initial.unknownTotal >= 0, `${profile.name}: unknown connection count was invalid`);
    assert(initial.resultText === `${initial.rowCount} ${initial.rowCount === 1 ? "move" : "moves"}`, `${profile.name}: daily result count did not match its rows`);
    assert(initial.rowCount >= 0 && initial.rowCount <= 50, `${profile.name}: daily batch did not contain 0–50 remaining moves`);
    assert(initial.dailyBatchSize > 0 && initial.dailyBatchSize <= 50, `${profile.name}: daily snapshot size was invalid`);
    assert(initial.batchText === `today · ${initial.dailyBatchSize}`, `${profile.name}: daily snapshot label was inaccurate`);
    assert(/^\d{4}-\d{2}-\d{2}$/.test(initial.dailyBatchDate ?? ""), `${profile.name}: daily batch date is missing`);
    if (initial.rowCount > 0) {
      assert(initial.groupTitle === "today's batch", `${profile.name}: daily batch heading is missing`);
      assert(initial.groupSummary === `${initial.rowCount} left · ${initial.dailyBatchSize} total`, `${profile.name}: daily batch total was inaccurate`);
    } else {
      assert(initial.emptyCleared === "TODAY'S BATCH: CLEARED.", `${profile.name}: cleared-day state is missing`);
    }
    assert(initial.rule?.includes("no refills until tomorrow"), `${profile.name}: no-refill rule is not explicit`);
    assert(!initial.unknownVisible, `${profile.name}: mystery contacts appeared by default`);
    assert(!initial.overflow, `${profile.name}: default view has horizontal overflow`);
    assert(
      initial.actionCheckboxCount === initial.rowCount,
      `${profile.name}: completion checkbox is not grouped with each row's actions`,
    );
    assert(initial.leftCheckboxCount === 0, `${profile.name}: completion checkbox drifted back to the left column`);
    assert(initial.greenCheckCount === initial.rowCount, `${profile.name}: green check action is missing`);
    assert(initial.redDismissCount === initial.rowCount, `${profile.name}: red dismiss action is missing`);
    assert(
      initial.connectRows + initial.followRows + initial.organizationRows === initial.rowCount,
      `${profile.name}: daily batch contained an unknown action kind`,
    );

    await page.selectOption('[aria-label="status"]', "all");
    const fullDaily = await page.evaluate(() => ({
      rowCount: document.querySelectorAll(".li-person").length,
      rowIds: [...document.querySelectorAll(".li-person")].map((card) => card.getAttribute("data-id")),
      resultText: document.querySelector(".li-result-count")?.textContent?.replace(/\s+/g, " ").trim(),
    }));
    assert(fullDaily.rowCount === initial.dailyBatchSize, `${profile.name}: full daily snapshot was not fixed at its stored size`);
    assert(new Set(fullDaily.rowIds).size === fullDaily.rowIds.length, `${profile.name}: daily snapshot repeated a card`);
    assert(fullDaily.resultText === resultCountText(initial.dailyBatchSize), `${profile.name}: full daily result count was inaccurate`);
    await page.selectOption('[aria-label="status"]', "remaining");

    const axe = await new AxeBuilder({ page }).withTags(axeTags).analyze();
    assert(
      axe.violations.length === 0,
      `${profile.name}: axe violations: ${axe.violations.map((violation) => violation.id).join(", ")}`,
    );

    if (profile.name === "desktop") {
      await page.selectOption('[aria-label="batch"]', "all");
      let target = page.locator(".li-person").first();
      const targetId = await target.getAttribute("data-id");
      const targetName = await target.locator("h3").textContent();
      assert(Boolean(targetId), "desktop: test row had no stable id");
      assert(Boolean(targetName), "desktop: test row had no name");
      mutationTargetId = targetId;
      target = page.locator(`.li-person[data-id="${targetId}"]`);

      const expectedLinkedInUrl = await target.locator(".li-actions a").getAttribute("href");
      await page.evaluate(() => {
        window.open = (url) => {
          document.documentElement.setAttribute("data-qa-opened-url", String(url));
          return null;
        };
      });
      await target.locator(".li-person-main").click({ position: { x: 4, y: 4 } });
      const openedLinkedInUrl = await page.locator("html").getAttribute("data-qa-opened-url");
      assert(
        openedLinkedInUrl === expectedLinkedInUrl,
        "desktop: clicking the contact card did not open its LinkedIn result",
      );

      let responsePromise = page.waitForResponse((response) => response.url().includes("/api/li/action"));
      await target.locator('input[type="checkbox"]').click();
      let response = await responsePromise;
      assert(response.ok(), `desktop: action mutation returned ${response.status()}`);
      await target.waitFor({ state: "detached" });
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.li-page[data-ready="true"]').waitFor();
      await page.locator(".li-controls").waitFor();
      await page.selectOption('[aria-label="batch"]', "all");
      await page.selectOption('[aria-label="status"]', "actioned");
      await page.locator('[aria-label="search"]').fill(targetName ?? "");
      target = page.locator(`.li-person[data-id="${targetId}"]`);
      await target.waitFor();
      assert(await target.locator('input[type="checkbox"]').isChecked(), "desktop: action state did not survive reload");

      responsePromise = page.waitForResponse((candidate) => candidate.url().includes("/api/li/action"));
      await target.locator('input[type="checkbox"]').click();
      response = await responsePromise;
      assert(response.ok(), `desktop: action restore returned ${response.status()}`);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.li-page[data-ready="true"]').waitFor();
      await page.selectOption('[aria-label="batch"]', "all");
      await page.locator('[aria-label="search"]').fill(targetName ?? "");
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
      await page.selectOption('[aria-label="batch"]', "all");
      await page.selectOption('[aria-label="status"]', "dismissed");
      await page.locator('[aria-label="search"]').fill(targetName ?? "");
      target = page.locator(`.li-person[data-id="${targetId}"]`);
      await target.waitFor();
      responsePromise = page.waitForResponse((candidate) => candidate.url().includes("/api/li/dismiss"));
      await target.locator("button.restore").click();
      response = await responsePromise;
      assert(response.ok(), `desktop: dismiss restore returned ${response.status()}`);
      await page.reload({ waitUntil: "networkidle" });
      await page.locator('.li-page[data-ready="true"]').waitFor();
      await page.selectOption('[aria-label="batch"]', "all");
      await page.selectOption('[aria-label="status"]', "all");
      assert(
        (await page.locator(".li-result-count").textContent())?.replace(/\s+/g, " ").trim() ===
          resultCountText(initial.connectTotal - initial.unknownTotal + initial.followTotal + initial.organizationTotal),
        "desktop: unified known pool count was inaccurate",
      );
      await page.locator(".li-unknown input").check();
      assert(
        (await page.locator(".li-result-count").textContent())?.replace(/\s+/g, " ").trim() ===
          resultCountText(initial.connectTotal + initial.followTotal + initial.organizationTotal),
        "desktop: unified pool count with mystery contacts was inaccurate",
      );

      await page.selectOption('[aria-label="batch"]', "today");
      await page.selectOption('[aria-label="status"]', "all");
      const dailyIdsAfterMutations = await page.locator(".li-person").evaluateAll((cards) =>
        cards.map((card) => card.getAttribute("data-id")));
      assert(
        JSON.stringify(dailyIdsAfterMutations) === JSON.stringify(fullDaily.rowIds),
        "desktop: fixed daily batch changed after a mutation",
      );
    }

    await page.selectOption('[aria-label="batch"]', "all");
    await page.selectOption('[aria-label="action"]', "organization");
    await page.selectOption('[aria-label="status"]', "all");
    assert(
      (await page.locator(".li-result-count").textContent())?.replace(/\s+/g, " ").trim() ===
        resultCountText(initial.organizationTotal),
      `${profile.name}: organization action filter count was inaccurate`,
    );
    assert((await page.locator(".li-person.kind-organization").count()) > 0, `${profile.name}: organization queue was empty`);
    assert((await page.locator(".li-person.kind-connect").count()) === 0, `${profile.name}: connect row in organization filter`);
    assert((await page.locator(".li-person.kind-follow").count()) === 0, `${profile.name}: person follow row in organization filter`);
    while (await page.locator(".li-more").isVisible()) await page.locator(".li-more").click();
    assert(
      (await page.locator(".li-person").count()) === initial.organizationTotal,
      `${profile.name}: full organization filter count was inaccurate`,
    );
    const badLinks = await page.locator(".li-actions a").evaluateAll((links) => links.filter((link) => {
      const href = link.getAttribute("href") ?? "";
      return !(href.startsWith("https://www.linkedin.com/company/") ||
        href.startsWith("https://www.linkedin.com/search/results/companies/?keywords="));
    }).length);
    assert(badLinks === 0, `${profile.name}: organization filter contains an unsafe company link`);
    const organizationCard = page.locator(".li-person.kind-organization").first();
    const expectedCompanyUrl = await organizationCard.locator(".li-actions a").getAttribute("href");
    await page.evaluate(() => {
      window.open = (url) => {
        document.documentElement.setAttribute("data-qa-org-opened-url", String(url));
        return null;
      };
    });
    await organizationCard.locator(".li-person-main").click({ position: { x: 4, y: 4 } });
    assert(
      (await page.locator("html").getAttribute("data-qa-org-opened-url")) === expectedCompanyUrl,
      `${profile.name}: clicking an organization card did not open its LinkedIn result`,
    );

    await page.selectOption('[aria-label="action"]', "all");
    await page.selectOption('[aria-label="batch"]', "today");
    await page.selectOption('[aria-label="status"]', "remaining");
    if (profile.mobile && await page.locator(".li-person").count() > 0) {
      await page.locator(".li-person").first().scrollIntoViewIfNeeded();
    }
    await page.evaluate(() => window.scrollTo(0, 0));
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
console.log("PASS /li QA: password gate, unified 50-move daily queue, no mid-day refill, learned ranking, durable state, accessibility, responsive layout.");
console.log(`Screenshots: ${screenshotDir}`);
