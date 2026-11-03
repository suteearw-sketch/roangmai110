'use client';
import {departments,type CompanyState,type Item} from '@/lib/company';
import {executiveQueue} from '@/lib/executive-queue';
import {agentStatus} from '@/lib/agent-status';

const LOG_ID='mcp-3b6f5ea2-2d29-4cc7-88de-054248fa1c67';
function short(value:string,max=145){const text=value.replace(/\s+/g,' ').trim();return text.length>max?text.slice(0,max)+'…':text;}
export function ExecutiveSummary({data,connected,onTask,teamOnly=false}:{data:CompanyState;connected:boolean;teamOnly?:boolean;onTask:(item:Item)=>void}){
 const tasks=data.items.filter(i=>i.kind==='tasks'&&i.id!==LOG_ID);
 const verified=executiveQueue(data.items);
 const recent=[...verified.review,...verified.summaries].sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??''))[0];
 const models=departments.map(d=>({d,...agentStatus(data,d.id,connected)}));
 const active=models.filter(m=>m.active);
 const next=tasks.filter(i=>['director','secretary'].includes(i.department)&&['todo','blocked'].includes(i.status)).sort((a,b)=>Number(b.priority==='high')-Number(a.priority==='high')||(b.updatedAt??'').localeCompare(a.updatedAt??''))[0];
 const decision=data.items.filter(i=>i.kind==='approvals'&&i.status==='pending').sort((a,b)=>Number(b.priority==='high')-Number(a.priority==='high')||(b.updatedAt??'').localeCompare(a.updatedAt??''))[0];
 const cards=[{label:'สรุปที่เลขาคัดแล้ว',item:recent,empty:'รอผู้จัดการและเลขาคัดสรุป',note:recent?.status==='review'?'ส่งรอตรวจแล้ว':'ตรวจรับแล้ว'},
 {label:'งานที่ทำต่อ',item:active.find(m=>['director','secretary'].includes(m.d.id))?.task??next,empty:'ไม่มีงานพร้อมเริ่ม',note:active.length?'กำลังทำตามรายงานล่าสุด':next?.status==='blocked'?'รอข้อมูล':'รอเริ่ม'},
 {label:'BOSSตัดสินใจ',item:decision,empty:'ไม่มีเรื่องรอตัดสินใจ',note:decision?'รอการตัดสินใจ':''}];
 return <section className="panel executive-compact" aria-label="สรุปสำคัญให้BOSS">{!teamOnly&&<><div className="section-head"><div><h2>สรุปให้BOSS</h2><p>เฉพาะผลงาน งานต่อ และเรื่องตัดสินใจ</p></div></div><div className="executive-cards">{cards.map(c=><article key={c.label}><small>{c.label}</small><h3>{c.item?short(c.item.title,95):c.empty}</h3>{c.item&&<><span className="executive-state">{c.note}</span><p>{short(c.item.nextAction||c.item.description)}</p><button className="text-button" onClick={()=>onTask(c.item!)}>ดูรายละเอียด ↗</button></>}</article>)}</div></>}
 <div className="executive-team"><h3>แต่ละแผนกกำลังทำอะไร</h3><div className="secretary-table-wrap"><table className="secretary-table"><thead><tr><th>แผนก</th><th>กำลังทำตอนนี้</th><th>ขั้นถัดไป</th><th>ดูงาน</th></tr></thead><tbody>{models.map(m=><tr key={m.d.id}><td><strong>{m.d.short}</strong><small>{m.label}</small></td><td>{m.active&&m.task?<><strong>{short(m.task.title,90)}</strong><small>{short(m.task.progress?.message||'กำลังประมวลผล',100)}</small></>:m.label==='ขาดการอัปเดต'?'ยังยืนยันงานปัจจุบันไม่ได้':m.reason}</td><td>{short(m.task?.nextAction||'ยังไม่มีงานถัดไป',125)}</td><td>{m.task?<button className="text-button" onClick={()=>onTask(m.task!)}>ดูงาน ↗</button>:'—'}</td></tr>)}</tbody></table></div></div></section>;
}
