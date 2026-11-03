import { registerHooks } from 'node:module';
import { test } from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(specifier,context,next){
 if(specifier==='cloudflare:workers')return next(new URL('./env.ts',import.meta.url).href,context);
 if(specifier.startsWith('@/'))return next(new URL('../'+specifier.slice(2)+'.ts',import.meta.url).href,context);
 try{return next(specifier,context);}catch(error){if(specifier.startsWith('.')&&!specifier.endsWith('.ts'))return next(specifier+'.ts',context);throw error;}
}});
const {GET}=await import('../app/api/state/route.ts');
const {POST}=await import('../app/api/records/route.ts');
const {POST:AI}=await import('../app/api/ai/route.ts');
const {POST:queue}=await import('../app/api/ai/queue/route.ts');
const {POST:toolCall}=await import('../app/mcp/route.ts');
const {POST:accept}=await import('../app/api/ai/accept/route.ts');
const {financials,itemSchema,buildBrief}=await import('../lib/company.ts');
const {env}=await import('./env.ts');
function req(path:string,body?:any,auth=true,origin='https://hq.test'){return new Request('https://hq.test'+path,{method:body?'POST':'GET',headers:{...(auth?{'oai-authenticated-user-id':'owner-test'}:{}),...(body?{'Content-Type':'application/json',origin}:{})},body:body?JSON.stringify(body):undefined});}
async function current(){const response=await GET(req('/api/state'));assert.equal(response.status,200);return await response.json() as any;}
async function save(item:any,version:number){return POST(req('/api/records',{action:'save',item,version}));}
function plain(item:any){const {version,updatedAt,...rest}=item;return rest;}
await test('โรงไม้110: persistent workflow and truthful business data',async t=>{
 await t.test('rejects anonymous reads and cross-origin writes',async()=>{
  assert.equal((await GET(req('/api/state',undefined,false))).status,401);
  assert.equal((await POST(req('/api/records',{action:'save'},true,'https://evil.test'))).status,403);
 });
 await t.test('seeds source-labelled historical records without fabricating revenue or completed work',async()=>{
  const data=await current();assert.equal(data.items.filter((i:any)=>i.kind==='tenants').length,31);assert.equal(data.items.filter((i:any)=>i.kind==='tasks').length,10);
  assert.equal(data.items.filter((i:any)=>i.kind==='finance').length,0);assert.equal(data.items.filter((i:any)=>i.kind==='tenants'&&i.status==='active').length,0);
  for(const i of data.items)assert.equal(itemSchema.safeParse(plain(i)).success,true,i.id);
  assert.equal(financials(data.items,'2026-10').count,0);assert.equal(data.ai.configured,false);
  assert.equal(data.items.filter((i:any)=>i.kind==='tasks'&&i.status==='done').length,0);
  assert.match(buildBrief('finance','สรุปเงินรับจริง',data.items),/ห้ามนำค่าเช่าคาดการณ์หรือเป้าหมาย/);
 });
 let item:any;
 await t.test('requires a real date and amount for financial records',async()=>{
  item=itemSchema.parse({id:'test-income',kind:'finance',title:'ค่าเช่าที่รับจริง ทดสอบ',department:'finance',status:'income',date:'2026-10-20',amount:1200});
  assert.equal((await save({...item,date:''},0)).status,400);
  assert.equal((await save({...item,amount:-1},0)).status,400);
  assert.equal((await save({...item,date:'2026-02-31'},0)).status,400);
  assert.equal((await save({...item,unexpected:'unsafe'},0)).status,400);
  assert.equal((await save(item,0)).status,200);
  assert.equal(financials((await current()).items,'2026-10').income,1200);
 });
 await t.test('prevents stale updates and does not re-seed over saved data',async()=>{
  assert.equal((await save({...item,amount:1500},1)).status,200);
  assert.equal((await save({...item,amount:9999},1)).status,409);
  const data=await current();const record=data.items.find((i:any)=>i.id===item.id);assert.equal(record.amount,1500);assert.equal(record.version,2);
  assert.equal(data.activity.filter((a:any)=>a.title===item.title).length,2);
 });
 await t.test('requires deliverables to close work and notes for budget decisions',async()=>{
  const data=await current();const task=data.items.find((i:any)=>i.kind==='tasks');
  assert.equal((await save({...plain(task),status:'done',result:''},task.version)).status,400);
  assert.equal((await save({...plain(task),status:'done',result:'ทะเบียนยืนยันแล้ว อ้างอิงเอกสารทดสอบ'},task.version)).status,200);
  const decision=data.items.find((i:any)=>i.kind==='approvals');
  assert.equal((await save({...plain(decision),status:'approved',result:''},decision.version)).status,400);
  assert.equal((await save({...plain(decision),status:'approved',result:'อนุมัติเฉพาะการขอราคา ยังไม่อนุมัติค่าใช้จ่ายจริง'},decision.version)).status,200);
 });
 await t.test('validates full people counts and knowledge provenance',async()=>{
  const record={id:'traffic-test',kind:'traffic',title:'หน้าทางเข้า เวลา 17:00',department:'research',status:'recorded',amount:1.5,date:'2026-10-20'};
  assert.equal((await save(record,0)).status,400);
  assert.equal((await save({...record,amount:15},0)).status,200);
  const data=await current();const knowledge=data.items.find((i:any)=>i.kind==='knowledge');assert.equal((await save({...plain(knowledge),status:'confirmed',sourceStatus:'historical'},knowledge.version)).status,400);
 });
 await t.test('deletes only the expected record version',async()=>{
  assert.equal((await POST(req('/api/records',{action:'delete',kind:'finance',id:item.id,version:1}))).status,409);
  assert.equal((await POST(req('/api/records',{action:'delete',kind:'finance',id:item.id,version:2}))).status,200);
  assert.equal(financials((await current()).items,'2026-10').count,0);
 });
 await t.test('does not pretend AI is connected when credentials are missing',async()=>{
  const response=await AI(req('/api/ai',{id:crypto.randomUUID(),department:'director',prompt:'ทำแผน'}));assert.equal(response.status,201);const accepted=await response.json() as any;assert.equal(accepted.runtime.providerConfigured,false);assert.equal(accepted.runtime.ready,false);
  assert.equal((await current()).runs.length,8);
 });
 await t.test('queues a real web request without claiming AI has completed it',async()=>{
  const body={id:crypto.randomUUID(),department:'marketing',prompt:'ร่างโพสต์พื้นที่ว่างโดยใช้ข้อมูลที่ยืนยันแล้ว'};
  assert.equal((await queue(req('/api/ai/queue',body,false))).status,403);
  assert.equal((await queue(req('/api/ai/queue',body,true,'https://evil.test'))).status,403);
  const before=(await current()).runs.length;
  const response=await queue(req('/api/ai/queue',body));assert.equal(response.status,201);
  const accepted=await response.json() as any;assert.equal(accepted.mode,'queued');
  const duplicate=await queue(req('/api/ai/queue',body));assert.equal(duplicate.status,200);assert.equal((await duplicate.json() as any).created,false);
  assert.equal((await queue(req('/api/ai/queue',{...body,prompt:'คำสั่งอื่น'}))).status,409);
  assert.equal((await queue(req('/api/ai/queue',{...body,id:crypto.randomUUID(),prompt:'   '}))).status,400);
  const data=await current(),task=data.items.find((i:any)=>i.id===accepted.taskId);
  assert.equal(task.description,body.prompt);assert.equal(task.department,'marketing');
  assert.equal(task.status,'todo');assert.equal(task.execution,'ai');assert.equal(task.result,'');
  assert.equal(data.items.filter((i:any)=>i.id===accepted.taskId).length,1);assert.equal(data.runs.length,before);
  const delivered='ร่างโพสต์: เปิดรับผู้เช่า G2/4–6 ห้องละ 10,000 บาทต่อเดือน';
  const review=await toolCall(req('/mcp',{jsonrpc:'2.0',id:1,method:'tools/call',params:{name:'submit_work_for_review',arguments:{id:task.id,expected_version:task.version,deliverable:delivered,next_action:'อาร์มตรวจร่างก่อนนำไปเผยแพร่'}}}));
  assert.equal((await review.json() as any).result.isError,false);
  const readback=(await current()).items.find((i:any)=>i.id===task.id);
  assert.equal(readback.status,'review');assert.equal(readback.result,delivered);assert.equal(readback.version,task.version+1);
 });
});
