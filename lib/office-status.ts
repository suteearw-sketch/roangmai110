import type {CompanyState,Dept} from './company';
import {agentStatus} from './agent-status';
import {officeClock} from './office-time';
export function officeStatus(data:CompanyState,dept:Dept,connected:boolean,now=Date.now()){
 const state=agentStatus(data,dept,connected,now);const failed=data.jobs?.find(j=>j.department===dept&&['failed','needs_review','submission_unknown'].includes(j.state));
 let code='waiting',label='รอเริ่ม';if(!connected){code='error';label='ขัดข้อง · โหลดข้อมูลไม่ได้';}else if(state.active){code='working';label='กำลังทำ';}else if(!officeClock(new Date(now)).open){code='rest';label='พัก · รอ 05:00';}else if(failed&&state.task?.id===failed.taskId){code='error';label='ขัดข้อง';}else if(state.task?.status==='blocked'){code='blocked';label='รอข้อมูล';}else if(state.task?.status==='review'){code='review';label='รอตรวจ';}else if(state.task?.status==='done'){code='done';label='เสร็จแล้ว';}else if(!state.task){code='empty';label='ยังไม่มีงาน';}else if(state.task.status==='doing'){code='error';label='ขัดข้อง · รอการยืนยัน';}
 return {...state,label,code};
}
