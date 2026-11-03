import {z} from 'zod';
import {avatarPreferenceSchema,defaultOfficeAvatars} from '@/lib/office';
import {db,logStmt} from '@/lib/store';
import {actor,json,readBody,writeAllowed} from '@/lib/http';
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'กรุณาเปลี่ยนตัวละครจากในแอปนี้'},403);
 try{
  const input=avatarPreferenceSchema.parse(await readBody(request));
  if(input.avatar!==defaultOfficeAvatars[input.department])return json({error:'ตัวละครประจำฝ่ายถูกกำหนดไว้แล้ว'},400);
  await db().batch([
   db().prepare('INSERT INTO metadata (key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('office-avatar-'+input.department,input.avatar),
   logStmt('office-avatar','เปลี่ยนตัวละคร '+input.department,actor(request)!),
  ]);
  return json({ok:true,...input});
 }catch(e){return json({error:e instanceof z.ZodError?'ตัวละครหรือแผนกไม่ถูกต้อง':'บันทึกตัวละครไม่สำเร็จ กรุณาลองใหม่'},400);}
}
