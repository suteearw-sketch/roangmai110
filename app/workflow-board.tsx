'use client';
import {workstreams,type Stream} from '@/lib/autonomous-policy';
import {statuses,type CompanyState,type Item} from '@/lib/company';
export function WorkflowBoard({data,onTask}:{data:CompanyState;onTask:(item:Item)=>void}){
 return <section className="panel workflow-board"><div className="section-head"><div><span className="section-kicker">RESEARCH → MANAGER → SECRETARY</span><h2>วงจรพัฒนาโครงการ</h2><p className="muted">งานวิจัยส่งต่อได้เมื่อมีผลงานบันทึกจริง · การติดต่อและใช้เงินยังรอBOSS</p></div></div><div className="workflow-lanes">{(Object.keys(workstreams) as Stream[]).map(key=>{
 const stream=workstreams[key],tasks=data.items.filter(i=>i.kind==='tasks'&&i.category.startsWith('autonomy:'+key+':')).sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??''));
 const cycle=tasks[0]?.category.split(':')[2],current=tasks.filter(i=>i.category.split(':')[2]===cycle);
 return <article key={key}><h3>{stream.name}</h3><ol>{stream.stages.map((stage,n)=>{const task=current.find(i=>Number(i.category.split(':')[3])===n);const stale=task?.status==='doing'&&task.progress&&Date.now()-Date.parse(task.progress.updatedAt)>600000;return <li key={n}><span>{n+1}</span><div>{task?<button onClick={()=>onTask(task)}>{stage.name}</button>:<strong>{stage.name}</strong>}<small>{task?(stale?'ขาดการอัปเดต':statuses.tasks[task.status]??task.status):n===0?'ยังไม่มีงานในวงจร':'รอผลงานขั้นก่อนหน้า'}</small></div></li>;})}</ol></article>;
 })}</div><p className="workflow-note">ผู้จัดการเลือกและแจกงานวิจัยเอง เลขารวมข้อสรุปให้BOSSติดต่อ · ดูสถานะจากทะเบียนที่อัปเดตทุก 5 วินาที ตัวรับงานทันที: {data.runtime?.ready?'เชื่อมต่ออยู่':'ยังไม่เชื่อมต่อ'} · งานรายชั่วโมงใช้ระบบเดิมที่ผูกกับแอป</p></section>;
}
