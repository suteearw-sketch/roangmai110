import { registerHooks } from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(specifier,context,next){if(specifier==='cloudflare:workers')return next(new URL('./env.ts',import.meta.url).href,context);if(specifier.startsWith('@/'))return next(new URL('../'+specifier.slice(2)+'.ts',import.meta.url).href,context);try{return next(specifier,context);}catch(error){if(specifier.startsWith('.')&&!specifier.endsWith('.ts'))return next(specifier+'.ts',context);throw error;}}});
const {POST}=await import('../app/mcp/route.ts');
async function call(method:string,params?:unknown,auth=true){const response=await POST(new Request('https://hq.test/mcp',{method:'POST',headers:{'Content-Type':'application/json',...(auth?{'oai-authenticated-user-id':'owner-test'}:{})},body:JSON.stringify({jsonrpc:'2.0',id:1,method,params})}));return {status:response.status,data:await response.json() as any};}
async function tool(name:string,args:unknown){const r=await call('tools/call',{name,arguments:args});return {...r,result:r.data.result,value:r.data.result?.content?.[0]?.text?JSON.parse(r.data.result.content[0].text):null};}
await test('โรงไม้110 ChatGPT tools',async t=>{
 await t.test('requires authenticated Site caller',async()=>assert.equal((await call('tools/list',{},false)).status,401));
 await t.test('advertises stateless MCP tools and version',async()=>{
  assert.deepEqual((await call('server/discover')).data.result.supportedVersions,['2026-07-28']);
  const list=(await call('tools/list')).data.result.tools;assert.equal(list.length,9);assert(list.find((i:any)=>i.name==='get_project_overview').annotations.readOnlyHint);
 });
 await t.test('returns source labelled data and department responsibilities',async()=>{
  const overview=await tool('get_project_overview',{});assert.equal(overview.result.isError,false);assert.equal(overview.value.company,'โรงไม้110');assert.equal(overview.value.departments.length,5);
  const brief=await tool('get_department_brief',{department:'research'});assert.match(brief.value.brief,/ห้ามแต่ง/);
 });
 const request_id=crypto.randomUUID();
 await t.test('creates proposed internal tasks idempotently',async()=>{
  const args={request_id,title:'จัดทำร่างแบบสำรวจร้านเดิม',department:'tenant',description:'แบบคำถาม 5 ข้อที่นำไปสัมภาษณ์ได้',due:'2026-10-22',execution:'ai',priority:'high'};
  assert.equal((await tool('create_department_task',args)).value.created,true);assert.equal((await tool('create_department_task',args)).value.created,false);
 });
 await t.test('submits actual draft work for human review without certifying fieldwork',async()=>{
  const response=await tool('submit_work_for_review',{id:'mcp-'+request_id,expected_version:1,deliverable:'1. ลูกค้ามาช่วงใด\n2. ปัญหาที่อยากให้โครงการช่วยคืออะไร',next_action:'ให้คนหน้างานเก็บคำตอบจริง'});assert.equal(response.value.status,'review');
  const list=await tool('list_project_records',{kind:'tasks',department:'tenant'});const task=list.value.find((i:any)=>i.id==='mcp-'+request_id);assert.equal(task.status,'review');assert.equal(task.version,2);assert.match(task.result,/ลูกค้า/);
  const stale=await call('tools/call',{name:'submit_work_for_review',arguments:{id:task.id,expected_version:1,deliverable:'stale',next_action:''}});assert.equal(stale.data.result.isError,true);
 });
 await t.test('actual progress is versioned, rejects duplicate agents and expires on the office dashboard',async()=>{
  const id=crypto.randomUUID(),run=crypto.randomUUID();
  await tool('create_department_task',{request_id:id,title:'Progress test',department:'finance',description:'test',due:'',execution:'ai',priority:'high'});
  const args={id:'mcp-'+id,expected_version:1,run_id:run,status:'doing',message:'กำลังตรวจหลักฐาน'};
  const start=await tool('report_task_progress',args);assert.equal(start.result.isError,false);assert.equal(start.value.task.status,'doing');assert.equal(start.value.task.version,2);
  const duplicate=await call('tools/call',{name:'report_task_progress',arguments:{...args,expected_version:2,run_id:crypto.randomUUID()}});assert.equal(duplicate.data.result.isError,true);
  const {agentStatus}=await import('../lib/agent-status.ts');
  let data=(await tool('get_project_overview',{})).value;
  const state={items:data.items,jobs:data.automaticWorkQueue.jobs,runtime:data.automaticWorkQueue.runtime};
  const at=Date.parse(start.value.task.progress.updatedAt);
  assert.equal(agentStatus(state as any,'finance',true,at+1000).active,true);
  assert.equal(agentStatus(state as any,'finance',true,at+600001).label,'ขาดการอัปเดต');
  assert.equal(agentStatus(state as any,'finance',false,at+1000).active,false);
  const heartbeat=await tool('report_task_progress',{...args,expected_version:2,message:'ตรวจรายการถัดไป'});assert.equal(heartbeat.value.task.version,3);
  const review=await tool('submit_work_for_review',{id:args.id,expected_version:3,deliverable:'ผลตรวจ',next_action:'ตรวจผลงาน'});assert.equal(review.value.status,'review');
  const task=(await tool('list_project_records',{kind:'tasks'})).value.find((t:any)=>t.id===args.id);assert.equal(task.progress,undefined);
 });
 await t.test('saves AI deliverables to the department workroom with duplicate protection',async()=>{
  const args={request_id:crypto.randomUUID(),department:'marketing',brief:'ร่างโพสต์ร้านเดิม',summary:'ต้องขอข้อมูลร้านก่อนเผยแพร่',deliverable:'มารู้จักร้านในโรงไม้110 — [ใส่ชื่อร้านที่ยืนยันแล้ว]',facts:['ยังใช้ผังเก่า'],missing:['เวลาเปิดร้านปัจจุบัน'],tasks:[]};
  assert.equal((await tool('save_department_deliverable',args)).value.saved,true);assert.equal((await tool('save_department_deliverable',args)).value.saved,false);
 });
 await t.test('updates the visible property register with provenance and rejects stale overwrites',async()=>{
  const rows=(await tool('list_project_records',{kind:'tenants'})).value;
  const room=rows.find((i:any)=>i.id==='t-G2-4');
  const args={kind:'tenants',id:room.id,expected_version:room.version,changes:{title:'พื้นที่ว่าง G2/4',status:'vacant',amount:10000,rentDetails:'ค่าเช่าเสนอ 10,000 บาท/ห้อง/เดือน',source:'อาร์มยืนยัน 20 ต.ค. 2569',sourceStatus:'confirmed'}};
  const updated=await tool('save_project_record',args);assert.equal(updated.value.saved,true);assert.equal(updated.value.record.amount,10000);assert.equal(updated.value.record.version,room.version+1);assert.equal(updated.value.record.unit,room.unit);
  const latest=(await tool('get_project_overview',{})).value.items.find((i:any)=>i.id===room.id);assert.equal(latest.status,'vacant');assert.equal(latest.sourceStatus,'confirmed');assert.match(latest.rentDetails,/10,000/);
  const stale=await call('tools/call',{name:'save_project_record',arguments:args});assert.equal(stale.data.result.isError,true);
  const invalid=await call('tools/call',{name:'save_project_record',arguments:{...args,expected_version:latest.version,changes:{...args.changes,amount:-1}}});assert.equal(invalid.data.result.isError,true);
 });
 await t.test('creates shared project facts without changing approvals or financial actuals',async()=>{
  const r=await tool('save_project_record',{kind:'knowledge',id:'leasing-goal-test',expected_version:0,changes:{title:'เป้าหมายผู้เช่าใหม่',department:'leasing',status:'confirmed',description:'ต้องการผู้เช่าใหม่ภายในปี 2569',due:'2026-12-31',source:'อาร์มยืนยัน',sourceStatus:'confirmed'}});assert.equal(r.value.saved,true);assert.equal(r.value.record.due,'2026-12-31');
  const denied=await call('tools/call',{name:'save_project_record',arguments:{kind:'approvals',id:'a-budget',expected_version:1,changes:{status:'approved',source:'AI',sourceStatus:'confirmed'}}});assert.equal(denied.data.result.isError,true);
 });
 await t.test('rejects unknown methods and tool names',async()=>{
  assert.equal((await call('spend_money',{})).data.error.code,-32601);
  const bad=await call('tools/call',{name:'approve_budget',arguments:{}});assert.equal(bad.data.result.isError,true);
 });
});
