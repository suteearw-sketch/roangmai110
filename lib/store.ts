import { env } from 'cloudflare:workers';
import { initialItems } from './seed';
import { startupWorks } from './startup-work';
import type { Item, AiRun, CompanyState } from './company';
import { itemSchema,normalizeRecord,normalizeDepartment } from './company';

export function db(){if(!env.DB)throw new Error('ฐานข้อมูลยังไม่พร้อม กรุณาลองใหม่');return env.DB;}
export function aiConfig(){return {configured:!!(env.OPENAI_API_KEY && env.OPENAI_MODEL),model:env.OPENAI_MODEL||null};}
export async function ensureSeed(){
 const database=db();const flag=await database.prepare('SELECT value FROM metadata WHERE key = ?').bind('seed-v1').first();if(flag){await applyArmVacancyCorrection();return;}
 const now=new Date().toISOString();const statements=initialItems().map(({version,updatedAt,...item})=>database.prepare('INSERT OR IGNORE INTO records (kind,id,payload,version,created_at,updated_at) VALUES (?,?,?,1,?,?)').bind(item.kind,item.id,JSON.stringify(item),now,now));
 for(const work of startupWorks())statements.push(database.prepare('INSERT OR IGNORE INTO ai_runs (id,department,prompt,status,result,actor,created_at) VALUES (?,?,?,?,?,?,?)').bind(work.id,work.department,work.prompt,'complete',JSON.stringify(work.result),'ChatGPT · ตั้งระบบ',now));
 statements.push(database.prepare('INSERT OR IGNORE INTO metadata (key,value) VALUES (?,?)').bind('seed-v1',now));
 await database.batch(statements);
 await applyArmVacancyCorrection();
}
async function applyArmVacancyCorrection(){
 const database=db();const key='arm-confirmed-vacancies-20261020';if(await database.prepare('SELECT value FROM metadata WHERE key=?').bind(key).first())return;
 const source='อาร์มยืนยันและแก้ไขในบทสนทนา · 20 ต.ค. 2569';
 const updates=[
  ...[4,5,6].map(n=>({id:'t-G2-'+n,title:'พื้นที่ว่าง G2/'+n,unit:'G2/'+n,amount:10000,area:40,rentDetails:'10,000 บาท/เดือน/ห้อง',description:'อาร์มยืนยันพร้อมปล่อยเช่า ต้องการผู้เช่าภายในปี 2569 ขนาดที่ให้คือห้องละ 4×10 เมตร (40 ตร.ม.) ไม่ใช่การยืนยันผลวัดหน้างาน'})),
  {id:'t-G3-610',title:'พื้นที่ว่าง G3/6–10 · 5 ห้อง',unit:'G3/6–10',amount:30000,area:null,rentDetails:'ปกติ 7,000 บาท/ห้อง/เดือน · โปรเมื่อเช่าทั้ง 5 ห้อง 1 ปี เหลือ 6,000 บาท/ห้อง รวม 30,000 บาท/เดือน',description:'ร้านแต่งรถเดิมออกแล้ว อาร์มแก้ช่วงว่างเป็นห้อง 6–10 รวม 5 ห้อง ไม่รวม G3/5 ขนาดรายห้องตามอาร์ม 4×10 เมตร ไม่ยืนยันพื้นที่รวม ต้องตรวจขอบเขตและสภาพก่อนเสนอใช้งานจริง เป้าหมายมีผู้เช่าใหม่ภายในปี 2569'}
 ];
 for(const update of updates){const row=await database.prepare('SELECT payload,version FROM records WHERE kind=? AND id=?').bind('tenants',update.id).first<{payload:string;version:number}>();if(!row||row.version!==1)continue;const record=itemSchema.parse({...JSON.parse(row.payload),...update,status:'vacant',source,sourceStatus:'confirmed',nextAction:'เตรียมข้อมูลขายและคัดผู้เช่าที่เหมาะกับพื้นที่ตามราคาและเงื่อนไขที่อาร์มให้'});await saveItem(record,row.version,'ChatGPT · ข้อมูลอาร์ม');}
 const knowledge=itemSchema.parse({id:'k-confirmed-vacancies-20261020',kind:'knowledge',title:'ข้อมูลพื้นที่ว่างล่าสุดที่อาร์มยืนยัน: G2/4–6 และ G3/6–10',department:'leasing',status:'confirmed',sourceStatus:'confirmed',source,description:'G2/4–6 ว่าง 3 ห้อง ค่าเช่าห้องละ 10,000 บาท/เดือน G3/6–10 ว่าง 5 ห้อง ร้านแต่งรถเดิมออกแล้ว ไม่รวม G3/5 ค่าเช่าปกติ 7,000 บาท/ห้อง/เดือน โปร 6,000 บาท/ห้องเมื่อเช่าทั้งชุด 1 ปี รวม 30,000 บาท/เดือน (ไม่ใช่ 36,000 บาท) อาร์มแจ้งขนาดห้องละ 4×10 เมตร เป้าหมายได้ผู้เช่าใหม่ภายใน 31 ธ.ค. 2569 ข้อมูลนี้ใหม่กว่าผังเดือน ก.ย. 2569'});
 await saveItem(knowledge,0,'ChatGPT · ข้อมูลอาร์ม');await database.prepare('INSERT OR IGNORE INTO metadata (key,value) VALUES (?,?)').bind(key,new Date().toISOString()).run();
}
export async function allItems():Promise<Item[]>{const result=await db().prepare('SELECT payload,version,updated_at FROM records ORDER BY created_at,id LIMIT 5000').all<{payload:string;version:number;updated_at:string}>();return result.results.map(r=>({...normalizeRecord(JSON.parse(r.payload)),version:r.version,updatedAt:r.updated_at}));}
export async function state():Promise<CompanyState>{
 await ensureSeed();const [items,logs,runs]=await Promise.all([allItems(),db().prepare('SELECT id,title,action,created_at AS createdAt FROM audit ORDER BY created_at DESC LIMIT 30').all(),db().prepare('SELECT id,department,prompt,status,result,created_at AS createdAt FROM ai_runs ORDER BY created_at DESC LIMIT 40').all()]);
 const {jobViews,runtimeStatus}=await import('./ai-jobs');
 const preferences=await db().prepare("SELECT key,value FROM metadata WHERE key LIKE 'office-avatar-%'").all<{key:string;value:string}>();
 const officeAvatars=Object.fromEntries(preferences.results.map(p=>[p.key.slice('office-avatar-'.length),p.value]));
 const read=await db().prepare("SELECT key FROM metadata WHERE key LIKE 'document-read:%'").all<{key:string}>();
 return {readDocuments:read.results.map(r=>r.key.slice('document-read:'.length)),items,jobs:await jobViews() as CompanyState['jobs'],runtime:await runtimeStatus(),activity:logs.results as CompanyState['activity'],runs:runs.results.map(r=>({...r,department:normalizeDepartment(r.department as string),result:r.result?{...JSON.parse(r.result as string),tasks:(JSON.parse(r.result as string).tasks??[]).map(normalizeRecord)}:null})) as AiRun[],ai:aiConfig(),officeAvatars,updatedAt:new Date().toISOString()};
}
export function logStmt(action:string,title:string,actor:string){return db().prepare('INSERT INTO audit (id,action,title,actor,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),action,title,actor,new Date().toISOString());}
export async function saveItem(item:Omit<Item,'version'|'updatedAt'>,expectedVersion:number,actor:string){
 const database=db(),now=new Date().toISOString();
 // Preserve read-only legacy history, but every newly saved secretary report
 // needs an explicit snapshot of the manager versions it actually cites.
 if(item.kind==='tasks'&&item.department==='secretary'&&!item.reviewSources){
  const ids=new Set((item.description+'\n'+item.result).match(/(?:mcp-|web-ai-)[a-zA-Z0-9_-]+/g)??[]);
  const sources=(await allItems()).filter(i=>ids.has(i.id)&&i.department==='director'&&i.result&&['review','done'].includes(i.status)).map(i=>({id:i.id,version:i.version}));
  item={...item,reviewSources:sources};
 }
 const mutation=expectedVersion===0?database.prepare('INSERT OR IGNORE INTO records (kind,id,payload,version,created_at,updated_at) VALUES (?,?,?,1,?,?)').bind(item.kind,item.id,JSON.stringify(item),now,now):database.prepare('UPDATE records SET payload=?,version=version+1,updated_at=? WHERE kind=? AND id=? AND version=?').bind(JSON.stringify(item),now,item.kind,item.id,expectedVersion);
 const log=database.prepare('INSERT INTO audit (id,action,title,actor,created_at) SELECT ?,?,?,?,? WHERE changes()>0').bind(crypto.randomUUID(),expectedVersion===0?'create':'update',item.title,actor,now);
 const result=await database.batch([mutation,log]);return !!result[0].meta.changes;
}
