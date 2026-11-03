import { actor,json,writeAllowed,readBody } from '@/lib/http';
import { db } from '@/lib/store';
import { z } from 'zod';
export const dynamic='force-dynamic';
export async function GET(request:Request){
 if(!actor(request))return json({error:'กรุณาเข้าสู่ระบบ'},401);
 const {syncExecutiveNotifications}=await import('@/lib/executive-notifications');await syncExecutiveNotifications();
 const rows=await db().prepare('SELECT id,record_id AS recordId,kind,title,message,created_at AS createdAt,read_at AS readAt,revision FROM notifications ORDER BY created_at DESC,id DESC LIMIT 100').all();
 const count=await db().prepare('SELECT count(*) AS count FROM notifications WHERE read_at IS NULL').first<{count:number}>();
 return json({items:rows.results,unread:count?.count??0});
}
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'กรุณาเข้าสู่ระบบ'},403);
 try{const input=z.object({id:z.string().max(200).optional()}).strict().parse(await readBody(request));const now=new Date().toISOString();
 if(input.id)await db().prepare('UPDATE notifications SET read_at=? WHERE id=? AND read_at IS NULL').bind(now,input.id).run();
 else await db().prepare('UPDATE notifications SET read_at=? WHERE read_at IS NULL').bind(now).run();return json({ok:true});
 }catch{return json({error:'บันทึกสถานะอ่านไม่สำเร็จ'},400);}
}
