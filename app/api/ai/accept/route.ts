import { z } from 'zod';
import { aiResultSchema,itemSchema,addDays,department } from '@/lib/company';
import { db } from '@/lib/store';
import { json,actor,writeAllowed,readBody } from '@/lib/http';
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'ไม่มีสิทธิ์บันทึกคำสั่งนี้'},403);
 try{
  const {id}=z.object({id:z.string().uuid()}).strict().parse(await readBody(request));const run=await db().prepare('SELECT result,status FROM ai_runs WHERE id=?').bind(id).first<{result:string;status:string}>();if(!run||run.status!=='complete')return json({error:'ไม่พบผลงาน AI ที่เสร็จแล้ว'},404);
  const result=aiResultSchema.parse(JSON.parse(run.result)),now=new Date().toISOString();if(!result.tasks.length)return json({ok:true,count:0});
  const statements=result.tasks.map((t,i)=>{const item=itemSchema.parse({id:'ai-'+id+'-'+i,kind:'tasks',title:t.title,department:t.department,status:'todo',description:t.description+'\nผลลัพธ์ที่ต้องส่ง: '+t.output,owner:department(t.department).short,due:addDays(3),priority:t.priority,execution:t.execution,source:'ข้อเสนอจาก AI · รอบ '+id,sourceStatus:'proposed'});return db().prepare('INSERT OR IGNORE INTO records (kind,id,payload,version,created_at,updated_at) VALUES (?,?,?,1,?,?)').bind(item.kind,item.id,JSON.stringify(item),now,now);});
  const results=await db().batch(statements);const count=results.reduce((s,r)=>s+(r.meta.changes??0),0);if(count)await db().prepare('INSERT INTO audit (id,action,title,actor,created_at) VALUES (?,?,?,?,?)').bind(crypto.randomUUID(),'assign','มอบหมายงานจากแผน AI '+count+' งาน',actor(request),now).run();return json({ok:true,count});
 }catch{return json({error:'รับแผนเข้ากระดานไม่สำเร็จ'},400);}
}
