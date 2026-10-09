/** Browser evidence for the app collection. Private captures stay in ignored evidence. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash, createHmac } from 'node:crypto';
import { loadEnv } from 'vite';
import { installFixturePages, mockPrivateState } from './qa-app-fixtures.mjs';

const args = process.argv.slice(2);
const option = (key, fallback) => args.includes(key) ? args[args.indexOf(key) + 1] : fallback;
const phase = option('--phase', 'after');
const origin = option('--origin', 'http://127.0.0.1:4325');
const output = option('--output', `docs/nicer/apps/evidence/${phase}/website`);
const routes = option('--routes', '/,swim,tldr,nearest-coffee,green-light,museum-label,redesign-rolodex,which-model,radar,ship-clock,wtwtw,mlb-gamerank,driverless,campbell,pixel-tide,pixel-aquarium,show-swipe,shop,tv,familyroom,money,li,lg').split(',');
const widths = option('--widths', '375,768,1440').split(',').map(Number);
const cleanupFixtures = args.includes('--fixtures') ? await installFixturePages() : async()=>{};
const env = loadEnv('development', process.cwd(), '');
const browser = await chromium.launch({ headless: true });
const context = await browser.newContext({ reducedMotion: 'reduce' });
const cookies = [];
for (const [key, name] of [['MONEY_PASSWORD', 'money_session'], ['LI_PASSWORD', 'li_session']]) {
  if (env[key]) cookies.push({ name, value: createHash('sha256').update(env[key]).digest('hex'), url: origin });
}
if (env.SCATOS_PASSWORD && env.SCATOS_SESSION_SECRET) {
  const payload = `stephen.${Math.floor(Date.now() / 1000) + 86400}`;
  cookies.push({ name: 'scatos_session', value: `${payload}.${createHmac('sha256', env.SCATOS_SESSION_SECRET).update(payload).digest('hex')}`, url: origin });
}
await context.addCookies(cookies);
if (args.includes('--fixtures')) await mockPrivateState(context);
await mkdir(output, { recursive: true });
const results = [];
try {
  for (const route of routes) {
    for (const width of widths) {
      const page = await context.newPage();
      await page.setViewportSize({ width, height: 900 });
      const errors = [];
      page.on('pageerror', e => errors.push(e.message));
      const path = route === '/' ? '/' : `/${route}`;
      try {
        const response = await page.goto(`${origin}${path}`, { waitUntil: 'domcontentloaded', timeout: 30000 });
        await page.waitForLoadState('networkidle', { timeout: 15000 }).catch(() => {});
        for(let attempt=0;attempt<3;attempt++) {
          try { await page.waitForFunction(()=>!document.querySelector('astro-island[ssr][client="load"],astro-island[ssr][client="only"]'),{},{timeout:8000});break; }
          catch(e) { if(attempt===2)throw new Error('App island did not hydrate'); await page.reload({waitUntil:'domcontentloaded'}); }
        }
        await page.waitForTimeout(1200);
        await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});
        await page.evaluate(async () => {
          await document.fonts.ready;
          for (let y = 0; y < document.body.scrollHeight; y += 700) window.scrollTo(0, y);
          window.scrollTo(0, 0);
        });
        await page.waitForTimeout(800);
        const metrics = await page.evaluate(() => {
          const visible = el => !!(el.getBoundingClientRect().width && el.getBoundingClientRect().height);
          const main = document.querySelector('main') || document.body;
          return {
            title: document.title, height: document.documentElement.scrollHeight,
            overflow: document.documentElement.scrollWidth > innerWidth,
            words: main.innerText.trim().split(/\s+/).length,
            headings: [...main.querySelectorAll('h1,h2,h3')].filter(visible).map(el => el.textContent.trim()),
            brokenImages: [...document.images].filter(el => visible(el) && el.complete && !el.naturalWidth).map(el => el.getAttribute('src')),
            controls: [...main.querySelectorAll('button,input,select,textarea')].filter(visible).length,
            noindex: document.querySelector('meta[name="robots"]')?.content || null,
            text: main.innerText.slice(0, 12000),
          };
        });
        const name = `${route === '/' ? 'home' : route.replaceAll('/', '-')}-${width}`;
        await page.screenshot({ path: `${output}/${name}.png`, fullPage: true, animations: 'disabled' });
        await page.screenshot({ path: `${output}/${name}-viewport.png`, animations: 'disabled' });
        results.push({ route: path, width, status: response?.status(), url: page.url(), errors, ...metrics });
        console.log(`${path} ${width}: ${metrics.height}px, ${metrics.words} words${metrics.overflow ? ' OVERFLOW' : ''}${errors.length ? ` ERRORS ${errors.length}` : ''}`);
      } catch (e) {
        results.push({ route: path, width, error: e.message, errors });
        console.log(`${path} ${width}: FAILED ${e.message.split('\n')[0]}`);
      } finally { await page.close(); }
    }
    await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
  }
} finally { await context.close(); await browser.close(); await cleanupFixtures(); }
await writeFile(`${output}/results.json`, JSON.stringify(results, null, 2));
if (results.some(result => result.error || result.errors.length || result.overflow || result.status >= 400)) {
  process.exitCode = 1;
}
