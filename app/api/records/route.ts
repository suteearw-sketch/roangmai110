import { validateAttachments } from '@/lib/attachments';
import { z } from 'zod';
import { itemSchema,kinds } from '@/lib/company';
import { db,ensureSeed,saveItem } from '@/lib/store';
import { json,actor,writeAllowed,readBody } from '@/lib/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'กรุณาเข้าสู่ระบบและส่งคำสั่งจากแอปนี้'},403);
 try{
  await ensureSeed();const body=await readBody(request);
  if(body.action==='delete'){
   const data=z.object({action:z.literal('delete'),kind:z.enum(kinds),id:z.string().min(1).max(100),version:z.number().int().min(1)}).strict().parse(body);
   const old=await db().prepare('SELECT payload FROM records WHERE kind=? AND id=? AND version=?').bind(data.kind,data.id,data.version).first<{payload:string}>();
   if(!old)return json({error:'ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่'},409);
   const now=new Date().toISOString();const results=await db().batch([
    db().prepare('DELETE FROM records WHERE kind=? AND id=? AND version=?').bind(data.kind,data.id,data.version),
    db().prepare('INSERT INTO audit (id,action,title,actor,created_at) SELECT ?,?,?,?,? WHERE changes()>0').bind(crypto.randomUUID(),'delete',JSON.parse(old.payload).title,actor(request),now)
   ]);if(!results[0].meta.changes)return json({error:'ข้อมูลเปลี่ยนแล้ว กรุณาโหลดใหม่'},409);return json({ok:true});
  }
  const data=z.object({action:z.literal('save'),version:z.number().int().min(0),item:itemSchema}).strict().parse(body);
  if(data.item.kind==='leads'&&['contacted','visit','proposal','negotiation','won'].includes(data.item.status)&&!data.item.result.trim())return json({error:'กรุณาบันทึกหลักฐานการติดต่อหรือการยืนยันของอาร์มก่อนเปลี่ยนสถานะ'},400);
  await validateAttachments(data.item.attachments);
  if(!await saveItem(data.item,data.version,actor(request)!))return json({error:'ข้อมูลเปลี่ยนจากอีกหน้าต่างแล้ว กรุณาโหลดข้อมูลล่าสุดก่อนบันทึก'},409);
  return json({ok:true});
 }catch(e){return json({error:e instanceof z.ZodError?e.issues.map(i=>i.message).join(' · '):'บันทึกไม่สำเร็จ กรุณาตรวจข้อมูลแล้วลองใหม่'},400);}
}
