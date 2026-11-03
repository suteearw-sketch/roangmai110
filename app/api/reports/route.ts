import {actor,json,readBody,writeAllowed} from '@/lib/http';
import {reportStatus} from '@/lib/reports';
import {reportSettingsSchema} from '@/lib/report-policy';
import {db,allItems} from '@/lib/store';
export async function GET(request:Request){
 if(!actor(request))return json({error:'กรุณาเข้าสู่ระบบ'},401);
 if(new URL(request.url).searchParams.get('format')==='pdf'){
  const {reportPdf}=await import('@/lib/report-pdf');const bytes=await reportPdf(await allItems());
  return new Response(bytes as BodyInit,{headers:{'Content-Type':'application/pdf','Content-Disposition':'attachment; filename="roangmai110-report.pdf"','Cache-Control':'private, no-store'}});
 }
 return json(await reportStatus());
}
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'กรุณาตั้งค่าจากแอปนี้'},403);
 try{const settings=reportSettingsSchema.parse(await readBody(request));await db().prepare('INSERT INTO metadata(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('report-settings',JSON.stringify(settings)).run();return json(await reportStatus());}catch{return json({error:'ตั้งค่ารายงานไม่ถูกต้อง'},400);}
}
