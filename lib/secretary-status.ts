import {departments,type Item,type Dept} from './company';
const names:Record<Dept,string[]>={director:['ผู้จัดการ','manager'],marketing:['การตลาด','ผู้เช่า','marketing'],development:['พัฒนา','หน้างาน','ช่าง','วิจัย'],finance:['การเงิน','finance'],secretary:['เลขา','secretary']};
export function secretaryStatus(question:string,items:Item[]){
 const q=question.trim().toLowerCase();
 const selected=departments.filter(d=>names[d.id].some(s=>q.includes(s))).map(d=>d.id);
 const state=q.includes('รอตรวจ')?'review':/(ติดขัด|มีปัญหา|ติดอะไร|blocked)/.test(q)?'blocked':/(เสร็จ|done)/.test(q)?'done':/(รอเริ่ม|ยังไม่เริ่ม)/.test(q)?'todo':/(กำลังทำ|doing)/.test(q)?'doing':null;
 const scoped=items.filter(i=>i.kind==='tasks'&&(!selected.length||selected.includes(i.department)));
 const matches=scoped.filter(i=>!state||i.status===state).sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??'')||a.id.localeCompare(b.id));
 return {departments:selected,status:state,total:scoped.length,counts:{todo:scoped.filter(i=>i.status==='todo').length,doing:scoped.filter(i=>i.status==='doing').length,review:scoped.filter(i=>i.status==='review').length,blocked:scoped.filter(i=>i.status==='blocked').length,done:scoped.filter(i=>i.status==='done').length},matches};
}
