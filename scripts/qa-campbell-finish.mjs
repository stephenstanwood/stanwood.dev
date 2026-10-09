/** Warm all Campbell panels at desktop and both phone widths. No source writes. */
import { chromium, expect } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
const origin = process.env.QA_ORIGIN || 'http://127.0.0.1:4325';
const output = 'docs/nicer/apps/evidence/senior-campbell';
await mkdir(output, { recursive: true });
const browser = await chromium.launch({ headless: true });
const results = [];
const sections = ['events','digest','businesses','safety','homes','history','data','links'];
async function warm(page) {
  await page.evaluate(async () => {
    await document.fonts.ready;
    for (let y = 0; y < document.documentElement.scrollHeight; y += 650) {
      window.scrollTo(0, y);
      await new Promise(resolve => setTimeout(resolve, 50));
    }
  });
  await page.evaluate(() => Promise.race([
    Promise.all([...document.images].map(image => image.decode().catch(() => {}))),
    new Promise(resolve => setTimeout(resolve, 5000)),
  ]));
  await page.waitForTimeout(250);
  await page.evaluate(() => window.scrollTo(0, 0));
}
try {
  for (const width of [1440,390,320]) {
    const context = await browser.newContext({ viewport:{width,height:900}, reducedMotion:'reduce', hasTouch:width<500 });
    await context.route('**/*', route => route.request().method()==='POST' ? route.fulfill({status:503,json:{error:'Test only'}}) : route.continue());
    const page = await context.newPage();
    const errors = [];
    page.on('pageerror', error => errors.push(error.message));
    await page.goto(`${origin}/campbell`, { waitUntil:'domcontentloaded' });
    await page.waitForFunction(() => !document.querySelector('astro-island[ssr][client="load"]'));
    await page.addStyleTag({ content:'astro-dev-toolbar{display:none!important}' });
    for (const section of sections) {
      const tab = page.locator(`#campbell-tab-${section}`);
      await tab.click();
      await expect(tab).toHaveAttribute('aria-selected','true');
      await expect(page.locator(`#campbell-panel-${section}`)).toBeVisible();
      await warm(page);
      const metrics = await page.evaluate(() => {
        const visible = el => el.getBoundingClientRect().width>1 && el.getBoundingClientRect().height>1 && getComputedStyle(el).visibility!=='hidden' && getComputedStyle(el).opacity!=='0';
        const panel = document.querySelector('[role=tabpanel]');
        const images = [...panel.querySelectorAll('img')].filter(visible).map(el=>({src:el.getAttribute('src'),complete:el.complete,naturalWidth:el.naturalWidth}));
        return {
          height:document.documentElement.scrollHeight,
          overflow:document.documentElement.scrollWidth>innerWidth,
          heading:panel.querySelector('h2')?.textContent,
          text:panel.innerText,
          images,
          brokenImages:images.filter(el=>el.complete&&!el.naturalWidth),
          controls:[...panel.querySelectorAll('button,summary,input,select')].filter(visible).length,
          smallButtons:[...document.querySelectorAll('button')].filter(visible).filter(el=>{const r=el.getBoundingClientRect();return r.width<24||r.height<24;}).map(el=>el.textContent.trim()),
          credit:document.querySelector('.cb-footer-credits')?.textContent.trim(),
        };
      });
      const file = `${section}-${width}`;
      await page.screenshot({path:`${output}/${file}.png`,fullPage:true,animations:'disabled'});
      await writeFile(`${output}/${file}.txt`,metrics.text);
      results.push({section,width,...metrics,errors:[...errors]});
      console.log(`${section} ${width}: ${metrics.height}px, ${metrics.images.length} images, ${metrics.controls} controls${metrics.overflow?' OVERFLOW':''}`);
      await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
      if (section === 'businesses') {
        const before = await page.locator('.cb-business-card').count();
        expect(before).toBe(12);
        await page.locator('.cb-business-more').click();
        expect(await page.locator('.cb-business-card').count()).toBe(422);
        await page.getByRole('textbox',{name:'Search businesses'}).fill('QA no matching business 123');
        await expect(page.locator('.cb-business-card')).toHaveCount(0);
        await page.getByRole('button',{name:'Clear filters',exact:true}).click();
        await expect(page.locator('.cb-business-card')).toHaveCount(before);
      }
      if (section === 'digest') {
        await expect(page.locator('.cb-hearing-card')).toHaveCount(6);
        await page.locator('.cb-hearing-more').click();
        await expect(page.locator('.cb-hearing-card')).toHaveCount(18);
        const filters = page.locator('[aria-label="Public hearing filters"]');
        await filters.getByRole('button',{name:'Planning',exact:true}).click();
        await expect(filters.getByRole('button',{name:'Planning',exact:true})).toHaveAttribute('aria-pressed','true');
        expect(await page.locator('.cb-hearing-card').count()).toBeLessThanOrEqual(6);
        await filters.getByRole('button',{name:'All',exact:true}).click();
        await expect(page.locator('.cb-hearing-card')).toHaveCount(6);
      }
    }
    const firstTab = page.locator('#campbell-tab-events');
    await firstTab.focus();
    await page.keyboard.press('End');
    await expect(page.locator('#campbell-tab-links')).toBeFocused();
    await page.keyboard.press('Home');
    await expect(firstTab).toBeFocused();
    await page.locator('.cb-today > summary').click();
    await expect(page.getByRole('heading',{name:'Happening today'})).toBeVisible();
    await page.locator('.cb-today > summary').click();
    await page.locator('.cb-event-sources > summary').click();
    await expect(page.locator('.cb-event-sources a').first()).toBeVisible();
    await page.locator('.cb-event-sources > summary').click();
    const initialCount = await page.locator('.cb-event-card').count();
    const more = page.locator('.cb-event-more');
    if (await more.count()) { await more.click(); expect(await page.locator('.cb-event-card').count()).toBeGreaterThan(initialCount); }
    await page.locator('[aria-label="Event date filters"]').getByRole('button',{name:'This weekend',exact:true}).click();
    await expect(page.locator('[aria-label="Event date filters"]').getByRole('button',{name:'This weekend',exact:true})).toHaveAttribute('aria-pressed','true');
    await page.getByRole('button',{name:'Clear filters',exact:true}).click();
    await expect(page.locator('[aria-label="Event date filters"]').getByRole('button',{name:'Next 14 days',exact:true})).toHaveAttribute('aria-pressed','true');
    await page.getByRole('link',{name:'Who handles my issue',exact:true}).click();
    await expect(page.locator('#campbell-tab-links')).toHaveAttribute('aria-selected','true');
    await page.getByRole('link',{name:'Upcoming events',exact:true}).click();
    await expect(page.locator('#campbell-tab-events')).toHaveAttribute('aria-selected','true');
    await context.close();
  }
} finally { await browser.close(); }
if(results.some(r=>r.overflow||r.brokenImages.length||r.errors.length||!r.credit||r.smallButtons.length)) process.exitCode=1;
