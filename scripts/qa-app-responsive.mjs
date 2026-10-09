/** Bounded extreme-width and 200% layout/text zoom checks. No production writes. */
import { chromium } from '@playwright/test';
import { mkdir, writeFile } from 'node:fs/promises';
import { createHash } from 'node:crypto';
import { loadEnv } from 'vite';
import { installFixturePages, mockPrivateState } from './qa-app-fixtures.mjs';
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4325';
const args=process.argv.slice(2);
const option=(key,fallback)=>args.includes(key)?args[args.indexOf(key)+1]:fallback;
const output=option('--output','docs/nicer/apps/evidence/senior-responsive');
const routes=option('--routes','/,swim,tldr,green-light,museum-label,redesign-rolodex,which-model,ship-clock,campbell,pixel-aquarium,tv,familyroom,money,li-login,money-login,lg/login,qa-app-li,qa-app-lg').split(',');
const variants=[{width:320,zoom:1},{width:1024,zoom:1},{width:1920,zoom:1},{width:1440,zoom:2}];
await mkdir(output,{recursive:true});
const cleanup=await installFixturePages();
const env=loadEnv('development',process.cwd(),'');
const browser=await chromium.launch({headless:true});
const results=[];
try {
 for (const variant of variants) {
  const context=await browser.newContext({viewport:{width:variant.width,height:900},reducedMotion:'reduce'});
  await context.route('**/*',r=>r.request().method()==='POST'?r.fulfill({status:503,json:{error:'Test only'}}):r.continue());
  await mockPrivateState(context);
  if(env.MONEY_PASSWORD) await context.addCookies([{name:'money_session',value:createHash('sha256').update(env.MONEY_PASSWORD).digest('hex'),url:origin}]);
  for (const route of routes) {
   const page=await context.newPage();
   const errors=[];page.on('pageerror',e=>errors.push(e.message));
   try {
    const response=await page.goto(origin+(route==='/'?'/':`/${route}`),{waitUntil:'domcontentloaded'});
    for(let attempt=0;attempt<3;attempt++) {
     try {await page.waitForFunction(()=>!document.querySelector('astro-island[ssr][client="load"],astro-island[ssr][client="only"]'),{},{timeout:8000});break;}
     catch(e){if(attempt===2)throw e;await page.reload({waitUntil:'domcontentloaded'});}
    }
    await page.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});
    await page.evaluate(async zoom=>{await document.fonts.ready;document.documentElement.style.zoom=String(zoom);},variant.zoom);
    await page.waitForTimeout(300);
    const metrics=await page.evaluate(()=>({
      overflow:document.documentElement.scrollWidth>innerWidth,
      scrollWidth:document.documentElement.scrollWidth,
      height:document.documentElement.scrollHeight,
      noindex:document.querySelector('meta[name=robots]')?.content,
      bodyText:document.body.innerText.length,
    }));
    results.push({route,...variant,status:response.status(),...metrics,errors});
    if(metrics.overflow||errors.length) await page.screenshot({path:`${output}/${route.replaceAll('/','-')||'home'}-${variant.width}-${variant.zoom}x-failure.png`,fullPage:true});
    console.log(`${route} ${variant.width} ${variant.zoom}x: ${metrics.overflow?'OVERFLOW':'PASS'}${errors.length?' ERRORS':''}`);
   }catch(e){results.push({route,...variant,error:e.message,errors});console.log('FAIL',route,e.message.split('\n')[0]);}
   finally{await page.close();}
   await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));
  }
  await context.close();
 }
}finally{await browser.close();await cleanup();}
if(results.some(r=>'error' in r||r.overflow||r.errors.length||r.status>=400))process.exitCode=1;
