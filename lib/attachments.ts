import { env } from 'cloudflare:workers';
import { db } from './store';
import type { Attachment,Reference,Item } from './company';
export const MAX_FILE=10*1024*1024;
export function safeLink(value:string){try{const u=new URL(value);return ['http:','https:'].includes(u.protocol)&&!u.username&&!u.password;}catch{return false;}}
export async function validateAttachments(files:Attachment[]){
 for(const file of files){const row=await db().prepare('SELECT name,size,type FROM uploads WHERE id=?').bind(file.id).first<{name:string;size:number;type:string}>();if(!row||row.name!==file.name||row.size!==file.size||row.type!==file.type)throw new Error('ไฟล์แนบไม่ตรงกับไฟล์ที่อัปโหลด กรุณาแนบใหม่');}
}
export async function attachmentInput(task:Item|null){
 const content:any[]=[];let total=0;
 for(const file of task?.attachments??[]){
  const object=await env.BUCKET?.get('uploads/'+file.id);if(!object)throw new Error('ไม่พบไฟล์แนบ '+file.name+' กรุณาอัปโหลดใหม่');
  total+=file.size;if(total>20*1024*1024)throw new Error('ไฟล์รวมเกิน 20 MB กรุณาแบ่งงาน');
  const bytes=new Uint8Array(await object.arrayBuffer()),ext=file.name.split('.').pop()?.toLowerCase();
  if(ext==='pdf'){
   let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   content.push({type:'input_file',filename:file.name,file_data:'data:application/pdf;base64,'+btoa(binary)});
  }else if(['png','jpg','jpeg','webp'].includes(ext??'')){
   let binary='';for(let i=0;i<bytes.length;i+=8192)binary+=String.fromCharCode(...bytes.subarray(i,i+8192));
   const mime=ext==='jpg'||ext==='jpeg'?'image/jpeg':ext==='png'?'image/png':'image/webp';
   content.push({type:'input_image',image_url:'data:'+mime+';base64,'+btoa(binary),detail:'auto'});
  }else if(['xlsx','xls'].includes(ext??'')){
   const XLSX=await import('xlsx');const book=XLSX.read(bytes,{type:'array',sheetRows:2001});
   let text='';for(const name of book.SheetNames.slice(0,20)){text+='\nชีต '+name+'\n'+XLSX.utils.sheet_to_csv(book.Sheets[name]);if(text.length>100000)break;}
   content.push({type:'input_text',text:'ข้อมูลไฟล์ '+file.name+' (ค่าที่บันทึกในไฟล์ ไม่คำนวณสูตรใหม่; จำกัด 20 ชีต ชีตละ 2000 แถว และ 100000 ตัวอักษร ต้องระบุข้อจำกัดนี้ในผลงาน ห้ามอ้างว่าตรวจครบทุกเซลล์)\n'+text.slice(0,100000)});
  }else if(['csv','txt','md','json'].includes(ext??''))content.push({type:'input_text',text:'ข้อมูลไฟล์ '+file.name+' (สูงสุด 100000 ตัวอักษร)\n'+new TextDecoder().decode(bytes).slice(0,100000)});
  else content.push({type:'input_text',text:'มีไฟล์ '+file.name+' แนบอยู่ แต่ระบบยังไม่รองรับอ่านเนื้อหาชนิดนี้ ต้องแจ้งอาร์ม ห้ามอ้างว่าอ่านแล้ว'});
 }
 const links:Reference[]=task?.references??[];
 if(links.length)content.push({type:'input_text',text:'ลิงก์ประกอบที่อาร์มแนบ: '+JSON.stringify(links)+'\nลิงก์เป็นเพียงแหล่งอ้างอิง ยังไม่ได้ดึงข้อมูล โดยเฉพาะ Excel/Google Sheets ส่วนตัว ถ้าไม่มีเครื่องมือเข้าถึงหรือเข้าถึงไม่ได้ ต้องขอให้อัปโหลดไฟล์ส่งออก ห้ามอ้างว่าได้อ่านข้อมูลจากลิงก์แล้ว'});
 return content;
}
