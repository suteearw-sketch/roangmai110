export function workCommand(prompt:string,fileCount:number,linkCount:number){
 const text=prompt.trim();
 if(text)return text;
 if(fileCount||linkCount)return 'ตรวจเอกสารและลิงก์ที่แนบให้ฝ่ายนี้ สรุปสาระสำคัญ ข้อมูลที่ยังขาด และเสนอขั้นตอนถัดไป หากอ่านไฟล์หรือเข้าถึงลิงก์ไม่ได้ให้แจ้งตรง ๆ ห้ามเดาข้อมูล';
 return '';
}
