import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return n(new URL('./env.ts',import.meta.url).href,c);if(s.startsWith('@/'))return n(new URL('../'+s.slice(2)+'.ts',import.meta.url).href,c);try{return n(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return n(s+'.ts',c);throw e;}}});
const {departments,buildBrief,itemSchema}=await import('../lib/company.ts');
const {db,state,ensureSeed}=await import('../lib/store.ts');
const {jobInput,enqueue}=await import('../lib/ai-jobs.ts');
await test('five-department team retains old evidence and routes new commands',async t=>{
 await ensureSeed();
 await t.test('legacy records and histories are grouped without mutating IDs, versions, results or saved source',async()=>{
  const payload={id:'legacy-leasing-output',kind:'tasks',title:'หลักฐานเดิม',department:'leasing',status:'review',description:'โจทย์เดิม',result:'URL และหลักฐานต้นฉบับ',source:'อาร์ม',handoff:{from:'tenant',requestedAt:'2026-10-21T00:00:00Z'}};
  await db().prepare('INSERT INTO records (kind,id,payload,version,created_at,updated_at) VALUES (?,?,?,7,?,?)').bind('tasks',payload.id,JSON.stringify(payload),'2026-10-21','2026-10-22').run();
  await db().prepare('INSERT INTO ai_runs (id,department,prompt,status,result,actor,created_at) VALUES (?,?,?,?,?,?,?)').bind('legacy-run','research','เดิม','complete',JSON.stringify({summary:'สรุปเดิม',deliverable:'ผลงานเดิม',facts:[],missing:[],tasks:[{title:'ช่าง',department:'operations'}]}),'owner','2026-10-22').run();
  const loaded=await state();const i=loaded.items.find(i=>i.id===payload.id)!;
  assert.equal(i.department,'marketing');assert.equal(i.handoff?.from,'marketing');assert.equal(i.version,7);assert.equal(i.result,payload.result);assert.equal(i.source,'อาร์ม');
  assert(itemSchema.safeParse((({version,updatedAt,...r})=>r)(i)).success);
  const raw=await db().prepare('SELECT payload FROM records WHERE id=?').bind(payload.id).first<{payload:string}>();assert.equal(raw!.payload,JSON.stringify(payload));
  const run=loaded.runs.find(r=>r.id==='legacy-run')!;assert.equal(run.department,'development');assert.equal(run.result!.deliverable,'ผลงานเดิม');assert.equal(run.result!.tasks[0].department,'development');
 });
 await t.test('secretary can receive work and sees evidence from all departments',async()=>{
  const input=jobInput.parse({id:crypto.randomUUID(),department:'secretary',prompt:'สรุปเป็นตาราง'});const saved=await enqueue(input,'owner');const loaded=await state();assert.equal(loaded.items.find(i=>i.id===saved.taskId)!.department,'secretary');
  const brief=buildBrief('secretary','สรุป',loaded.items);assert.match(brief,/URL และหลักฐานต้นฉบับ/);assert.match(brief,/หนึ่งรายต่อแถว/);assert.match(brief,/การตลาด → พัฒนาพื้นที่/);assert.equal(departments.length,5);
 });
 await t.test('merged same-team requests are rejected before queueing; aliases still accepted',()=>{
  assert.equal(jobInput.safeParse({id:crypto.randomUUID(),department:'leasing',requestedBy:'tenant',prompt:'test'}).success,false);
  const legacy=jobInput.parse({id:crypto.randomUUID(),department:'operations',requestedBy:'leasing',prompt:'test'});assert.equal(legacy.department,'development');assert.equal(legacy.requestedBy,'marketing');
 });
});
