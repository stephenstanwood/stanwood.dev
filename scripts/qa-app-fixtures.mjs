/** Synthetic UI fixtures only. No private records and no live mutation calls. */
import { readFile, writeFile, unlink } from 'node:fs/promises';
export const qaPeople = Array.from({length:6},(_,i)=>({
 stableId:`qa-person-${i}`,kind:i===4?'follow':i===5?'organization':'connect',name:`Example ${i===5?'Studio':'Person'} ${i+1}`,organization:'Example organization',title:'Designer',category:'design',categoryLabel:'Design',reason:'A synthetic record for checking the queue interface.',noteDraft:'Hello! I enjoyed your recent work.',noteNeedsEdit:false,linkedinUrl:'https://www.linkedin.com/',profileUrlFound:true,email:null,source:'directed',sourceOrder:i+1,batch:1,tier:'A',flags:[],actioned:false,actionedAt:null,dismissed:false,dismissedAt:null,updatedAt:'2026-10-09T12:00:00Z',
}));
export const qaBatch = {date:'2026-10-09',stableIds:qaPeople.map(p=>p.stableId),targetSize:50,weekendBreak:false};
const home = (i) => ({id:`qa-home-${i}`,address:`${100+i} Example Lane`,city:'Los Gatos',zip:'95030',price:2_500_000+i*200_000,beds:4,baths:3,sqft:2400,lotSqft:8000,yearBuilt:1980,status:'active',photos:['/images/campbell/ainsley-house.webp','/images/campbell/campbell-park.webp'],office:'Example brokerage',agent:'Example agent',url:'https://example.com/listing',lat:37.229,lng:-121.974,listedAt:'2026-10-01',daysOnMarket:8,yard:'A sunny backyard',features:['Backyard','Guest room'],walkableClaim:false,townMiles:.7,score:85,checkedAt:new Date().toISOString(),firstSeen:'2026-10-01',sources:[{name:'Example listing',url:'https://example.com/listing'}],schools:{high:'Los Gatos High',elementary:'Van Meter',middle:'Fisher',highSource:'https://www.lgsuhsd.org/',elementarySource:'https://www.lgusd.org/',verifiedAt:new Date().toISOString(),boundaryHash:'qa'},openHouses:[]});
export const qaHomes={profile:'stephen',homes:[home(1),home(2),home(3)],choices:[],matches:[],feed:{generatedAt:new Date().toISOString(),complete:true,sources:[{name:'Example source',url:'https://example.com/',status:'ok'}],counts:{districtListings:3,schoolExcluded:0,preferenceExcluded:0,qualified:3}}};
export async function installFixturePages(){
 const li=await readFile('src/pages/li.astro','utf8');
 const front=`---\nimport BaseLayout from '../layouts/BaseLayout.astro';\nimport LinkedInTracker from '../components/linkedin/LinkedInTracker';\nexport const prerender=false;\nconst people=${JSON.stringify(qaPeople)};\nconst dailyBatch=${JSON.stringify(qaBatch)};\n---\n`;
 let body=li.slice(li.indexOf('<BaseLayout'));
 body=body.slice(0,body.indexOf('  {loadError ? ('))+'  <LinkedInTracker initialPeople={people} initialDailyBatch={dailyBatch} client:load />\n</BaseLayout>\n';
 await writeFile('src/pages/qa-app-li.astro',front+body);
 await writeFile('src/pages/qa-app-lg.astro',`---\nimport ScatosLayout from '../layouts/ScatosLayout.astro';\nimport ScatosSwip from '../components/scatos/ScatosSwip';\nexport const prerender=false;\n---\n<ScatosLayout><ScatosSwip client:only="react" /></ScatosLayout>`);
 return async()=>Promise.all(['src/pages/qa-app-li.astro','src/pages/qa-app-lg.astro'].map(p=>unlink(p).catch(()=>{})));
}
export async function mockPrivateState(context){
 let state=structuredClone(qaHomes);
 await context.route('**/api/lg/state',async route=>{
  if(route.request().method()==='POST'){
   const body=route.request().postDataJSON();state.choices=state.choices.filter(c=>c.id!==body.id);
   if(body.decision)state.choices.push({id:body.id,decision:body.decision,note:body.note||'',updatedAt:new Date().toISOString()});
  }
  await route.fulfill({json:state});
 });
 await context.route('**/api/li/**',route=>route.fulfill({json:{ok:true}}));
}
