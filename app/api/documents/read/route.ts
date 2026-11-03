import {z} from 'zod';
import {db} from '@/lib/store';
import {json,readBody,writeAllowed} from '@/lib/http';
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'กรุณาเข้าสู่ระบบ'},403);
 try{const input=z.object({id:z.string().max(100),version:z.number().int().positive()}).strict().parse(await readBody(request));await db().prepare('INSERT OR IGNORE INTO metadata(key,value) SELECT ?,? WHERE EXISTS(SELECT 1 FROM records WHERE id=? AND version=?)').bind('document-read:'+input.id+':'+input.version,new Date().toISOString(),input.id,input.version).run();return json({ok:true});}catch{return json({error:'บันทึกว่าอ่านแล้วไม่สำเร็จ'},400);}
}
