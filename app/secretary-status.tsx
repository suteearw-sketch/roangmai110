'use client';
import {useState,type FormEvent} from 'react';
import {Search,ArrowUpRight,FileCheck} from 'lucide-react';
import {secretaryStatus} from '@/lib/secretary-status';
import {department,statuses,type CompanyState,type Item} from '@/lib/company';
export function SecretaryStatus({data,onTask}:{data:CompanyState;onTask:(item:Item)=>void}){
 const [query,setQuery]=useState(''),[question,setQuestion]=useState('ตอนนี้ทุกฝ่ายถึงไหนแล้ว');const [limit,setLimit]=useState(8);
 const result=secretaryStatus(question,data.items);
 function ask(e:FormEvent){e.preventDefault();if(!query.trim())return;setQuestion(query.trim());setLimit(8);}
 function quick(q:string){setQuery(q);setQuestion(q);setLimit(8);}
 return <section className="secretary-status-desk"><div className="secretary-desk-title"><span className="secretary-desk-symbol"><FileCheck size={22}/></span><div><h3>ถามสถานะงานกับเลขา</h3><p>ค้นและสรุปจากทะเบียนทันที · ไม่ต้องรอบริการ AI</p></div></div>
 <form onSubmit={ask} className="secretary-question"><label className="sr-only" htmlFor="secretary-query">ถามสถานะงานจากทะเบียน</label><input id="secretary-query" value={query} onChange={e=>setQuery(e.target.value)} maxLength={300} placeholder="เช่น การเงินมีงานรอตรวจอะไรบ้าง"/><button className="btn primary" type="submit" disabled={!query.trim()}><Search size={15}/>ดูสถานะ</button></form>
 <div className="secretary-quick">{['ทุกฝ่ายถึงไหนแล้ว','การตลาดรอตรวจ','การเงินรอตรวจ','มีงานติดขัดอะไรบ้าง'].map(q=><button key={q} onClick={()=>quick(q)}>{q}</button>)}</div>
 <div className="secretary-answer" aria-live="polite"><strong>{question}</strong><p>ขอบเขต: {result.departments.length?result.departments.map(d=>department(d).short).join(' / '):'ทุกฝ่าย'} · งานทั้งหมด {result.total} งาน</p><div className="secretary-status-counts"><span>รอเริ่ม <b>{result.counts.todo}</b></span><span>กำลังทำตามทะเบียน <b>{result.counts.doing}</b></span><span>รอตรวจ <b>{result.counts.review}</b></span><span>ติดขัด <b>{result.counts.blocked}</b></span><span>ตรวจรับแล้ว <b>{result.counts.done}</b></span></div><small>“กำลังทำ” เป็นสถานะที่บันทึกในงาน ไม่ใช่การยืนยันว่า AI กำลังประมวลผลสด การวิเคราะห์เอกสารหรือคำถามทั่วไปต้องใช้บริการ AI</small></div>
 <div className="secretary-table-wrap"><table className="secretary-table"><thead><tr><th>ฝ่าย</th><th>งาน / หลักฐาน</th><th>สถานะ</th><th>ขั้นถัดไป</th></tr></thead><tbody>{result.matches.slice(0,limit).map(i=><tr key={i.id}><td>{department(i.department).short}</td><td><button className="secretary-source" onClick={()=>onTask(i)}>{i.title}<ArrowUpRight size={13}/></button>{i.result&&<small>มีผลงานบันทึกแล้ว · เปิดอ่านต้นฉบับ</small>}</td><td>{statuses.tasks[i.status]??i.status}</td><td>{i.nextAction||'ยังไม่ได้ระบุขั้นถัดไป'}</td></tr>)}{!result.matches.length&&<tr><td colSpan={4}>ไม่พบงานสถานะนี้ในขอบเขตที่เลือก</td></tr>}</tbody></table></div>{result.matches.length>limit&&<button className="btn secretary-more" onClick={()=>setLimit(limit+12)}>ดูเพิ่ม ({result.matches.length-limit} งาน)</button>}
 </section>;
}
