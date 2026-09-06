#!/usr/bin/env node
import assert from 'node:assert/strict';
import { mkdirSync, writeFileSync } from 'node:fs';
import { chromium } from 'playwright';
import { AxeBuilder } from '@axe-core/playwright';
import { neon } from '@neondatabase/serverless';

const base = process.env.SCATOS_QA_BASE || 'http://127.0.0.1:4345';
const folder = process.env.SCATOS_QA_OUTPUT || '/tmp/scatosswip-qa';
const smokeOnly = process.argv.includes('--smoke');
const password = process.env.SCATOS_PASSWORD;
assert(password, 'SCATOS_PASSWORD is required');
mkdirSync(folder, { recursive: true });
const sql = neon(process.env.SCATOS_DATABASE_URL);
const checks = [];
const touched = new Set();
const before = smokeOnly ? [] : await sql`SELECT * FROM scatosswip.choices`;
if (!smokeOnly) writeFileSync(`${folder}/choices-before.json`, JSON.stringify(before), { mode: 0o600 });
const browser = await chromium.launch();
const contexts = [];
const errors = [];
async function context(profile, viewport = { width: 1440, height: 950 }) {
  const ctx = await browser.newContext({ viewport, reducedMotion: 'reduce', isMobile: viewport.width < 500, hasTouch: viewport.width < 500 });
  contexts.push(ctx);
  await ctx.addInitScript(() => {
    new MutationObserver(() => document.querySelector('astro-dev-toolbar')?.remove())
      .observe(document, { childList: true, subtree: true });
  });
  const page = await ctx.newPage();
  page.on('pageerror', error => errors.push(error.message));
  page.on('request', request => {
    if (request.method() === 'POST' && request.url().endsWith('/api/lg/state')) {
      try { const body = request.postDataJSON(); if (body.id) touched.add(body.id); } catch {}
    }
  });
  await page.goto(`${base}/lg/login`);
  await page.locator(`input[value="${profile}"]`).check({ force: true });
  await page.locator('#password').fill(password);
  await Promise.all([page.waitForURL(url => url.pathname === '/lg'), page.getByRole('button', { name: 'Let’s have a look' }).click()]);
  await page.locator('.sc-app[data-ready="true"]').waitFor();
  await page.evaluate(() => document.fonts.ready);
  // Astro's development toolbar is not part of the shipped app or its audit.
  await page.evaluate(() => document.querySelector('astro-dev-toolbar')?.remove());
  return { ctx, page };
}
async function state(ctx) {
  const response = await ctx.request.get(`${base}/api/lg/state`);
  assert.equal(response.status(), 200);
  assert.match(response.headers()['cache-control'], /no-store/);
  return response.json();
}
async function post(ctx, id, decision, extra = {}) {
  touched.add(id);
  const response = await ctx.request.post(`${base}/api/lg/state`, { headers: { Origin: base }, data: { id, decision, ...extra } });
  assert.equal(response.status(), 200, await response.text());
  return response.json();
}
async function action(page, action) {
  const [result] = await Promise.all([
    page.waitForResponse(r => r.url().endsWith('/api/lg/state') && r.request().method() === 'POST'),
    action(),
  ]);
  assert.equal(result.status(), 200, await result.text());
  await page.waitForFunction(() => !document.querySelector('.sc-swipe-actions button.save:disabled'));
  return result.json();
}
try {
  const signedOut = await browser.newContext(); contexts.push(signedOut);
  const redirect = await signedOut.request.get(`${base}/lg`, { maxRedirects: 0 });
  assert.equal(redirect.status(), 302);
  assert.equal((await signedOut.request.get(`${base}/api/lg/state`)).status(), 401);
  const badLogin = await signedOut.request.post(`${base}/lg/login`, { headers: { Origin: base }, form: { profile: 'stephen', password: 'incorrect-qa-code' } });
  assert.equal(badLogin.status(), 401);
  checks.push('Signed-out pages and API are protected; wrong password rejected.');
  const { ctx: stephen, page } = await context('stephen');
  const initial = await state(stephen);
  assert.equal(initial.profile, 'stephen');
  assert(initial.homes.length > 0);
  assert(initial.homes.filter(h => h.status === 'active').every(h => h.schools.high === 'Los Gatos High School' && h.price <= 4_000_000 && h.beds >= 4 && h.baths >= 2));
  const id = initial.homes.find(h => h.status === 'active' && !initial.choices.some(c => c.id === h.id))?.id;
  assert(id, 'Need an unswiped home for UI verification.');
  const invalid = await stephen.request.post(`${base}/api/lg/state`, { headers: { Origin: base }, data: { id, decision: 'invalid' } });
  assert.equal(invalid.status(), 400);
  const csrf = await stephen.request.post(`${base}/api/lg/state`, { headers: { Origin: 'https://example.com' }, data: { id, decision: 'save' } });
  assert.equal(csrf.status(), 403);
  checks.push('Only qualifying homes are served; invalid writes and cross-origin writes rejected.');
  const beforeBrowsing = await state(stephen);
  const browsePosts = [];
  const trackBrowsing = request => { if (request.method() === 'POST' && request.url().endsWith('/api/lg/state')) browsePosts.push(request.url()); };
  page.on('request', trackBrowsing);
  const firstAddress = await page.locator('.sc-card-content h2').textContent();
  await page.getByRole('button', { name: 'Previous home', exact: true }).click();
  assert.notEqual(await page.locator('.sc-card-content h2').textContent(), firstAddress);
  await page.getByRole('button', { name: 'Next home', exact: true }).click();
  assert.equal(await page.locator('.sc-card-content h2').textContent(), firstAddress);
  await page.keyboard.press('ArrowRight');
  assert.notEqual(await page.locator('.sc-card-content h2').textContent(), firstAddress);
  await page.keyboard.press('ArrowLeft');
  assert.equal(await page.locator('.sc-card-content h2').textContent(), firstAddress);
  assert.deepEqual((await state(stephen)).choices, beforeBrowsing.choices);
  assert.deepEqual(browsePosts, []);
  page.off('request', trackBrowsing);
  checks.push('Previous/Next wrap around; arrow keys browse without requests or recorded choices.');

  for (const viewport of [{ width: 1440, height: 950 }, { width: 768, height: 1024 }, { width: 390, height: 844 }, { width: 320, height: 740 }]) {
    await page.setViewportSize(viewport);
    await page.locator('.sc-photo img').first().evaluate(image => image.decode().catch(() => {}));
    const dims = await page.evaluate(() => ({ width: document.documentElement.clientWidth, scroll: document.documentElement.scrollWidth }));
    assert(dims.scroll <= dims.width, `${viewport.width}px horizontal overflow: ${JSON.stringify(dims)}`);
    await page.screenshot({ path: `${folder}/explore-${viewport.width}.png`, fullPage: true });
    const axe = await new AxeBuilder({ page }).include('.sc-app').withTags(['wcag2a', 'wcag2aa', 'wcag21aa', 'wcag22aa']).analyze();
    const violations = axe.violations.map(v => ({ id: v.id, impact: v.impact, nodes: v.nodes.map(n => ({ target: n.target, summary: n.failureSummary })) }));
    writeFileSync(`${folder}/axe-${viewport.width}.json`, JSON.stringify(violations, null, 2));
    assert.equal(violations.length, 0, `${viewport.width}px accessibility: ${JSON.stringify(violations)}`);
  }
  checks.push('1440, 768, 390 and 320px: no horizontal overflow or WCAG A/AA violations.');
  await page.setViewportSize({ width: 390, height: 844 });
  await page.getByRole('button', { name: /^Filters/ }).click();
  const filterDialog = page.getByRole('dialog');
  await filterDialog.getByText('Van Meter Elementary', { exact: true }).click();
  await filterDialog.getByRole('button', { name: /^Explore \d/ }).click();
  const firstId = (await state(stephen)).homes.filter(h => h.status === 'active' && /Van Meter/.test(h.schools.elementary || '') && !initial.choices.some(c => c.id === h.id))[0].id;
  await page.getByRole('button', { name: 'The little details' }).click();
  assert(await page.getByRole('dialog').getByText('The school path').isVisible());
  await page.keyboard.press('Escape');
  checks.push('Mobile filters and accessible details dialog work.');
  if (process.argv.includes('--mock-decisions')) {
    await page.getByRole('button', { name: 'Filters', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: 'Reset filters', exact: true }).click();
    await page.getByRole('dialog').getByRole('button', { name: /^Explore \d/ }).click();
    // Exercise cursor changes without touching either person's real choices.
    const fixture = structuredClone(await state(stephen));
    await page.route('**/api/lg/state', async route => {
      if (route.request().method() === 'POST') {
        const body = route.request().postDataJSON();
        fixture.choices = fixture.choices.filter(choice => choice.id !== body.id);
        if (body.decision !== null) fixture.choices.push({ id: body.id, decision: body.decision, note: body.note || '', updatedAt: new Date().toISOString() });
      }
      await route.fulfill({ status: 200, contentType: 'application/json', body: JSON.stringify(fixture) });
    });
    try {
      const skipped = await page.locator('.sc-card-content h2').textContent();
      await page.getByRole('button', { name: 'Next home', exact: true }).click();
      const chosen = await page.locator('.sc-card-content h2').textContent();
      assert.notEqual(chosen, skipped);
      await action(page, () => page.getByRole('button', { name: 'Not quite', exact: true }).click());
      assert.notEqual(await page.locator('.sc-card-content h2').textContent(), chosen);
      assert.notEqual(await page.locator('.sc-card-content h2').textContent(), skipped);
      await action(page, () => page.getByRole('button', { name: 'Undo', exact: true }).click());
      assert.equal(await page.locator('.sc-card-content h2').textContent(), chosen);
      await page.getByRole('button', { name: 'Previous home', exact: true }).click();
      assert.equal(await page.locator('.sc-card-content h2').textContent(), skipped);
      assert.deepEqual((await state(stephen)).choices, initial.choices);
      checks.push('After browsing ahead, a decision advances correctly and Undo returns to that home; tested with isolated UI responses.');
    } finally { await page.unroute('**/api/lg/state'); await page.reload(); await page.locator('[data-ready="true"]').waitFor(); }
  }

  if (!smokeOnly) {
    // Test a failed write before any successful one: the card must not advance.
    const address = await page.locator('.sc-card-content h2').textContent();
    await page.route('**/api/lg/state', route => route.request().method() === 'POST'
      ? route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ error: 'QA: saving unavailable' }) }) : route.continue());
    await page.getByRole('button', { name: 'Save for someday', exact: true }).click();
    await page.getByRole('alert').waitFor();
    assert.equal(await page.locator('.sc-card-content h2').textContent(), address);
    await page.unroute('**/api/lg/state');
    const saved = await action(page, () => page.getByRole('button', { name: 'Save for someday', exact: true }).click());
    assert(saved.choices.some(c => c.id === firstId && c.decision === 'save'));
    await page.reload(); await page.locator('[data-ready="true"]').waitFor();
    assert((await state(stephen)).choices.some(c => c.id === firstId && c.decision === 'save'));
    const { ctx: madeleine, page: mPage } = await context('madeleine', { width: 390, height: 844 });
    const mState = await state(madeleine);
    assert.equal(mState.profile, 'madeleine');
    assert(!mState.choices.some(c => c.id === firstId), 'Swipes must be independent');
    await post(madeleine, firstId, 'save', { profile: 'stephen' });
    const mutual = await state(stephen);
    assert(mutual.matches.includes(firstId));
    assert((await state(madeleine)).matches.includes(firstId));
    await page.reload(); await page.locator('[data-ready="true"]').waitFor();
    await page.getByRole('button', { name: /Our matches/ }).click();
    await page.getByRole('button', { name: 'View ' + mutual.homes.find(h => h.id === firstId).address, exact: true }).click();
    await page.locator('#sc-note').fill('QA note: a yard for someday.');
    await page.getByRole('button', { name: 'Save note', exact: true }).click();
    await page.getByRole('button', { name: 'Note saved', exact: true }).waitFor();
    assert.equal((await state(stephen)).choices.find(c => c.id === firstId).note, 'QA note: a yard for someday.');
    await page.screenshot({ path: `${folder}/detail-mobile.png`, fullPage: true });
    await page.keyboard.press('Escape');
    await page.getByRole('button', { name: /Explore/ }).click();
    const beforePass = await page.locator('.sc-card-content h2').textContent();
    await page.locator('h1').first().click();
    await page.getByRole('button', { name: 'Not quite', exact: true }).focus();
    await action(page, () => page.keyboard.press('Enter'));
    assert.notEqual(await page.locator('.sc-card-content h2').textContent(), beforePass);
    await action(page, () => page.getByRole('button', { name: 'Undo', exact: true }).click());
    assert.equal(await page.locator('.sc-card-content h2').textContent(), beforePass);
    const box = await page.locator('.sc-swipe-card').boundingBox();
    await action(page, async () => {
      await page.mouse.move(box.x + box.width / 2, box.y + 180);
      await page.mouse.down(); await page.mouse.move(box.x + box.width / 2 + 120, box.y + 180, { steps: 8 }); await page.mouse.up();
    });
    await action(page, () => page.getByRole('button', { name: 'Undo', exact: true }).click());
    checks.push('Swipes, keyboard, undo, notes, reload persistence, separate profiles and mutual matches verified; failed writes do not advance the deck.');
    // User data survives leaving the feed; its active status is independent of saves.
    await sql`UPDATE scatosswip.listings SET active=false WHERE id=${firstId}`;
    try { const archived = await state(stephen); assert(archived.homes.some(h => h.id === firstId && h.status === 'archived')); }
    finally { await sql`UPDATE scatosswip.listings SET active=true WHERE id=${firstId}`; }
    checks.push('Saved homes remain after leaving the active feed.');
    await mPage.reload(); await mPage.locator('[data-ready="true"]').waitFor();
    const touchCard = await mPage.locator('.sc-swipe-card').boundingBox();
    const touchAddress = await mPage.locator('.sc-card-content h2').textContent();
    const cdp = await madeleine.newCDPSession(mPage);
    await action(mPage, async () => {
      const x = touchCard.x + touchCard.width / 2, y = touchCard.y + 120;
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchStart', touchPoints: [{ x, y }] });
      for (let move = 1; move <= 8; move++) await cdp.send('Input.dispatchTouchEvent', { type: 'touchMove', touchPoints: [{ x: x - move * 16, y }] });
      await cdp.send('Input.dispatchTouchEvent', { type: 'touchEnd', touchPoints: [] });
    });
    assert.notEqual(await mPage.locator('.sc-card-content h2').textContent(), touchAddress);
    await action(mPage, () => mPage.getByRole('button', { name: 'Undo', exact: true }).click());
    assert.equal(await mPage.locator('.sc-card-content h2').textContent(), touchAddress);
    await cdp.detach();
    checks.push('Actual touch swipes and undo work in the mobile browser.');

    await mPage.getByRole('button', { name: 'Sign out' }).click();
    await mPage.waitForURL('**/lg/login');
    assert.equal((await madeleine.request.get(`${base}/api/lg/state`)).status(), 401);
    checks.push('Sign-out clears authenticated access.');
  }
  assert.deepEqual(errors, [], 'Browser runtime errors');
  writeFileSync(`${folder}/result.json`, JSON.stringify({ pass: true, base, checks, checkedAt: new Date().toISOString() }, null, 2));
  console.log(JSON.stringify({ pass: true, checks }, null, 2));
} catch (error) {
  for (const [i, ctx] of contexts.entries()) for (const p of ctx.pages()) {
    await p.screenshot({ path: `${folder}/failure-${i}.png`, fullPage: true }).catch(() => {});
    console.error(await p.locator('button').evaluateAll(buttons => buttons.map(b => ({ text: b.textContent, disabled: b.disabled, label: b.getAttribute('aria-label') }))));
  }
  throw error;
} finally {
  if (!smokeOnly && touched.size) {
    const restore = [];
    for (const id of touched) {
      restore.push(sql`DELETE FROM scatosswip.choices WHERE listing_id=${id}`);
      for (const row of before.filter(row => row.listing_id === id)) restore.push(sql`INSERT INTO scatosswip.choices(profile,listing_id,decision,note,updated_at) VALUES (${row.profile},${row.listing_id},${row.decision},${row.note},${row.updated_at})`);
    }
    await sql.transaction(restore);
  }
  await Promise.all(contexts.map(ctx => ctx.close()));
  await browser.close();
}
