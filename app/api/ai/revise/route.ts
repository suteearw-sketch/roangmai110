import {z} from 'zod';
import {db} from '@/lib/store';
import {actor,json,readBody,writeAllowed} from '@/lib/http';
import {jobInput} from '@/lib/ai-jobs';
import {itemSchema} from '@/lib/company';
import {validateAttachments} from '@/lib/attachments';
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'กรุณาส่งคำสั่งจากแอปนี้'},403);
 try{
  const input=z.object({taskId:z.string().max(100),expectedVersion:z.number().int().positive(),command:jobInput}).strict().parse(await readBody(request));
  const command=input.command,prompt=`[revision:${input.expectedVersion+1}]\n${command.prompt}`;
  const duplicate=await db().prepare('SELECT task_id,prompt,department FROM ai_jobs WHERE id=?').bind(command.id).first<{task_id:string;prompt:string;department:string}>();
  if(duplicate)return duplicate.task_id===input.taskId&&duplicate.prompt===prompt&&duplicate.department===command.department?json({ok:true,taskId:input.taskId}):json({error:'รหัสคำสั่งซ้ำกับโจทย์อื่น'},409);
  const row=await db().prepare("SELECT payload,version FROM records WHERE kind='tasks' AND id=?").bind(input.taskId).first<{payload:string;version:number}>();
  if(!row||row.version!==input.expectedVersion)return json({error:'งานเปลี่ยนแล้ว โหลดข้อมูลล่าสุดก่อนแก้'},409);
  const old=itemSchema.parse(JSON.parse(row.payload));
  if(old.department!==command.department)return json({error:'แผนกไม่ตรงกับงานเดิม'},400);
  await validateAttachments(command.attachments);
  const item=itemSchema.parse({...old,description:prompt,status:'todo',result:'',progress:undefined,attachments:command.attachments,references:command.references,nextAction:'แก้โจทย์และเก็บผลงานเดิมในประวัติแล้ว รอประมวลผล revision ใหม่'}),now=new Date().toISOString();
  const result=await db().batch([
   db().prepare("UPDATE records SET payload=?,version=version+1,updated_at=? WHERE kind='tasks' AND id=? AND version=? AND (SELECT count(*) FROM ai_jobs WHERE created_at>=?)<30").bind(JSON.stringify(item),now,input.taskId,input.expectedVersion,new Date(Date.now()-86400000).toISOString()),
   db().prepare("INSERT INTO ai_jobs(id,task_id,department,prompt,actor,state,attempt,next_attempt_at,created_at,updated_at) SELECT ?,?,?,?,?,'queued',0,?,?,? WHERE changes()>0").bind(command.id,input.taskId,command.department,prompt,actor(request),now,now,now),
   db().prepare("UPDATE ai_jobs SET state='cancelled',lease_token=NULL,lease_until=NULL,error_code='superseded',error_message='ถูกแทนด้วย revision ใหม่',updated_at=? WHERE task_id=? AND id<>? AND state IN ('queued','submitted','running','retry_wait') AND EXISTS(SELECT 1 FROM ai_jobs WHERE id=?)").bind(now,input.taskId,command.id,command.id),
  ]);
  if(!result[0].meta.changes)return json({error:'ข้อมูลเปลี่ยนหรือครบเพดานรับคำสั่งแล้ว กรุณาโหลดข้อมูลใหม่'},409);
  return json({ok:true,taskId:input.taskId},201);
 }catch(e){return json({error:e instanceof z.ZodError?'รูปแบบแก้ไขงานไม่ถูกต้อง':'บันทึก revision ไม่สำเร็จ'},400);}
}
