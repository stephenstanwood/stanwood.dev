import{chromium}from'@playwright/test';
import AxeBuilder from '@axe-core/playwright';
import{mkdir,writeFile}from'node:fs/promises';
import{createHash}from'node:crypto';
import{loadEnv}from'vite';
import{installFixturePages,mockPrivateState}from'./qa-app-fixtures.mjs';
const origin=process.env.QA_ORIGIN||'http://127.0.0.1:4325';
const args=process.argv.slice(2);const pick=(key,defaultValue)=>args.includes(key)?args[args.indexOf(key)+1]:defaultValue;
const routes=pick('--routes','/,swim,tldr,nearest-coffee,green-light,museum-label,redesign-rolodex,which-model,radar,ship-clock,wtwtw,mlb-gamerank,driverless,campbell,pixel-tide,pixel-aquarium,show-swipe,shop,tv,familyroom,money,qa-app-li,qa-app-lg,li-login,money-login,lg/login').split(',');
const output=pick('--output','docs/nicer/apps/evidence/accessibility');await mkdir(output,{recursive:true});
const cleanup=await installFixturePages();const b=await chromium.launch({headless:true});const c=await b.newContext({viewport:{width:375,height:900},reducedMotion:'reduce'});await c.route('**/*',r=>r.request().method()==='POST'?r.fulfill({status:503,json:{error:'Test service unavailable'}}):r.continue());await mockPrivateState(c);
const env=loadEnv('development',process.cwd(),'');if(env.MONEY_PASSWORD)await c.addCookies([{name:'money_session',value:createHash('sha256').update(env.MONEY_PASSWORD).digest('hex'),url:origin}]);
const results=[];
try{for(const route of routes){const p=await c.newPage();const path=route==='/'?'/':`/${route}`;try{
 await p.goto(origin+path,{waitUntil:'domcontentloaded'});
 for(let attempt=0;attempt<3;attempt++){try{await p.waitForFunction(()=>!document.querySelector('astro-island[ssr][client="load"],astro-island[ssr][client="only"]'),{},{timeout:8000});break;}catch(e){if(attempt===2)throw e;await p.reload();}}
 await p.addStyleTag({content:'astro-dev-toolbar{display:none!important}'});await p.waitForTimeout(400);
 const result=await new AxeBuilder({page:p}).withTags(['wcag2a','wcag2aa','wcag21a','wcag21aa','wcag22aa']).exclude('astro-dev-toolbar').analyze();
 const violations=result.violations.map(v=>({id:v.id,impact:v.impact,description:v.description,nodes:v.nodes.map(n=>({target:n.target,html:n.html,summary:n.failureSummary}))}));results.push({route:path,violations});console.log(`${path}: ${violations.map(v=>v.id+':'+v.nodes.length).join(', ')||'PASS'}`);
 }catch(e){results.push({route:path,error:e.message});console.log(`${path}: FAILED ${e.message.split('\n')[0]}`);}finally{await p.close();}await writeFile(`${output}/results.json`,JSON.stringify(results,null,2));}}
finally{await b.close();await cleanup();}
if(results.some(r=>r.error||r.violations.length))process.exitCode=1;
