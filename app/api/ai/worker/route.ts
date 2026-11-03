import { tick, workerAuthorized } from '@/lib/ai-jobs';
import { json } from '@/lib/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  if(!await workerAuthorized(request))return json({error:'ไม่มีสิทธิ์เรียกตัวประมวลผล'},403);
  try{return json(await tick());}catch{return json({error:'ตัวประมวลผลไม่พร้อม คิวที่บันทึกยังอยู่ จะลองเชื่อมต่อใหม่'},503);}
}
