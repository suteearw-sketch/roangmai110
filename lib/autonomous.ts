import {officeClock} from './office-time';
import {allItems,db,ensureSeed,saveItem} from './store';
import {itemSchema,department,aiResultSchema,type Item} from './company';
import {bangkokDay,planWork,stableUuid,autonomyPolicy,workstreams,type Stream} from './autonomous-policy';

export async function dispatchManagerTasks(parent:Item,proposals:unknown,user:string){
 if(!officeClock().open)return [];
 if(parent.department!=='director'||!['review','done'].includes(parent.status)||!parent.result.trim())return [];
 const parsed=aiResultSchema.shape.tasks.safeParse(proposals);if(!parsed.success)return [];
 const created:string[]=[];
 for(const [n,p] of parsed.data.slice(0,4).entries()){
  if(p.execution!=='ai'||p.department==='director')continue;
  const selected=p.description.match(/^\[stream:(leasing|events|growth|finance)\]/)?.[1] as Stream|undefined;
  const stream=selected&&workstreams[selected].stages[0].department===p.department?selected:undefined;
  const cycle=parent.category.split(':')[2]||bangkokDay();
  const id='mcp-'+await stableUuid(stream?`rm110:v1:${stream}:${cycle}:0`:`rm110:dispatch:${parent.id}:${n}`),now=new Date().toISOString();
  const prompt=`งานที่ผู้จัดการ AI มอบหมายจาก ${parent.id}\n${p.description}\nผลงานที่ต้องส่ง: ${p.output}\nอ่านผลงานต้นทางและข้อมูลล่าสุดก่อนทำ ห้ามติดต่อภายนอกเอง ส่งข้อสรุปผ่านเลขาให้อาร์มติดต่อ\n${autonomyPolicy}`;
  const item=itemSchema.parse({...(p.department==='secretary'?{reviewSources:[{id:parent.id,version:parent.version}]}:{}),id,kind:'tasks',title:p.title,department:p.department,status:'todo',description:prompt,owner:department(p.department).short,execution:'ai',priority:p.priority,due:bangkokDay(),category:stream?`autonomy:${stream}:${cycle}:0`:'delegation:'+parent.id,source:'ผู้จัดการ AI มอบหมายจากผลงาน '+parent.id,sourceStatus:'proposed',nextAction:'รอ Agent รับทำจริง ผู้จัดการมอบหมายงานวิจัย ไม่ใช่การอนุมัติกิจกรรมภายนอก'});
  // Same task scope elsewhere must not be assigned a second time.
  const previous=(await allItems()).find(i=>i.kind==='tasks'&&i.id!==id&&i.title===p.title&&i.department===p.department);
  if(previous)continue;
  if(await saveItem(item,0,user))created.push(id);
  await db().prepare("INSERT OR IGNORE INTO ai_jobs (id,task_id,department,prompt,actor,state,attempt,next_attempt_at,created_at,updated_at) SELECT ?,?,?,?,?,'queued',0,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND json_extract(payload,'$.status')='todo') AND (SELECT count(*) FROM ai_jobs WHERE created_at>=?)<30").bind(id.slice(4),id,p.department,prompt,user,now,now,now,id,new Date(Date.now()-86400000).toISOString()).run();
 }
 return created;
}

export async function planAutonomousWork(user:string){
 await ensureSeed();if(!officeClock().open)return {created:[],ready:[],message:'พักงานอัตโนมัติ 00:00–05:00 Asia/Bangkok คิวเดิมยังคงอยู่'};const original=await allItems();
 const history=await db().prepare("SELECT id,result FROM ai_runs WHERE department='director' AND status='complete' ORDER BY created_at DESC LIMIT 30").all<{id:string;result:string}>();
 for(const run of history.results){const parent=original.find(i=>i.kind==='tasks'&&(i.id==='mcp-'+run.id||i.id==='web-ai-'+run.id)&&i.category.startsWith('autonomy:'));if(parent){try{await dispatchManagerTasks(parent,JSON.parse(run.result).tasks,user);}catch{ /* Saved parent remains intact; retry next planning pass. */ }}}
 const plans=await planWork(await allItems()),created:string[]=[];
 for(const p of plans){
  const now=new Date().toISOString();
  const sources=(await allItems()).filter(i=>p.parents.includes(i.id)&&i.department==='director').map(i=>({id:i.id,version:i.version}));
  const item=itemSchema.parse({...(p.department==='secretary'?{reviewSources:sources}:{}),id:p.id,kind:'tasks',title:p.title,description:p.description,department:p.department,status:'todo',owner:department(p.department).short,execution:'ai',priority:p.stream==='leasing'?'high':'medium',due:bangkokDay(),category:`autonomy:${p.stream}:${p.cycle}:${p.stage}`,source:'วงจรทีม AI ตามคำสั่งอาร์ม · เวอร์ชัน 1',sourceStatus:'proposed',nextAction:'รอ Agent รับไปทำจริง งานต้นทางเป็นร่างวิจัย ไม่ใช่การอนุมัติกิจกรรมภายนอก'});
  if(await saveItem(item,0,user))created.push(p.id);
  // Queue the same task for the independent receiver. A ChatGPT run may claim
  // only while there is no active provider request; existing lease rules apply.
  await db().prepare("INSERT OR IGNORE INTO ai_jobs (id,task_id,department,prompt,actor,state,attempt,next_attempt_at,created_at,updated_at) SELECT ?,?,?,?,?,'queued',0,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND json_extract(payload,'$.status')='todo') AND (SELECT count(*) FROM ai_jobs WHERE created_at>=?)<30").bind(p.id.slice(4),p.id,p.department,p.description,user,now,now,now,p.id,new Date(Date.now()-86400000).toISOString()).run();
 }
 const items=await allItems();
 // Backfill a task created through the older MCP tool cache without duplicating jobs.
 for(const item of items.filter(i=>i.kind==='tasks'&&i.status==='todo'&&i.category.startsWith('autonomy:'))){const now=new Date().toISOString();await db().prepare("INSERT OR IGNORE INTO ai_jobs (id,task_id,department,prompt,actor,state,attempt,next_attempt_at,created_at,updated_at) SELECT ?,?,?,?,?,'queued',0,?,?,? WHERE (SELECT count(*) FROM ai_jobs WHERE created_at>=?)<30").bind(item.id.slice(4),item.id,item.department,item.description,user,now,now,now,new Date(Date.now()-86400000).toISOString()).run();}
 return {created,ready:items.filter(i=>i.kind==='tasks'&&i.category.startsWith('autonomy:')&&i.status==='todo').map(i=>({id:i.id,version:i.version,title:i.title,department:i.department,description:i.description})),message:'วางงานที่พร้อมขั้นถัดไปแล้ว ยังไม่อ้างว่าเริ่มประมวลผล AI; review ของงานต้นทางไม่ใช่การอนุมัติภายนอก'};
}
