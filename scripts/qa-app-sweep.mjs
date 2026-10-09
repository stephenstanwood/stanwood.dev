/** Bounded landscape, no-JS, print, metadata and local performance evidence. */
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
import { installFixturePages, mockPrivateState } from './qa-app-fixtures.mjs';

const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4325';
const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const output = option('--output', 'docs/nicer/apps/evidence/senior-sweep');
const modes = new Set(option('--modes', 'landscape,no-js,print').split(','));
const routes = option('--routes', '/,swim,tldr,nearest-coffee,green-light,museum-label,redesign-rolodex,which-model,radar,ship-clock,wtwtw,mlb-gamerank,driverless,campbell,pixel-tide,pixel-aquarium,show-swipe,shop,tv,familyroom,money,qa-app-li,qa-app-lg,li-login,money-login,lg/login').split(',');
const noJSRoutes = ['/', 'swim', 'tldr', 'museum-label', 'which-model', 'driverless', 'campbell', 'money', 'qa-app-li', 'li-login', 'money-login', 'lg/login'].filter(route => routes.includes(route));
const printRoutes = ['/', 'swim', 'driverless', 'campbell', 'money'].filter(route => routes.includes(route));
const performanceRoutes = new Set(['/', 'swim', 'tldr', 'driverless', 'campbell']);
await mkdir(output, { recursive: true });
const cleanup = await installFixturePages();
const env = loadEnv('development', process.cwd(), '');
const browser = await chromium.launch({ headless: true });
/** @type {any[]} */
const results = [];
const url = route => origin + (route === '/' ? '/' : `/${route}`);
const file = route => route === '/' ? 'home' : route.replaceAll('/', '-');

async function context(options) {
  const ctx = await browser.newContext({ reducedMotion: 'reduce', ...options });
  await ctx.route('**/*', r => r.request().method() === 'POST' ? r.fulfill({ status: 503, json: { error: 'Test only' } }) : r.continue());
  await mockPrivateState(ctx);
  if (env.MONEY_PASSWORD) await ctx.addCookies([{ name: 'money_session', value: createHash('sha256').update(env.MONEY_PASSWORD).digest('hex'), url: origin }]);
  return ctx;
}

async function ready(page) {
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      await page.waitForFunction(() => !document.querySelector('astro-island[ssr][client="load"],astro-island[ssr][client="only"]'), {}, { timeout: 8000 });
      break;
    } catch (e) {
      if (attempt === 2) throw e;
      await page.reload({ waitUntil: 'domcontentloaded' });
    }
  }
  await page.addStyleTag({ content: 'astro-dev-toolbar{display:none!important}' });
  await page.evaluate(() => document.fonts.ready);
  await page.waitForTimeout(500);
}

try {
  if (modes.has('landscape')) {
  const landscape = await context({ viewport: { width: 844, height: 390 }, hasTouch: true });
  await landscape.addInitScript(() => {
    window['__qaPerformance'] = { lcp: null, cls: 0 };
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) window['__qaPerformance'].lcp = { milliseconds: entry.startTime, tag: entry.element?.tagName || null, text: entry.element?.textContent?.slice(0, 100) || null };
    }).observe({ type: 'largest-contentful-paint', buffered: true });
    new PerformanceObserver(list => {
      for (const entry of list.getEntries()) if (!entry.hadRecentInput) window['__qaPerformance'].cls += entry.value;
    }).observe({ type: 'layout-shift', buffered: true });
  });
  for (const route of routes) {
    const page = await landscape.newPage();
    const errors = [];
    page.on('pageerror', e => errors.push(e.message));
    try {
      const response = await page.goto(url(route), { waitUntil: 'domcontentloaded' });
      await ready(page);
      const data = await page.evaluate(() => ({
        overflow: document.documentElement.scrollWidth > innerWidth,
        lang: document.documentElement.lang,
        title: document.title,
        description: document.querySelector('meta[name=description]')?.getAttribute('content'),
        canonical: document.querySelector('link[rel=canonical]')?.getAttribute('href'),
        favicon: document.querySelector('link[rel=icon]')?.getAttribute('href'),
        ogImage: document.querySelector('meta[property="og:image"]')?.getAttribute('content'),
        noindex: document.querySelector('meta[name=robots]')?.getAttribute('content'),
        h1: [...document.querySelectorAll('h1')].map(el => el.textContent.trim()),
        performance: window['__qaPerformance'],
      }));
      if (!performanceRoutes.has(route)) delete data.performance;
      results.push({ mode: 'landscape-and-metadata', route, status: response.status(), ...data, errors });
      if (data.overflow || errors.length) await page.screenshot({ path: `${output}/${file(route)}-landscape-failure.png`, fullPage: true });
      console.log(`landscape ${route}: ${data.overflow || errors.length ? 'FAIL' : 'PASS'}`);
    } catch (e) { results.push({ mode: 'landscape-and-metadata', route, error: e.message, errors }); }
    finally { await page.close(); }
    await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  }
  await landscape.close();
  }

  if (modes.has('no-js')) {
  const noJS = await context({ javaScriptEnabled: false, viewport: { width: 375, height: 900 } });
  for (const route of noJSRoutes) {
    const page = await noJS.newPage();
    try {
      const response = await page.goto(url(route), { waitUntil: 'domcontentloaded' });
      await page.evaluate(() => document.fonts.ready);
      const data = await page.evaluate(() => ({
        visibleWords: (document.querySelector('main') || document.body).innerText.trim().split(/\s+/).length,
        noScript: [...document.querySelectorAll('noscript')].map(el => el.textContent.trim()),
        nativeForms: [...document.forms].filter(form => form.method === 'post' && form.querySelector('input[name]') && form.querySelector('button[type=submit]')).length,
        overflow: document.documentElement.scrollWidth > innerWidth,
      }));
      results.push({ mode: 'no-js', route, status: response.status(), ...data });
      if (['money', 'tldr', 'campbell'].includes(route)) await page.screenshot({ path: `${output}/${file(route)}-no-js.png`, fullPage: true });
      console.log(`no-js ${route}: ${data.visibleWords} words, ${data.noScript.length} notices${data.overflow ? ' OVERFLOW' : ''}`);
    } catch (e) { results.push({ mode: 'no-js', route, error: e.message }); }
    finally { await page.close(); }
  }
  await noJS.close();
  }

  if (modes.has('print')) {
  const print = await context({ viewport: { width: 816, height: 1056 } });
  for (const route of printRoutes) {
    const page = await print.newPage();
    try {
      await page.goto(url(route), { waitUntil: 'domcontentloaded' });
      await ready(page);
      if (route === 'swim') {
        await page.getByRole('button', { name: 'Make my workout' }).click();
        await expect(page.locator('.swim-result')).toBeVisible();
      }
      await page.emulateMedia({ media: 'print' });
      const data = await page.evaluate(() => {
        const visible = el => {
          const style = getComputedStyle(el);
          return el.getBoundingClientRect().width > 0 && el.getBoundingClientRect().height > 0 && style.visibility !== 'hidden' && style.display !== 'none';
        };
        return { overflow: document.documentElement.scrollWidth > innerWidth, visibleHeadings: [...document.querySelectorAll('h1,h2,h3')].filter(visible).map(el => el.textContent.trim()), visibleText: [...document.querySelectorAll('main p, main li')].filter(visible).map(el => el.textContent.trim()).slice(0, 10) };
      });
      await page.pdf({ path: `${output}/${file(route)}-print.pdf`, format: 'Letter', printBackground: true });
      await page.screenshot({ path: `${output}/${file(route)}-print.png`, fullPage: true });
      results.push({ mode: 'print', route, ...data });
      console.log(`print ${route}: ${data.visibleHeadings.length} headings${data.overflow ? ' OVERFLOW' : ''}`);
    } catch (e) { results.push({ mode: 'print', route, error: e.message }); }
    finally { await page.close(); }
  }
  await print.close();
  }
} finally { await browser.close(); await cleanup(); }
await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
if (results.some(r => r.error || r.overflow || r.errors?.length || r.status >= 400 || (r.mode === 'no-js' && r.visibleWords < 4 && !r.nativeForms))) process.exitCode = 1;
