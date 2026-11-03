import { state } from '@/lib/store';
import { json,actor } from '@/lib/http';
export const dynamic='force-dynamic';
export async function GET(request:Request){if(!actor(request))return json({error:'กรุณาเข้าสู่ระบบ ChatGPT'},401);try{return json(await state());}catch{return json({error:'โหลดข้อมูลโครงการไม่สำเร็จ กรุณาลองใหม่'},503);}}
