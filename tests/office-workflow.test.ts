import {registerHooks} from 'node:module';
import {test,mock} from 'node:test';
import assert from 'node:assert/strict';
import {writeFileSync,mkdirSync} from 'node:fs';
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return n(new URL('./env.ts',import.meta.url).href,c);if(s.startsWith('@/'))return n(new URL('../'+s.slice(2)+'.ts',import.meta.url).href,c);try{return n(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts')&&!s.endsWith('.json'))return n(s+'.ts',c);throw e;}}});
const {officeClock}=await import('../lib/office-time.ts');
const {walkingRoutes,dogRoute,furniture}=await import('../lib/office-paths.ts');
const {reportDue}=await import('../lib/report-policy.ts');
const {executiveQueue}=await import('../lib/executive-queue.ts');
const {itemSchema}=await import('../lib/company.ts');
const {env}=await import('./env.ts');
const {db,ensureSeed,saveItem,allItems}=await import('../lib/store.ts');
const {enqueue,jobById,processJob}=await import('../lib/ai-jobs.ts');
const {POST:revise}=await import('../app/api/ai/revise/route.ts');
const {POST:activity}=await import('../app/api/owner/activity/route.ts');
const {GET:reportSettings}=await import('../app/api/reports/route.ts');
const {deliverReport}=await import('../lib/reports.ts');
const {syncExecutiveNotifications}=await import('../lib/executive-notifications.ts');
const req=(path:string,body:unknown)=>new Request('https://hq.test'+path,{method:'POST',headers:{'oai-authenticated-user-id':'owner',origin:'https://hq.test','Content-Type':'application/json'},body:JSON.stringify(body)});
await test('Bangkok boundaries, revisions, review gate and report delivery',async t=>{
 await ensureSeed();
 await t.test('04:59 and 00:00 rest; 05:00 and 23:59 work',()=>{
  for(const [date,open] of [['2026-11-01T21:59:00Z',false],['2026-11-01T22:00:00Z',true],['2026-11-02T16:59:00Z',true],['2026-11-02T17:00:00Z',false]] as const)assert.equal(officeClock(new Date(date)).open,open,date);
 });
 await t.test('all character and dog path segments avoid solid furniture',()=>{
  for(const route of [...Object.values(walkingRoutes),dogRoute])for(let i=1;i<route.length;i++)for(let t=0;t<=1;t+=.02){const x=route[i-1].x+(route[i].x-route[i-1].x)*t,y=route[i-1].y+(route[i].y-route[i-1].y)*t;assert(!furniture.some(r=>x>r.x-12&&x<r.x+r.w+12&&y>r.y-12&&y<r.y+r.h+12),JSON.stringify({x,y}));}
 });
 await t.test('no model call before budget approval or at night; submitted work still completes at midnight',async()=>{
  const command={id:crypto.randomUUID(),department:'marketing' as const,prompt:'งานทดสอบ',attachments:[],references:[]};await enqueue(command,'owner');env.OPENAI_API_KEY='test';env.OPENAI_MODEL='test';let calls=0;const original=globalThis.fetch;
  globalThis.fetch=async()=>{calls++;return Response.json({id:'resp_clock',status:'in_progress'});};
  env.AI_DAILY_CALL_LIMIT='0';await processJob(command.id);assert.equal(calls,0);
  env.AI_DAILY_CALL_LIMIT='100';await db().prepare('UPDATE ai_jobs SET next_attempt_at=? WHERE id=?').bind('2020-01-01',command.id).run();
  mock.timers.setTime(Date.parse('2026-11-02T17:00:00Z'));await processJob(command.id);assert.equal(calls,0);
  mock.timers.setTime(Date.parse('2026-11-02T22:00:00Z'));await processJob(command.id);assert.equal(calls,1);
  mock.timers.setTime(Date.parse('2026-11-03T17:00:00Z'));await processJob(command.id);assert.equal(calls,2); // polls existing ID despite rest period
  globalThis.fetch=original;delete env.OPENAI_API_KEY;delete env.OPENAI_MODEL;mock.timers.setTime(Date.parse('2026-11-02T05:00:00Z'));
 });
 await t.test('revision keeps task identity and old result, cancels old lease, rejects stale writes and deduplicates retry',async()=>{
  const initial={id:crypto.randomUUID(),department:'finance' as const,prompt:'โจทย์เดิม',attachments:[],references:[]};const queued=await enqueue(initial,'owner');const old=(await allItems()).find(i=>i.id===queued.taskId)!;const {version,updatedAt,...plain}=old;await saveItem({...plain,status:'review',result:'ผลงานเดิม'},version,'owner');await db().prepare("UPDATE ai_jobs SET state='running',lease_token='old-lease' WHERE id=?").bind(initial.id).run();const command={id:crypto.randomUUID(),department:'finance',prompt:'แก้สมมติฐาน',attachments:[],references:[]},body={taskId:old.id,expectedVersion:2,command};
  const responses=await Promise.all([revise(req('/api/ai/revise',body)),revise(req('/api/ai/revise',{...body,command:{...command,id:crypto.randomUUID()}}))]);assert.deepEqual(responses.map(r=>r.status).sort(),[201,409]);
  assert.equal((await revise(req('/api/ai/revise',body))).status,200);assert.equal((await revise(req('/api/ai/revise',{...body,command:{...command,prompt:'other'}}))).status,409);
  const revisions=await db().prepare('SELECT payload FROM record_revisions WHERE record_id=?').bind(old.id).all<{payload:string}>();assert(revisions.results.some(r=>JSON.parse(r.payload).result==='ผลงานเดิม'));assert.equal((await jobById(initial.id))!.state,'cancelled');assert.equal((await jobById(initial.id))!.lease_token,null);assert.equal((await allItems()).filter(i=>i.id===old.id).length,1);
 });
 await t.test('stale manager revision and blocked parent cannot pass secretary gate; notifications deduplicate by exact revision',async()=>{
  const manager=itemSchema.parse({id:'mcp-gate-manager',kind:'tasks',department:'director',status:'review',title:'ตรวจงาน',result:'ตรวจหลักฐานแล้ว'});const secretary=itemSchema.parse({id:'mcp-gate-secretary',kind:'tasks',department:'secretary',status:'review',title:'สรุป',result:'ข้อเสนอพร้อมข้อจำกัด',reviewSources:[{id:manager.id,version:1}]});
  await saveItem(manager,0,'owner');await saveItem(secretary,0,'owner');assert.equal(executiveQueue(await allItems()).review.some(i=>i.id===secretary.id),true);await syncExecutiveNotifications();await syncExecutiveNotifications();let n=await db().prepare('SELECT count(*) AS n FROM notifications WHERE record_id=?').bind(secretary.id).first<{n:number}>();assert.equal(n!.n,1);
  await saveItem({...manager,status:'blocked'},1,'owner');assert.equal(executiveQueue(await allItems()).review.some(i=>i.id===secretary.id),false);
  await saveItem(manager,2,'owner');assert.equal(executiveQueue(await allItems()).review.some(i=>i.id===secretary.id),false);
 });
 await t.test('24-hour absence, repeat disabled, activity only through explicit endpoint',async()=>{
  const last='2026-11-01T05:00:00Z',settings={enabled:true,repeatHours:null};assert.equal(reportDue(last,settings,Date.parse(last)+86399999),null);assert.ok(reportDue(last,settings,Date.parse(last)+86400000));assert.equal(reportDue(last,settings,Date.parse(last)+86400000),reportDue(last,settings,Date.parse(last)+86400000*9));assert.equal(reportDue(null,settings),null);
  await reportSettings(new Request('https://hq.test/api/reports',{headers:{'oai-authenticated-user-id':'owner'}}));assert.equal(await db().prepare("SELECT value FROM metadata WHERE key='owner-last-seen'").first(),null);assert.equal((await activity(req('/api/owner/activity',{}))).status,200);
 });
 await t.test('PDF has Thai font; simulated email retries reuse idempotency key and send once with browser absent',async()=>{
  const objects=new Map<string,Uint8Array>();env.BUCKET={put:async(k:string,v:Uint8Array)=>objects.set(k,v)};env.REPORT_EMAIL_API_KEY='test-only';env.REPORT_EMAIL_FROM='test@example.com';
  await db().prepare('INSERT OR REPLACE INTO metadata(key,value) VALUES (?,?)').bind('report-settings',JSON.stringify({enabled:true,repeatHours:null})).run();await db().prepare('UPDATE metadata SET value=? WHERE key=?').bind(new Date(Date.now()-86400001).toISOString(),'owner-last-seen').run();
  let calls=0;const keys:string[]=[];const original=globalThis.fetch;globalThis.fetch=async(url,init)=>{assert.equal(String(url),'https://api.resend.com/emails');calls++;keys.push((init!.headers as Record<string,string>)['Idempotency-Key']);const body=JSON.parse(init!.body as string);assert.deepEqual(body.to,['sutee.arw@gmail.com']);return calls===1?Response.json({},{status:503}):Response.json({id:'simulated-delivery'});};
  assert.equal((await deliverReport()).sent,false);await db().prepare("UPDATE report_deliveries SET next_attempt_at='2020-01-01'").run();assert.equal((await deliverReport()).sent,true);assert.equal((await deliverReport()).sent,false);assert.equal(calls,2);assert.equal(keys[0],keys[1]);const pdf=[...objects.values()][0];assert.equal(new TextDecoder().decode(pdf.slice(0,5)),'%PDF-');mkdirSync('outputs',{recursive:true});writeFileSync('outputs/report-test.pdf',pdf);
  globalThis.fetch=original;delete env.REPORT_EMAIL_API_KEY;delete env.REPORT_EMAIL_FROM;
 });
});
