import {officeClock} from './office-time';
import type {CompanyState,Dept} from './company';
export function agentStatus(data:CompanyState,dept:Dept,connected:boolean,now=Date.now()){
 const tasks=data.items.filter(t=>t.kind==='tasks'&&t.department===dept).sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??''));
 const job=data.jobs?.find(j=>j.department===dept&&j.providerState==='in_progress'&&j.startedAt&&['submitted','running','processing','polling'].includes(j.state)&&now-Date.parse(j.updatedAt)<90000);
 const reported=tasks.find(t=>t.status==='doing'&&t.progress&&now-Date.parse(t.progress.updatedAt)<600000);
 const active=!!(connected&&(reported||(data.runtime?.ready&&job)));
 const task=(active&&(reported||tasks.find(t=>t.id===job?.taskId)))||tasks.find(t=>t.status==='doing')||tasks.find(t=>t.status==='blocked')||tasks.find(t=>t.status==='todo')||tasks.find(t=>t.status==='review'&&t.result)||tasks[0];
 const label=!connected?'ข้อมูลขาดการเชื่อมต่อ':active?(!officeClock(new Date(now)).open?'กำลังรับผลงานเดิม · ช่วงพัก':'กำลังทำ'):!officeClock(new Date(now)).open?'พัก / นอน · คิวรอ 05:00':task?.status==='doing'?'ขาดการอัปเดต':task?.status==='blocked'?'ติดขัด / รอข้อมูล':task?.status==='todo'?(data.runtime?.ready?'รอรับงาน':'รอระบบทำงานในแอป'):tasks.some(t=>t.status==='review')?(dept==='secretary'?'สรุปพร้อมให้อาร์มอ่าน':'ส่งผลงานรอตรวจภายในทีม'):'ไม่มีงานพร้อมทำ';
 const reason=!connected?'โหลดสถานะล่าสุดไม่ได้':active?'มีรายงานความคืบหน้าล่าสุด':task?.status==='doing'?'รายงานเก่าแล้ว ยังยืนยันว่ากำลังทำไม่ได้':task?.status==='blocked'?(task.nextAction||'รอข้อมูลที่จำเป็น'):tasks.some(t=>t.status==='todo')&&!data.runtime?.ready?(!data.runtime?.providerConfigured?'บริการ AI ในแอปยังไม่ตั้งค่าครบ':!data.runtime?.workerConfigured?'ตัวรับงานเบื้องหลังยังไม่ตั้งค่า':'ตัวรับงานเบื้องหลังขาดการเชื่อมต่อ'):tasks.some(t=>t.status==='review')?'มีผลงานบันทึกแล้ว เปิดอ่านได้':'ยังไม่มีงานที่พร้อมเริ่ม';
 return {tasks,task,active,label,reason,approvalCount:data.items.filter(t=>t.kind==='approvals'&&t.department===dept&&t.status==='pending').length,reviewCount:tasks.filter(t=>t.status==='review').length,updatedAt:active?(reported?.progress?.updatedAt||job?.updatedAt):task?.updatedAt};
}
