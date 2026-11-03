import pdfMake from 'pdfmake/build/pdfmake.js';
import fonts from './fonts/sarabun-vfs.json' with {type:'json'};
import {executiveQueue} from './executive-queue';
import type {Item} from './company';
// The embedded OFL font is bundled: PDF generation needs no font network request.
pdfMake.addVirtualFileSystem(fonts);
export async function reportPdf(items:Item[],at=new Date()){
 const q=executiveQueue(items);
 const sections=[['สรุปที่ผู้จัดการตรวจและเลขาคัดแล้ว',[...q.review,...q.summaries]],['เรื่องรอตัดสินใจ',q.approvals]] as const;
 const content:unknown[]=[{text:'โรงไม้110 · รายงานสำหรับอาร์ม',fontSize:22},{text:at.toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})+' · Asia/Bangkok',margin:[0,4,0,14]},'ตัวเลขคาดการณ์เป็นสมมติฐาน ไม่ใช่รายรับจริง งานติดต่อ ลงพื้นที่ ใช้เงิน และสัญญาให้อาร์มดำเนินการเอง'];
 for(const [title,records] of sections){content.push({text:title,fontSize:17,margin:[0,14,0,8]});if(!records.length)content.push('ยังไม่มีรายการที่ผ่านเงื่อนไข');for(const item of records.slice(0,50)){content.push({text:item.title+' · v'+item.version,fontSize:14,margin:[0,10,0,4]},(item.result||item.description).slice(0,16000),'ขั้นตอนต่อไป: '+(item.nextAction||'รอข้อมูล'),{text:'ต้นฉบับ: '+item.id+' · '+(item.updatedAt||'ไม่ระบุวันที่'),color:'#587060',fontSize:10});content.push('แหล่งข้อมูล: '+(item.source||'ยังไม่ระบุ'));for(const ref of item.references)content.push(ref.name+' · '+ref.url);for(const source of item.reviewSources??[])content.push('ผู้จัดการตรวจต้นฉบับ '+source.id+' · v'+source.version);if((item.result||item.description).length>16000)content.push('ย่อข้อความใน PDF โปรดอ่านต้นฉบับในแอป');}if(records.length>50)content.push('แสดง 50 รายการแรก โปรดอ่านรายการเพิ่มเติมในแอป');}
 content.push({text:'แหล่งอ้างอิงและข้อจำกัด',fontSize:17,margin:[0,14,0,8]},'รายงานสร้างจากข้อมูลที่บันทึกในระบบ ณ เวลารายงาน ไม่ยืนยันข้อมูลภายนอกใหม่ งานที่ยังไม่ผ่านผู้จัดการ งานถูกตีกลับ หรือ revision ไม่ตรงจะไม่รวมเป็นผลงานสำเร็จ แหล่งข้อมูลและวันที่ตรวจอยู่ในผลงานต้นฉบับ');
 return new Promise<Uint8Array>((resolve,reject)=>{try{pdfMake.createPdf({pageSize:'A4',pageMargins:[38,40,38,40],content,defaultStyle:{font:'Sarabun',fontSize:11,lineHeight:1.35}},undefined,{Sarabun:{normal:'Sarabun-Regular.ttf',bold:'Sarabun-Regular.ttf',italics:'Sarabun-Regular.ttf',bolditalics:'Sarabun-Regular.ttf'}}).getBuffer((buffer:Uint8Array)=>resolve(new Uint8Array(buffer)));}catch(e){reject(e);}});
}
