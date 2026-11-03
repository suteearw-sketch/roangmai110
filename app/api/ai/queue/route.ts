import { z } from 'zod';
import { enqueue, jobInput, processJob, runtimeStatus } from '@/lib/ai-jobs';
import { json, actor, writeAllowed, readBody } from '@/lib/http';
export const dynamic='force-dynamic';
export async function POST(request:Request){
  if(!writeAllowed(request))return json({error:'กรุณาเข้าสู่ระบบและส่งคำสั่งจากแอปนี้'},403);
  try{
    const input=jobInput.parse(await readBody(request)),queued=await enqueue(input,actor(request)!);
    const runtime=await runtimeStatus();
    // Submit immediately only when the independent receiver can finish the job.
    // The provider runs asynchronously; this request never waits for a full report.
    if(runtime.ready&&queued.job)await processJob(input.id);
    return json({mode:'queued',taskId:queued.taskId,created:queued.created,runtime},queued.created?201:200);
  }catch(e){
    if(e instanceof Error&&e.message==='request_conflict')return json({error:'รหัสคำสั่งนี้ถูกใช้กับโจทย์อื่นแล้ว กรุณาโหลดข้อมูลล่าสุด'},409);
    if(e instanceof Error&&e.message==='daily_limit')return json({error:'รับคำสั่งครบ 30 งานใน 24 ชั่วโมงแล้ว คิวเดิมยังเก็บอยู่'},429);
    return json({error:e instanceof z.ZodError?'กรุณาระบุแผนกและคำสั่งที่ถูกต้อง':'บันทึกคำสั่งไม่สำเร็จ ยังไม่มีการยืนยันว่ารับงานแล้ว กรุณาลองรหัสคำสั่งเดิมอีกครั้ง'},e instanceof z.ZodError?400:503);
  }
}
