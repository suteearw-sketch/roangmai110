import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return n(new URL('./env.ts',import.meta.url).href,c);if(s.startsWith('@/'))return n(new URL('../'+s.slice(2)+'.ts',import.meta.url).href,c);try{return n(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return n(s+'.ts',c);throw e;}}});
const {planWork,stableUuid,autonomyPolicy,workstreams}=await import('../lib/autonomous-policy.ts');
const {planAutonomousWork,dispatchManagerTasks}=await import('../lib/autonomous.ts');
const {allItems,ensureSeed,db}=await import('../lib/store.ts');
const {itemSchema,buildBrief}=await import('../lib/company.ts');
const {POST}=await import('../app/mcp/route.ts');
const at=new Date('2026-10-23T17:30:00Z');
function record(p:any,status='review',result='ผลวิจัยที่บันทึกจริง'){return {...itemSchema.parse({id:p.id,kind:'tasks',title:p.title,description:p.description,department:p.department,status,result,category:`autonomy:${p.stream}:${p.cycle}:${p.stage}`}),version:2};}
async function root(stream:string,cycle='2026-10-24'){const s=(workstreams as any)[stream].stages[0];return {id:'mcp-'+await stableUuid(`rm110:v1:${stream}:${cycle}:0`),stream,cycle,stage:0,department:s.department,title:s.name,description:s.instruction};}
test('manager chooses work first; planner reuses IDs and uses Bangkok date',async()=>{
 const first=await planWork([],at);assert.equal(first.length,1);assert.equal(first[0].stream,'management');assert.equal(first[0].cycle,'2026-10-24');assert.deepEqual(first,await planWork([],at));
 const p=await root('leasing');
 for(const status of ['todo','doing','blocked'])assert.equal((await planWork([record(p,status,'')],at)).some(x=>x.stream==='leasing'),false);
 assert.equal((await planWork([record(p,'review','')],at)).some(x=>x.stream==='leasing'),false);
 const next=(await planWork([record(p)],at)).find(x=>x.stream==='leasing')!;assert.equal(next.department,'director');assert.deepEqual(next.parents,[p.id]);
 assert((await planWork([record(p,'blocked','')],at)).some(x=>x.stream==='management'));
});
test('selected chain routes specialists through manager to secretary without approving anything',async()=>{
 const items:any[]=[record(await root('leasing'))];const seen=['marketing'];
 for(let stage=1;stage<workstreams.leasing.stages.length;stage++){
  const p=(await planWork(items,at)).find(p=>p.stream==='leasing')!;seen.push(p.department);items.push(record(p));
 }
 assert.deepEqual(seen,['marketing','director','development','finance','director','secretary']);
 assert.equal((await planWork(items,at)).some(p=>p.stream==='leasing'),false);
 assert.equal((await planWork(items,new Date('2026-10-26'))).some(p=>p.stream==='leasing'),false); // manager must choose another batch
 assert(items.every(i=>i.status==='review'));assert.match(autonomyPolicy,/ไม่หาร้าน local/);assert.match(autonomyPolicy,/ไม่เดาฐานรวม/);
});
test('unfinished specialist cycle survives midnight without opening an extra one',async()=>{
 const leased=record(await root('leasing'));
 const planned=await planWork([leased],new Date('2026-10-25T01:00:00Z'));
 assert.equal(planned.filter(x=>x.stream==='leasing').length,1);assert.equal(planned.find(x=>x.stream==='leasing')!.cycle,'2026-10-24');
});
test('explicit parent evidence remains in cross-department briefs beyond 220 newer records',async()=>{
 const parent=record(await root('leasing'));parent.result='PARENT-EVIDENCE';
 const fillers=Array.from({length:240},(_,n)=>({...parent,id:'filler-'+n,department:'finance' as const,updatedAt:'2099-01-01'}));
 const brief=buildBrief('finance','อ่าน '+parent.id,[...fillers,parent]);assert.match(brief,/PARENT-EVIDENCE/);assert(brief.includes(parent.id));
});
test('planner is concurrency-safe, manager dispatches selected AI tasks, completion reconciles queue',async()=>{
 await ensureSeed();const [one,two]=await Promise.all([planAutonomousWork('test'),planAutonomousWork('test')]);assert.equal(one.created.length+two.created.length,1);
 const p=(await allItems()).find(i=>i.category.startsWith('autonomy:management:'))!;
 const response=await POST(new Request('https://hq.test/mcp',{method:'POST',headers:{'Content-Type':'application/json','oai-authenticated-user-id':'owner-test'},body:JSON.stringify({jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'submit_work_for_review',arguments:{id:p.id,expected_version:p.version,deliverable:'เลือกงานหาผู้เช่าที่ไม่ซ้ำ',next_action:'ส่งฝ่ายการตลาด'}}})}));
 assert.equal((await response.json() as any).result.isError,false);
 const queue=await db().prepare('SELECT state FROM ai_jobs WHERE task_id=?').bind(p.id).first<{state:string}>();assert.equal(queue!.state,'review');
 const parent=(await allItems()).find(i=>i.id===p.id)!;
 const proposals=[{department:'marketing',title:'ค้นแบรนด์ชุดใหม่',description:'[stream:leasing] ค้นหลักฐานใหม่',output:'ตารางแบรนด์และช่องทางจริง',priority:'high',execution:'ai'},{department:'finance',title:'โทรเก็บเงิน',description:'ต้องให้คนทำ',output:'ผลจริง',priority:'high',execution:'human'}];
 const created=await dispatchManagerTasks(parent,proposals,'test');assert.equal(created.length,1);assert.equal((await dispatchManagerTasks(parent,proposals,'test')).length,0);
 const child=(await allItems()).find(i=>i.id===created[0])!;assert.match(child.category,/^autonomy:leasing:/);assert.equal(child.status,'todo');assert.equal(child.department,'marketing');
 const next=await planAutonomousWork('test');assert.equal(next.created.length,0);assert(next.ready.some(i=>i.department==='secretary'));
 assert.equal((await allItems()).find(i=>i.id===p.id)!.status,'review');assert.equal((await planAutonomousWork('test')).created.length,0);
});
