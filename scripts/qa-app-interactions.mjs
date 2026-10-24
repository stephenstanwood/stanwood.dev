/** Core workflows; all POST requests are intercepted, never sent to live services. */
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { installFixturePages, mockPrivateState } from './qa-app-fixtures.mjs';

const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4325';
const outputDir = process.argv.includes('--output')
  ? process.argv[process.argv.indexOf('--output') + 1]
  : 'docs/nicer/apps/evidence/interactions';
await mkdir(outputDir, { recursive: true });
// CLEANUP-FLAG: startup happens before the teardown guard, so a browser launch
// failure leaves temporary fixture routes behind. A separate lifecycle change
// should cover fixture installation and browser startup with the same guard.
const removeFixturePages = await installFixturePages();
const browser = await chromium.launch({ headless: true });
const results = [];
const onlyWorkflows = process.argv.includes('--only')
  ? process.argv[process.argv.indexOf('--only') + 1].split(',')
  : null;

async function runWorkflow(name, verify) {
  if (onlyWorkflows && !onlyWorkflows.includes(name)) return;
  const context = await browser.newContext({
    viewport: { width: 375, height: 900 },
    reducedMotion: 'reduce',
    hasTouch: name === 'aquarium',
    permissions: ['clipboard-read', 'clipboard-write'],
  });
  await context.route('**/*', (route) => {
    if (route.request().method() !== 'POST') return route.continue();
    return route.fulfill({
      status: 503,
      json: { error: 'Synthetic service unavailable. Try again.' },
    });
  });
  await mockPrivateState(context);
  const page = await context.newPage();
  const errors = [];
  page.on('pageerror', (error) => errors.push(error.message));
  async function navigate(route) {
    await page.goto(origin + route, { waitUntil: 'domcontentloaded' });
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.waitForFunction(
          () =>
            !document.querySelector(
              'astro-island[ssr][client="load"],astro-island[ssr][client="only"]',
            ),
          {},
          { timeout: 10000 },
        );
        break;
      } catch (error) {
        if (attempt === 2) throw error;
        await page.reload();
      }
    }
    await page.addStyleTag({
      content: 'astro-dev-toolbar{display:none!important}',
    });
  }
  try {
    await verify({ page, context, navigate });
    expect(errors).toEqual([]);
    results.push({ name, pass: true });
    console.log('PASS', name);
  } catch (error) {
    results.push({
      name,
      pass: false,
      error: error.message.split('\n').slice(0, 9).join('\n'),
      errors,
    });
    console.log('FAIL', name, error.message.split('\n')[0]);
    await page.screenshot({
      path: `${outputDir}/${name}-failure.png`,
      fullPage: true,
    });
  } finally {
    await context.close();
  }
  await writeFile(
    `${outputDir}/results.json`,
    JSON.stringify(results, null, 2),
  );
}

try {
  await runWorkflow('hub', async ({ page, navigate }) => {
    await navigate('/');
    await expect(page.getByRole('heading', { level: 1 })).toBeVisible();
    expect(await page.locator('a[href="/swim"]').count()).toBeGreaterThan(0);
    expect(
      await page
        .locator('a[href="/money"],a[href="/li"],a[href="/lg"]')
        .count(),
    ).toBe(0);
  });
  await runWorkflow('swim', async ({ page, navigate }) => {
    await navigate('/swim');
    await page.locator('.swim-config select').nth(0).selectOption('yards');
    await expect(page.locator('.swim-config select').nth(2)).toHaveValue(
      '1:35',
    );
    await page
      .getByRole('button', { name: 'Make my workout', exact: true })
      .click();
    await expect(page.locator('.swim-result')).toBeVisible();
    await page.screenshot({
      path: `${outputDir}/swim-result.png`,
      fullPage: true,
    });
    await page.locator('.swim-options summary').click();
    await expect(page.getByRole('button', { name: /Endurance/ })).toBeVisible();
  });
  await runWorkflow('tldr', async ({ page, context, navigate }) => {
    let requests = 0;
    await context.route('**/api/summarize-pdf', (route) => {
      requests++;
      return route.fulfill({
        json: {
          summary: '- A concise synthetic summary for this PDF.',
          format: 'bullets',
        },
      });
    });
    await navigate('/tldr');
    await page.locator('#btnBullets').click();
    await expect(page.locator('#btnBullets')).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.locator('input[type=file]').setInputFiles({
      name: 'example.txt',
      mimeType: 'text/plain',
      buffer: Buffer.from('example'),
    });
    await expect(page.locator('body')).toContainText('PDF');
    await page.locator('input[type=file]').setInputFiles({
      name: 'oversize.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.alloc(3 * 1024 * 1024 + 1),
    });
    await expect(page.locator('body')).toContainText('max 3 MB');
    expect(requests).toBe(0);
    await page.locator('input[type=file]').setInputFiles({
      name: 'example.pdf',
      mimeType: 'application/pdf',
      buffer: Buffer.from('%PDF-1.4\n% synthetic'),
    });
    await expect(page.locator('body')).toContainText(
      'A concise synthetic summary',
      { timeout: 15000 },
    );
    await page.screenshot({
      path: `${outputDir}/tldr-result.png`,
      fullPage: true,
    });
  });
  await runWorkflow('coffee', async ({ page, context, navigate }) => {
    await context.addInitScript(() => {
      navigator.geolocation.getCurrentPosition = (_onSuccess, onFailure) =>
        onFailure({ code: 1, message: 'Denied for QA' });
    });
    await navigate('/nearest-coffee');
    await page.getByRole('button', { name: 'Enable Location' }).click();
    await expect(page.getByRole('button', { name: 'Try Again' })).toBeVisible();
  });
  await runWorkflow('green-light', async ({ page, navigate }) => {
    await navigate('/green-light');
    for (let index = 0; index < 20; index++) {
      await page
        .getByRole('button', { name: /^Choose:/ })
        .first()
        .click();
      await page.waitForTimeout(280);
    }
    await expect(
      page.getByRole('heading', { name: 'Any dietary preferences?' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Find my order' }).click();
    await expect(
      page.getByRole('textbox', { name: 'Restaurant name' }),
    ).toBeVisible();
    await navigate('/green-light');
    await expect(
      page.getByRole('textbox', { name: 'Restaurant name' }),
    ).toBeVisible();
    await page.screenshot({
      path: `${outputDir}/green-search.png`,
      fullPage: true,
    });
  });
  await runWorkflow('museum-label', async ({ page, context, navigate }) => {
    let requests = 0;
    await context.route('**/api/museum-label', (route) => {
      requests++;
      return route.fulfill({
        json: {
          title: 'An Ordinary Masterpiece',
          artist: 'Unknown maker',
          period: 'Contemporary',
          materials: 'Ceramic',
          dimensions: 'One small object',
          description: 'A synthetic placard for interface verification.',
          accession: 'QA.2026.1',
        },
      });
    });
    await navigate('/museum-label');
    await page.locator('.ml-style-btn').nth(1).click();
    await expect(page.locator('.ml-style-btn').nth(1)).toHaveAttribute(
      'aria-pressed',
      'true',
    );
    await page.locator('input[type=file]').setInputFiles({
      name: 'oversize.png',
      mimeType: 'image/png',
      buffer: Buffer.alloc(3 * 1024 * 1024 + 1),
    });
    await expect(page.locator('body')).toContainText('under 3 MB');
    expect(requests).toBe(0);
    await page
      .locator('input[type=file]')
      .setInputFiles('public/images/campbell/ainsley-house.webp');
    await page.getByRole('button', { name: /Generate/ }).click();
    await expect(
      page.getByRole('heading', { name: 'An Ordinary Masterpiece' }),
    ).toBeVisible();
    await page.screenshot({
      path: `${outputDir}/museum-result.png`,
      fullPage: true,
    });
  });
  await runWorkflow('rolodex-retry', async ({ page, navigate }) => {
    await navigate('/redesign-rolodex');
    await page
      .getByRole('textbox', { name: 'Website URL to redesign' })
      .fill('example.com');
    await page.getByRole('button', { name: 'Spin the rolodex' }).click();
    await expect(page.locator('body')).toContainText(
      'Synthetic service unavailable',
    );
    await page.getByRole('button', { name: 'Try again' }).click();
    await expect(
      page.getByRole('textbox', { name: 'Website URL to redesign' }),
    ).toBeVisible();
  });
  await runWorkflow('which-model', async ({ page, navigate }) => {
    await navigate('/which-model');
    for (const name of [
      'Codex',
      'Gemini',
      'ChatGPT',
      'Midjourney',
      'Mistral',
    ]) {
      const index = [
        'Claude',
        'Codex',
        'Gemini',
        'ChatGPT',
        'Midjourney',
        'Mistral',
      ].indexOf(name);
      await page.locator('.wm-choice').nth(index).click();
      await expect(page.getByRole('heading', { level: 2 })).toContainText(name);
      await expect(
        page.getByRole('link', { name: `Explore ${name}` }),
      ).toHaveAttribute('href', /^https:/);
    }
  });
  await runWorkflow('ship-clock', async ({ page, context, navigate }) => {
    let requests = 0;
    await context.route('**/api/ship-clock', (route) => {
      requests++;
      if (requests === 1) {
        return route.fulfill({ status: 503, json: { error: 'Unavailable' } });
      }
      return route.fulfill({
        json: {
          lastDeploy: new Date().toISOString(),
          daysSince: 0,
          hoursSince: 0,
          summary: 'A synthetic latest update',
          prNumber: '123',
          history: [],
        },
      });
    });
    await navigate('/ship-clock');
    await page.getByRole('button', { name: 'Try again', exact: true }).click();
    await expect(page.locator('body')).toContainText('Shipped today');
    await expect(page.locator('body')).toContainText(
      'A synthetic latest update',
    );
    await page.getByText('Check another GitHub repo', { exact: true }).click();
    await expect(page.locator('input').first()).toBeVisible();
  });
  await runWorkflow('wtwtw-defaults', async ({ page, navigate }) => {
    await navigate('/wtwtw');
    await page.getByRole('button', { name: 'Toggle settings' }).click();
    for (const team of [
      'Steelers',
      'Michigan',
      'Warriors',
      'Valkyries',
      'Cubs',
      'Giants',
    ]) {
      await expect(
        page.getByRole('button', { name: `Remove ${team}` }),
      ).toBeVisible();
    }
  });
  await runWorkflow('mlb-preferences', async ({ page, navigate }) => {
    await navigate('/mlb-gamerank');
    await page.locator('.mlb-favorites summary').click();
    const chip = page.getByRole('button', {
      name: 'Toggle favorite: Chicago Cubs',
    });
    await chip.click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
    await page.reload();
    await page.locator('.mlb-favorites summary').click();
    await expect(chip).toHaveAttribute('aria-pressed', 'true');
  });
  await runWorkflow('driverless-filter', async ({ page, navigate }) => {
    await navigate('/driverless');
    await page.getByRole('searchbox').fill('TX');
    await expect(page.locator('.dl-city-list li')).toHaveCount(4);
    await page.getByRole('searchbox').fill('Unlisted');
    await expect(
      page.getByRole('button', { name: 'See all areas' }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'See all areas' }).click();
    await expect(page.locator('.dl-city-list li')).toHaveCount(15);
  });
  await runWorkflow('campbell-tabs', async ({ page, navigate }) => {
    await navigate('/campbell');
    const tabs = page.getByRole('tab');
    expect(await tabs.count()).toBe(8);
    for (let index = 0; index < 8; index++) {
      await tabs.nth(index).click();
      await expect(tabs.nth(index)).toHaveAttribute('aria-selected', 'true');
      await expect(page.getByRole('tabpanel')).toBeVisible();
    }
    await tabs.first().focus();
    await page.keyboard.press('End');
    await expect(tabs.last()).toBeFocused();
  });
  await runWorkflow('pixel-tide', async ({ page, navigate }) => {
    await navigate('/pixel-tide');
    await page.locator('canvas').focus();
    await page.keyboard.press('Enter');
    await expect(page.locator('body')).toContainText('1 standing');
    await page.getByRole('button', { name: 'reset', exact: true }).click();
  });
  await runWorkflow('aquarium', async ({ page, navigate }) => {
    await navigate('/pixel-aquarium');
    await expect(
      page.getByRole('button', { name: 'Play', exact: true }),
    ).toBeVisible();
    await page.waitForTimeout(250);
    const canvas = page.locator('canvas');
    const before = await canvas.evaluate((element) => element.toDataURL());
    await canvas.click({ position: { x: 100, y: 60 } });
    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(before);
    await expect(
      page.getByRole('button', { name: 'Play', exact: true }),
    ).toBeVisible();
    const afterClick = await canvas.evaluate((element) => element.toDataURL());
    const bounds = await canvas.boundingBox();
    await page.touchscreen.tap(bounds.x + 160, bounds.y + 80);
    await expect
      .poll(() => canvas.evaluate((element) => element.toDataURL()))
      .not.toBe(afterClick);
    await page.screenshot({
      path: `${outputDir}/aquarium-paused.png`,
      fullPage: true,
    });
    await page.getByRole('button', { name: 'Play', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Pause', exact: true }),
    ).toBeVisible();
    await page.getByRole('button', { name: 'Feed the fish' }).click();
    await page.getByRole('button', { name: 'Sunset', exact: true }).click();
    await expect(
      page.getByRole('button', { name: 'Sunset', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
    expect(page.url()).toContain('scene=sunset');
    await page.getByRole('button', { name: 'Pause', exact: true }).click();
  });
  await runWorkflow('show-swipe-recovery', async ({ page, navigate }) => {
    await navigate('/show-swipe');
    await expect(page.locator('body')).toContainText('Could not load trailers');
    await expect(
      page.getByRole('button', { name: /try again/i }),
    ).toBeVisible();
  });
  await runWorkflow('shop-modal', async ({ page, navigate }) => {
    await navigate('/shop');
    await page.getByRole('button', { name: 'size chart' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.keyboard.press('Escape');
    await expect(page.getByRole('dialog')).not.toBeVisible();
    await expect(
      page.getByRole('button', { name: 'size chart' }),
    ).toBeFocused();
    expect(
      await page.getByRole('link', { name: 'Buy' }).getAttribute('href'),
    ).toContain('stanwood.printful.me');
  });
  await runWorkflow('li-fixture', async ({ page, navigate }) => {
    await navigate('/qa-app-li');
    await expect(page.locator('.li-person')).toHaveCount(6);
    await page.getByRole('searchbox').fill('Example Person 1');
    await expect(page.locator('.li-person')).toHaveCount(1);
    await expect(
      page.getByRole('combobox', { name: 'action', exact: true }),
    ).toBeHidden();
    await page.locator('.li-filter-details summary').click();
    await page
      .getByRole('combobox', { name: 'action', exact: true })
      .selectOption('connect');
    await expect(page.locator('.li-person')).toHaveCount(1);
    await page.locator('.li-filter-details summary').click();
    await page.screenshot({
      path: `${outputDir}/li-fixture.png`,
      fullPage: true,
    });
  });
  await runWorkflow('lg-fixture', async ({ page, navigate }) => {
    await navigate('/qa-app-lg');
    await expect(page.locator('.sc-swipe-card')).toBeVisible();
    await page
      .getByRole('button', { name: 'Save for someday', exact: true })
      .click();
    await page.getByRole('button', { name: /My saves/ }).click();
    await expect(page.locator('body')).toContainText('101 Example Lane');
    await page.screenshot({
      path: `${outputDir}/lg-fixture.png`,
      fullPage: true,
    });
  });
} finally {
  await browser.close();
  await removeFixturePages();
}
console.log(
  `${results.filter((result) => result.pass).length}/${results.length} workflows passed`,
);
if (results.some((result) => !result.pass)) process.exitCode = 1;
