import { env } from 'cloudflare:workers';
import { actor,json } from '@/lib/http';
import { db } from '@/lib/store';
import { MAX_FILE } from '@/lib/attachments';
export const dynamic='force-dynamic';
export async function POST(request:Request){
 if(!actor(request)||request.headers.get('origin')!==new URL(request.url).origin)return json({error:'กรุณาอัปโหลดจากแอปที่เข้าสู่ระบบแล้ว'},403);
 if(!env.BUCKET)return json({error:'พื้นที่เก็บไฟล์ยังไม่พร้อม'},503);
 if(Number(request.headers.get('content-length'))>MAX_FILE+65536)return json({error:'ไฟล์ต้องไม่เกิน 10 MB'},413);
 try{
  // Bound the actual body even when Content-Length is absent or untrusted.
  const reader=request.body?.getReader();if(!reader)return json({error:'ไม่พบไฟล์'},400);
  const chunks:Uint8Array[]=[];let size=0;while(true){const r=await reader.read();if(r.done)break;size+=r.value.length;if(size>MAX_FILE+65536){await reader.cancel();return json({error:'ไฟล์ต้องไม่เกิน 10 MB'},413);}chunks.push(r.value);}
  const bounded=new Request(request.url,{method:'POST',headers:{'Content-Type':request.headers.get('content-type')??''},body:new Blob(chunks as BlobPart[])});
  const form=await bounded.formData(),file=form.get('file');if(!(file instanceof File)||file.size===0||file.size>MAX_FILE)return json({error:'เลือกไฟล์ขนาด 1 ไบต์–10 MB'},400);
  const name=file.name.replace(/[\r\n\x00-\x1f]/g,'').slice(0,255);if(!name)return json({error:'ชื่อไฟล์ไม่ถูกต้อง'},400);
  if(!/\.(pdf|xlsx|xls|csv|txt|md|json|docx|pptx|png|jpg|jpeg|webp)$/i.test(name))return json({error:'รองรับ PDF, Excel, CSV, ข้อความ, Word, PowerPoint และรูปภาพ'},400);
  const id=crypto.randomUUID(),type=file.type||'application/octet-stream';
  await env.BUCKET.put('uploads/'+id,await file.arrayBuffer(),{httpMetadata:{contentType:'application/octet-stream'}});
  try{await db().prepare('INSERT INTO uploads (id,name,size,type,actor,created_at) VALUES (?,?,?,?,?,?)').bind(id,name,file.size,type,actor(request),new Date().toISOString()).run();}catch(e){await env.BUCKET.delete('uploads/'+id);throw e;}
  return json({id,name,size:file.size,type},201);
 }catch{return json({error:'อัปโหลดไม่สำเร็จ กรุณาลองใหม่'},400);}
}
export async function GET(request:Request){
 if(!actor(request))return json({error:'กรุณาเข้าสู่ระบบ'},401);
 const id=new URL(request.url).searchParams.get('id');if(!id||!/^[-a-f0-9]{36}$/.test(id))return json({error:'ไม่พบไฟล์'},404);
 const row=await db().prepare('SELECT name FROM uploads WHERE id=?').bind(id).first<{name:string}>();const file=row&&await env.BUCKET?.get('uploads/'+id);if(!file)return json({error:'ไม่พบไฟล์'},404);
 return new Response(file.body,{headers:{'Content-Type':'application/octet-stream','Content-Disposition':"attachment; filename*=UTF-8''"+encodeURIComponent(row!.name),'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});
}
