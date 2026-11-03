import { z } from 'zod';
import { db, ensureSeed } from '@/lib/store';
import { jobById, jobViews, runtimeStatus } from '@/lib/ai-jobs';
import { actor, json, readBody, writeAllowed } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){
  if(!actor(request))return json({error:'กรุณาเข้าสู่ระบบ'},401);
  await ensureSeed();
  const id=new URL(request.url).searchParams.get('id');
  if(!id)return json({jobs:await jobViews(),runtime:await runtimeStatus()});
  const job=await jobById(id);if(!job)return json({error:'ไม่พบคำสั่งนี้'},404);
  const events=await db().prepare('SELECT state,message,created_at AS createdAt FROM ai_job_events WHERE job_id=? ORDER BY created_at,id LIMIT 100').bind(id).all();
  return json({job:(await jobViews()).find((j:any)=>j.id===id),savedResult:job.result?JSON.parse(job.result):null,events:events.results});
}
export async function POST(request:Request){
  if(!writeAllowed(request))return json({error:'ไม่มีสิทธิ์เริ่มงานใหม่'},403);
  try{
    const {id}=z.object({id:z.string().uuid()}).strict().parse(await readBody(request));
    const job=await jobById(id);if(!job||job.state!=='blocked')return json({error:'เริ่มใหม่ได้เฉพาะงานที่ติดขัด กรุณาโหลดข้อมูลล่าสุด'},409);
    if(['submission_unknown','task_changed'].includes(job.error_code??''))return json({error:'ต้องตรวจคำขอเดิมหรือโจทย์ที่เปลี่ยนก่อน ไม่ส่งประมวลผลซ้ำอัตโนมัติ'},409);
    const now=new Date().toISOString();
    const result=await db().prepare("UPDATE ai_jobs SET state='queued',attempt=0,provider_id=NULL,provider_state=NULL,started_at=NULL,completed_at=NULL,error_code=NULL,error_message=NULL,next_attempt_at=?,updated_at=? WHERE id=? AND state='blocked' AND (lease_until IS NULL OR lease_until<?)").bind(now,now,id,now).run();
    if(!result.meta.changes)return json({error:'งานกำลังถูกประมวลผล กรุณาโหลดข้อมูลล่าสุด'},409);
    await db().prepare("INSERT INTO ai_job_events (id,job_id,state,message,created_at) VALUES (?,?,'queued',?,?)").bind(crypto.randomUUID(),id,'อาร์มสั่งเริ่มใหม่หลังตรวจข้อผิดพลาด',now).run();
    return json({ok:true});
  }catch{return json({error:'เริ่มงานใหม่ไม่สำเร็จ'},400);}
}
