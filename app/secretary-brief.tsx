'use client';
import {tenantRows} from '@/lib/tenant-table';
import {useState} from 'react';
import {SecretaryStatus} from './secretary-status';
import {FileText,Download,ArrowUpRight} from 'lucide-react';
import {departments,statuses,money,financials,today,type CompanyState,type Item} from '@/lib/company';
export function SecretaryBrief({data,onTask,onAssign}:{data:CompanyState;onTask:(item:Item)=>void;onAssign:()=>void}){
 const [tab,setTab]=useState<'team'|'prospects'|'rent'>('team');
 const tasks=data.items.filter(i=>i.kind==='tasks');
 const groups=departments.filter(d=>d.id!=='secretary').map(d=>{const all=tasks.filter(i=>i.department===d.id),latest=all.filter(i=>i.result).sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??''))[0];return {d,all,latest};});
 const prospects=data.items.filter(i=>i.kind==='leads');
 const prospectWork=tasks.filter(i=>i.department==='marketing'&&i.result&&/(คัดกรอง|รายชื่อ|แบรนด์|ผู้ประกอบการ)/.test(i.title));
 const tenants=tenantRows(data.items);
 const actual=financials(data.items,today().slice(0,7));
 const decisions=data.items.filter(i=>i.kind==='approvals'&&i.status==='pending');
 function exportTable(){const rows=tab==='team'?[['ฝ่าย','รอเริ่ม','รอตรวจ','ติดขัด','งานล่าสุด','ขั้นถัดไป'],...groups.map(g=>[g.d.short,g.all.filter(i=>i.status==='todo').length,g.all.filter(i=>i.status==='review').length,g.all.filter(i=>i.status==='blocked').length,g.latest?.title??'ยังไม่มีผลงาน',g.latest?.nextAction??g.d.mission])]:tab==='prospects'?[['รายชื่อ','สถานะ','ยูนิต','ช่องทาง','ขั้นถัดไป'],...prospects.map(i=>[i.title,statuses.leads[i.status],i.unit,i.contact,i.nextAction])]:[['ผู้เช่า / พื้นที่','ยูนิต','ค่าเช่าตามทะเบียน (ไม่ใช่รับจริง)','สถานะ','เงื่อนไข'],...tenants.map(i=>[i.title,i.unit,i.amount??'',statuses.tenants[i.status],i.rentDetails])];const text='\uFEFF'+rows.map(r=>r.map(v=>String(v).replace(/[\t\r\n]/g,' ')).join('\t')).join('\n');const u=URL.createObjectURL(new Blob([text],{type:'text/tab-separated-values;charset=utf-8'}));const a=document.createElement('a');a.href=u;a.download='Roangmai110-summary-'+tab+'-'+today()+'.tsv';a.click();setTimeout(()=>URL.revokeObjectURL(u),1000);}
 return <section className="secretary-panel panel"><div className="section-head"><div><span className="section-kicker">EXECUTIVE BRIEF</span><h2><FileText size={21}/> สรุปจากเลขา</h2><p>อ่านจากข้อมูลที่บันทึก · ตรวจงานต้นฉบับได้ทุกแถว</p></div><button className="btn" onClick={exportTable}><Download size={15}/>เปิดใน Excel</button></div>
 <SecretaryStatus data={data} onTask={onTask}/><div className="secretary-highlights"><div><small>ผลงานรอตรวจ</small><b>{tasks.filter(i=>i.status==='review').length}</b></div><div><small>งานติดขัด</small><b>{tasks.filter(i=>i.status==='blocked').length}</b></div><div><small>เรื่องรอตัดสินใจ</small><b>{decisions.length}</b></div><div><small>รับจริงเดือนนี้</small><b>{actual.count?money(actual.income)+' ฿':'ยังไม่มีข้อมูล'}</b></div></div>
 <div className="secretary-tabs" role="tablist" aria-label="ตารางสรุป"><button role="tab" aria-selected={tab==='team'} onClick={()=>setTab('team')}>ภาพรวมทุกฝ่าย</button><button role="tab" aria-selected={tab==='prospects'} onClick={()=>setTab('prospects')}>รายชื่อผู้เช่าเป้าหมาย</button><button role="tab" aria-selected={tab==='rent'} onClick={()=>setTab('rent')}>ค่าเช่ารายเจ้า</button></div>
 <div className="secretary-table-wrap" role="tabpanel"><table className="secretary-table"><thead><tr>{(tab==='team'?['ฝ่าย / หน้าที่หลัก','รอเริ่ม','รอตรวจ','ติดขัด','ผลงานล่าสุด / ขั้นถัดไป']:tab==='prospects'?['รายชื่อ','สถานะ','ยูนิต','ช่องทางที่บันทึก','ขั้นถัดไป']:['ผู้เช่า / พื้นที่','ยูนิต','ค่าเช่าตามทะเบียน','สถานะ','เงื่อนไข']).map(h=><th key={h}>{h}</th>)}</tr></thead><tbody>
 {tab==='team'&&groups.map(g=><tr key={g.d.id}><td><strong>{g.d.short}</strong><small>{g.d.outputs[0]}</small></td><td>{g.all.filter(i=>i.status==='todo').length}</td><td>{g.all.filter(i=>i.status==='review').length}</td><td>{g.all.filter(i=>i.status==='blocked').length}</td><td>{g.latest?<button className="secretary-source" onClick={()=>onTask(g.latest!)}>{g.latest.title}<ArrowUpRight size={13}/></button>:'ยังไม่มีผลงาน'}<small>{g.latest?.nextAction||'รอคำสั่งและข้อมูลที่เพียงพอ'}</small></td></tr>)}
 {tab==='prospects'&&prospects.map(i=><tr key={i.id}><td><strong>{i.title}</strong></td><td>{statuses.leads[i.status]}</td><td>{i.unit||'ยังไม่ระบุ'}</td><td>{i.contact||'ยังไม่มีข้อมูล'}</td><td>{i.nextAction||'รอตรวจข้อมูล'}<small>{i.source}</small></td></tr>)}
 {tab==='rent'&&tenants.map(i=><tr key={i.id}><td><strong>{i.title}</strong></td><td>{i.unit||'—'}</td><td>{money(i.amount)}{i.amount!==null?' บาท/เดือน':''}<small>{i.sourceStatus==='historical'?'ข้อมูลเดิม รอยืนยัน':i.sourceStatus==='confirmed'?'ข้อมูลยืนยัน':'ต้องตรวจที่มา'}</small></td><td>{statuses.tenants[i.status]}</td><td>{i.rentDetails||'ยังไม่มีข้อมูล'}</td></tr>)}
 {tab==='prospects'&&!prospects.length&&<tr><td colSpan={5}>ยังไม่มีรายชื่อในทะเบียน</td></tr>}
 </tbody></table></div>
 {tab==='prospects'&&!!prospectWork.length&&<details className="secretary-research"><summary>งานคัดกรองที่บันทึกแยกจากทะเบียน ({prospectWork.length} งาน)</summary>{prospectWork.map(i=><button key={i.id} onClick={()=>onTask(i)}>{i.title}<span>{statuses.tasks[i.status]} ↗</span></button>)}<small>เป็นผลงานวิจัย ยังไม่ใช่หลักฐานสนใจเช่าหรือการติดต่อ</small></details>}
 {tab==='rent'&&<p className="secretary-note">ค่าเช่าตามทะเบียนแยกจากยอดรับจริง ข้อมูลเก่าต้องตรวจสัญญาและหลักฐานรับเงินก่อนใช้ Forecast</p>}
 <div className="secretary-foot"><span>ผู้จัดการตรวจงาน → เลขาสรุป → BOSSตัดสินใจ</span><button className="btn primary" onClick={onAssign}>สั่งเลขาสรุปเพิ่มเติม</button></div></section>;
}
