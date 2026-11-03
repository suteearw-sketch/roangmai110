import { registerHooks } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(specifier,context,next){if(specifier==='cloudflare:workers')return next(new URL('./env.ts',import.meta.url).href,context);if(specifier.startsWith('@/'))return next(new URL('../'+specifier.slice(2)+'.ts',import.meta.url).href,context);try{return next(specifier,context);}catch(error){if(specifier.startsWith('.')&&!specifier.endsWith('.ts'))return next(specifier+'.ts',context);throw error;}}});
const {POST:queue}=await import('../app/api/ai/queue/route.ts');
const {POST:worker}=await import('../app/api/ai/worker/route.ts');
const {GET:jobs,POST:retry}=await import('../app/api/ai/jobs/route.ts');
const {POST:accept}=await import('../app/api/ai/accept/route.ts');
const {POST:mcp}=await import('../app/mcp/route.ts');
const {db,ensureSeed,allItems,state,saveItem}=await import('../lib/store.ts');
const {processJob,jobById,runtimeStatus}=await import('../lib/ai-jobs.ts');
const {env}=await import('./env.ts');
const secret='unit-test-worker-secret-not-a-real-secret';
const result={summary:'ผลงานใหม่จากโจทย์อาร์ม',deliverable:'ร่างข้อเสนอ G3/6–10 รวม 5 ห้อง โปร 1 ปี 30,000 บาท/เดือน',facts:['อาร์มยืนยันราคา'],missing:['ยังไม่มีภาพห้องปัจจุบัน'],tasks:[{title:'ตรวจภาพห้อง',department:'operations',description:'ตรวจภาพก่อนเสนอ',output:'ภาพพร้อมรหัสห้อง',execution:'human',priority:'high'}],approvals:[{action:'contact',title:'ตรวจร่างก่อนติดต่อผู้ประกอบการ',details:'ยังไม่ส่งข้อความ รออาร์มอนุมัติและผู้ลงมือจริง'}]};
const req=(path:string,body?:unknown)=>new Request('https://hq.test'+path,{method:body?'POST':'GET',headers:{'oai-authenticated-user-id':'owner','Content-Type':'application/json',origin:'https://hq.test'},body:body?JSON.stringify(body):undefined});
const input=(department='leasing')=>({id:crypto.randomUUID(),department,prompt:'จัดทำข้อเสนอและร่างติดต่อจากข้อมูลที่ยืนยันแล้ว'});
const due=async(id:string)=>db().prepare('UPDATE ai_jobs SET next_attempt_at=? WHERE id=?').bind('2020-01-01T00:00:00.000Z',id).run();
const completed=(id:string)=>Response.json({id,status:'completed',output:[{content:[{type:'output_text',text:JSON.stringify(result)}]}]});
const currentTask=async(id:string)=>(await allItems()).find(i=>i.id==='web-ai-'+id)!;
async function heartbeat(){await db().prepare('INSERT INTO metadata(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('ai-worker-heartbeat',new Date().toISOString()).run();}
const realFetch=globalThis.fetch;
await test('durable AI receiver across website requests and independent worker calls',async t=>{
 await ensureSeed();
 await t.test('missing configuration stores durable commands for every department without fake processing',async()=>{
   for(const dept of ['director','leasing','marketing','tenant','research','development','finance','operations']){const body=input(dept);const response=await queue(req('/api/ai/queue',body));assert.equal(response.status,201);assert.equal((await currentTask(body.id)).status,'todo');assert.equal((await jobById(body.id))!.attempt,0);}
   assert.equal((await runtimeStatus()).ready,false);
   // Isolate later worker tests from these deliberately unconfigured commands.
   await db().prepare("UPDATE ai_jobs SET state='cancelled'").run();
 });
 await t.test('worker endpoint rejects unauthenticated, visitor-only and wrong secret calls',async()=>{
   env.AI_WORKER_SECRET=secret;
   assert.equal((await worker(req('/api/ai/worker',{}))).status,403);
   assert.equal((await worker(new Request('https://hq.test/api/ai/worker',{method:'POST',headers:{Authorization:'Bearer wrong'}}))).status,403);
   const response=await worker(new Request('https://hq.test/api/ai/worker',{method:'POST',headers:{Authorization:'Bearer '+secret}}));
   assert.equal(response.status,200);assert.equal((await response.json() as any).ready,false);
   env.OPENAI_API_KEY='unit-test-placeholder';env.OPENAI_MODEL='unit-test-model';await heartbeat();
 });
 await t.test('queued is not doing; actual start is recorded; completion persists task, history, approval atomically',async()=>{
   const body=input();let creates=0,reads=0;let stage='queued';
   globalThis.fetch=async(url,options)=>{
     assert.match(String(url),/^https:\/\/api\.openai\.com\/v1\/responses/);
     if(options?.method==='POST'){creates++;const sent=JSON.parse(options.body as string);assert.equal(sent.background,true);assert.equal(sent.store,false);assert.equal(sent.tools,undefined);assert.match(sent.input,/30,000/);return Response.json({id:'resp_main',status:'queued'});}
     reads++;return stage==='completed'?completed('resp_main'):Response.json({id:'resp_main',status:stage});
   };
   assert.equal((await queue(req('/api/ai/queue',body))).status,201);
   assert.equal((await currentTask(body.id)).status,'todo');assert.equal((await jobById(body.id))!.state,'submitted');
   const duplicate=await queue(req('/api/ai/queue',body));assert.equal(duplicate.status,200);assert.equal(creates,1);
   assert.equal((await queue(req('/api/ai/queue',{...body,prompt:'different'}))).status,409);
   stage='in_progress';await due(body.id);await processJob(body.id);
   assert.equal((await currentTask(body.id)).status,'doing');assert.ok((await jobById(body.id))!.started_at);
   const active=await currentTask(body.id);
   const duplicateWorker=await mcp(req('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'submit_work_for_review',arguments:{id:active.id,expected_version:active.version,deliverable:'draft from another worker',next_action:'review'}}}));
   assert.equal((await duplicateWorker.json() as any).result.isError,true);assert.equal((await currentTask(body.id)).result,'');
   stage='completed';await due(body.id);await processJob(body.id);
   const task=await currentTask(body.id);assert.equal(task.status,'review');assert.match(task.result,/30,000/);assert.match(task.result,/ข้อมูลที่ขาด/);assert.equal(task.result.includes('36,000'),false);
   const history=(await state()).runs.find(r=>r.id===body.id);assert.equal(history!.result!.deliverable,result.deliverable);
   const approval=(await allItems()).find(i=>i.id==='approval-'+body.id+'-0');assert.equal(approval!.status,'pending');
   await processJob(body.id);assert.equal(creates,1);assert.equal(reads,2);
   assert.equal((await accept(req('/api/ai/accept',{id:body.id}))).status,200);
   assert.equal((await accept(req('/api/ai/accept',{id:body.id}))).status,200);
   assert.equal((await allItems()).filter(i=>i.id==='ai-'+body.id+'-0').length,1);
   assert.equal(JSON.stringify(await state()).includes('unit-test-placeholder'),false);
 });
 await t.test('lease prevents two workers from submitting the same command',async()=>{
   delete env.OPENAI_API_KEY;const body=input('marketing');await queue(req('/api/ai/queue',body));env.OPENAI_API_KEY='unit-test-placeholder';
   let calls=0;globalThis.fetch=async()=>{calls++;return completed('resp_concurrent');};
   await Promise.all([processJob(body.id),processJob(body.id)]);
   assert.equal(calls,1);assert.equal((await currentTask(body.id)).status,'review');
 });
 await t.test('temporary provider failures back off and stop after three attempts',async()=>{
   let calls=0;globalThis.fetch=async()=>{calls++;return Response.json({error:{code:'rate_limit_exceeded'}},{status:429});};
   const body=input('research');await queue(req('/api/ai/queue',body));
   assert.equal((await jobById(body.id))!.state,'retry_wait');assert.equal((await currentTask(body.id)).status,'todo');
   await processJob(body.id);assert.equal(calls,1); // not before the stored retry time
   await due(body.id);await processJob(body.id);await due(body.id);await processJob(body.id);
   assert.equal(calls,3);assert.equal((await jobById(body.id))!.state,'blocked');assert.equal((await currentTask(body.id)).status,'blocked');assert.equal((await currentTask(body.id)).result,'');
   assert.equal((await retry(req('/api/ai/jobs',{id:body.id}))).status,200);await db().prepare("UPDATE ai_jobs SET state='cancelled' WHERE id=?").bind(body.id).run();
 });
 await t.test('ambiguous network submission never causes an automatic duplicate or fake output',async()=>{
   let calls=0;globalThis.fetch=async()=>{calls++;throw new TypeError('secret stack must not reach UI');};
   const body=input('finance');await queue(req('/api/ai/queue',body));await due(body.id);await processJob(body.id);
   assert.equal(calls,1);const job=(await jobById(body.id))!;assert.equal(job.error_code,'submission_unknown');assert.equal(job.state,'blocked');assert.equal((await currentTask(body.id)).status,'blocked');assert.equal(job.error_message!.includes('secret stack'),false);
   assert.equal((await retry(req('/api/ai/jobs',{id:body.id}))).status,409);
 });
 await t.test('a restarted worker retrieves the same provider ID; read failures do not resubmit',async()=>{
   const body=input('development');let creates=0,reads=0;
   globalThis.fetch=async(_url,options)=>{if(options?.method==='POST'){creates++;return Response.json({id:'resp_restart',status:'in_progress'});}reads++;if(reads===1)throw new Error('disconnected');return completed('resp_restart');};
   await queue(req('/api/ai/queue',body));await due(body.id);await processJob(body.id);assert.equal((await jobById(body.id))!.state,'retry_wait');
   await due(body.id);await processJob(body.id);assert.equal((await currentTask(body.id)).status,'review');assert.equal(creates,1);assert.equal(reads,2);
 });
 await t.test('incomplete output is blocked and cannot become review',async()=>{
   globalThis.fetch=async()=>Response.json({id:'resp_incomplete',status:'incomplete',output:[]});const body=input('operations');await queue(req('/api/ai/queue',body));
   assert.equal((await jobById(body.id))!.error_code,'incomplete_output');assert.equal((await currentTask(body.id)).status,'blocked');assert.equal((await state()).runs.some(r=>r.id===body.id),false);
 });
 await t.test('crash during uncertain submission is not silently replayed after the lease expires',async()=>{
   delete env.OPENAI_API_KEY;const body=input('operations');await queue(req('/api/ai/queue',body));env.OPENAI_API_KEY='unit-test-placeholder';
   await db().prepare("UPDATE ai_jobs SET provider_state='creating',attempt=1,lease_token='crashed',lease_until=? WHERE id=?").bind('2020-01-01T00:00:00.000Z',body.id).run();
   let calls=0;globalThis.fetch=async()=>{calls++;return completed('resp_should_not_exist');};await processJob(body.id);
   assert.equal(calls,0);assert.equal((await jobById(body.id))!.error_code,'submission_unknown');assert.equal((await currentTask(body.id)).status,'blocked');
 });
 await t.test('does not overwrite a changed brief, retaining the completed result for inspection',async()=>{
   const body=input('tenant');globalThis.fetch=async()=>Response.json({id:'resp_edit',status:'in_progress'});await queue(req('/api/ai/queue',body));
   globalThis.fetch=async()=>{const old=await currentTask(body.id);const {version,updatedAt,...plain}=old;await saveItem({...plain,description:'โจทย์ใหม่ของอาร์ม'},version,'owner');return completed('resp_edit');};
   await due(body.id);await processJob(body.id);assert.equal((await currentTask(body.id)).description,'โจทย์ใหม่ของอาร์ม');assert.equal((await jobById(body.id))!.error_code,'task_changed');
   const response=await jobs(req('/api/ai/jobs?id='+body.id));assert.equal((await response.json() as any).savedResult.deliverable,result.deliverable);assert.equal((await retry(req('/api/ai/jobs',{id:body.id}))).status,409);
 });
 await t.test('expired heartbeat is not advertised as continuous processing',async()=>{
   await db().prepare('UPDATE metadata SET value=? WHERE key=?').bind('2020-01-01T00:00:00.000Z','ai-worker-heartbeat').run();assert.equal((await runtimeStatus()).ready,false);
 });
 await t.test('30-command cap is durable and a rejected command creates no orphan task',async()=>{
   delete env.OPENAI_API_KEY;
   const count=await db().prepare('SELECT count(*) AS n FROM ai_jobs').first<{n:number}>();
   for(let i=count!.n;i<30;i++)assert.equal((await queue(req('/api/ai/queue',input()))).status,201);
   const body=input(),response=await queue(req('/api/ai/queue',body));assert.equal(response.status,429);assert.equal(await currentTask(body.id),undefined);assert.equal(await jobById(body.id),null);
 });
 globalThis.fetch=realFetch;delete env.OPENAI_API_KEY;delete env.OPENAI_MODEL;delete env.AI_WORKER_SECRET;
});
