import {env} from 'cloudflare:workers';
import {db,allItems} from './store';
import {reportDue,reportSettingsSchema,REPORT_TO,type ReportSettings} from './report-policy';
export async function reportStatus(){
 const settings=await db().prepare('SELECT value FROM metadata WHERE key=?').bind('report-settings').first<{value:string}>();
 const last=await db().prepare('SELECT value FROM metadata WHERE key=?').bind('owner-last-seen').first<{value:string}>();
 let parsed:ReportSettings={enabled:false,repeatHours:null};try{if(settings)parsed=reportSettingsSchema.parse(JSON.parse(settings.value));}catch{ /* Disabled until settings are valid. */ }
 return {settings:parsed,lastSeen:last?.value??null,firstAfterHours:24,recipient:REPORT_TO,pdfReady:true,emailConfigured:!!(env.REPORT_EMAIL_API_KEY&&env.REPORT_EMAIL_FROM)};
}
const iso=(n=Date.now())=>new Date(n).toISOString();
export async function deliverReport(){
 const status=await reportStatus(),episode=reportDue(status.lastSeen,status.settings);if(!episode||!status.emailConfigured||!env.BUCKET)return {sent:false,reason:'not_ready_or_due'};
 const id='report-'+Array.from(new Uint8Array(await crypto.subtle.digest('SHA-256',new TextEncoder().encode(episode)))).map(n=>n.toString(16).padStart(2,'0')).join(''),now=iso();
 await db().prepare("INSERT OR IGNORE INTO report_deliveries(id,episode,state,created_at,updated_at,next_attempt_at) VALUES (?,?,'queued',?,?,?)").bind(id,episode,now,now,now).run();
 const token=crypto.randomUUID();
 const claim=await db().prepare("UPDATE report_deliveries SET lease_token=?,lease_until=?,attempt=attempt+1,updated_at=? WHERE id=? AND state IN ('queued','retry_wait','sending') AND next_attempt_at<=? AND (lease_until IS NULL OR lease_until<?)").bind(token,iso(Date.now()+180000),now,id,now,now).run();
 if(!claim.meta.changes)return {sent:false,reason:'already_claimed_or_delivered'};
 const row=(await db().prepare('SELECT created_at,attempt FROM report_deliveries WHERE id=?').bind(id).first<{created_at:string;attempt:number}>())!;
 const finish=async(state:string,error:string|null,providerId:string|null=null)=>db().prepare('UPDATE report_deliveries SET state=?,error=?,provider_id=?,updated_at=?,next_attempt_at=?,lease_token=NULL,lease_until=NULL WHERE id=? AND lease_token=?').bind(state,error,providerId,iso(),iso(Date.now()+Math.min(3600000,30000*2**Math.min(row.attempt,7))),id,token).run();
 // Provider deduplication expires after 24h. Stop before that boundary when the
 // delivery outcome is uncertain; never turn an unknown delivery into a new send.
 if(Date.now()-Date.parse(row.created_at)>20*3600000){await finish('delivery_unknown','เกินช่วง retry ที่ผู้ให้บริการป้องกันส่งซ้ำ ต้องตรวจ delivery log');return {sent:false,reason:'delivery_unknown'};}
 try{
  const {reportPdf}=await import('./report-pdf');
  const bytes=await reportPdf(await allItems());
  await env.BUCKET.put('reports/'+id+'.pdf',bytes,{httpMetadata:{contentType:'application/pdf'}});
  // Recheck owner activity/settings after generating the report, before sending.
  const fresh=await reportStatus();if(reportDue(fresh.lastSeen,fresh.settings)!==episode){await finish('cancelled','เจ้าของกลับมาใช้งานหรือเปลี่ยนการตั้งค่า');return {sent:false,reason:'owner_active'};}
  let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
  await db().prepare("UPDATE report_deliveries SET state='sending' WHERE id=? AND lease_token=?").bind(id,token).run();
  const response=await fetch('https://api.resend.com/emails',{method:'POST',headers:{Authorization:'Bearer '+env.REPORT_EMAIL_API_KEY,'Content-Type':'application/json','Idempotency-Key':id},signal:AbortSignal.timeout(15000),body:JSON.stringify({from:env.REPORT_EMAIL_FROM,to:[REPORT_TO],subject:'โรงไม้110 · รายงานสรุปให้อาร์ม',text:'รายงานจากผู้จัดการและเลขา พร้อมเรื่องรอตัดสินใจและขั้นตอนถัดไปอยู่ใน PDF แนบ',attachments:[{filename:'roangmai110-report.pdf',content:btoa(binary)}]})});
  if(!response.ok){await finish(response.status===429||response.status>=500?'retry_wait':'blocked','Email provider HTTP '+response.status);return {sent:false,reason:'provider_error'};}
  const body=await response.json() as {id?:string};if(!body.id){await finish('retry_wait','ผู้ให้บริการไม่คืนรหัสยืนยัน');return {sent:false,reason:'unconfirmed'};}
  await finish('sent',null,body.id);return {sent:true};
 }catch{await finish('retry_wait','สร้าง PDF หรือส่งอีเมลไม่สำเร็จ จะใช้รหัสเดิมเมื่อ retry');return {sent:false,reason:'retry_wait'};}
}
