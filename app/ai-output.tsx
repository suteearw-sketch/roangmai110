'use client';
import {officeCharacter} from '@/lib/office';
import {OfficeAvatar} from './office-avatar';
import { useEffect, useRef, useState } from 'react';
import { Download, X, ShieldCheck, AlertCircle, CheckCircle2, Info, RefreshCw } from 'lucide-react';
import {executiveText,executiveSummary} from '@/lib/executive-text';
import { department, type AiRuntime, type Dept } from '@/lib/company';

function LinkText({text}:{text:string}){
  const parts=text.split(/(https?:\/\/[^\s<>"\]]+)/g);
  return <span className="evidence-text">{parts.map((part,i)=>/^https?:\/\//.test(part)?<a key={i} href={part.replace(/[),.;]+$/,'')} target="_blank" rel="noopener noreferrer">{part}</a>:part)}</span>;
}
export function EvidenceText({text}:{text:string}){
 const lines=text.split('\n');const blocks=[];let i=0;
 const cells=(line:string)=>line.trim().replace(/^\|/,'').replace(/\|$/,'').split(/(?<!\\)\|/).map(s=>s.trim().replace(/\\\|/g,'|').replace(/\*\*/g,''));
 const separator=(line:string)=>/^\s*\|?\s*:?-{3,}:?\s*(\|\s*:?-{3,}:?\s*)+\|?\s*$/.test(line);
 while(i<lines.length){
  if(lines[i].includes('|')&&i+1<lines.length&&separator(lines[i+1])){const header=cells(lines[i]);i+=2;const rows=[];while(i<lines.length&&lines[i].includes('|')&&lines[i].trim()){rows.push(cells(lines[i]));i++;}blocks.push(<div className="output-table-scroll" key={'table-'+i}><table className="output-table"><thead><tr>{header.map((c,j)=><th key={j}><LinkText text={c}/></th>)}</tr></thead><tbody>{rows.map((row,j)=><tr key={j}>{header.map((_,k)=><td key={k}><LinkText text={row[k]??''}/></td>)}</tr>)}</tbody></table></div>);}
  else if(/^#{1,4}\s/.test(lines[i])){blocks.push(<h3 key={i}>{lines[i].replace(/^#{1,4}\s/,'')}</h3>);i++;}
  else {const start=i;const chunk=[];while(i<lines.length&&!(lines[i].includes('|')&&i+1<lines.length&&separator(lines[i+1]))&&!/^#{1,4}\s/.test(lines[i]))chunk.push(lines[i++]);blocks.push(<p key={start}><LinkText text={chunk.join('\n')}/></p>);}
 }
 return <div className="formatted-output">{blocks}</div>;
}
export function RuntimePanel({runtime,onTasks,onSecretary,onRefresh}:{runtime:AiRuntime;onTasks?:()=>void;onSecretary?:()=>void;onRefresh?:()=>Promise<void>}){
 const [checking,setChecking]=useState(false),[note,setNote]=useState('');
 async function refresh(){if(!onRefresh||checking)return;setChecking(true);setNote('');try{await onRefresh();setNote('ตรวจข้อมูลล่าสุดแล้ว');}catch{setNote('ตรวจสถานะไม่สำเร็จ ลองใหม่ได้');}finally{setChecking(false);}}
 return <section className={'runtime-panel runtime-service '+(runtime.ready?'is-ready':'is-waiting')} aria-label="สถานะบริการวิเคราะห์ AI">
  {runtime.ready?<CheckCircle2 size={19}/>:<Info size={19}/>}
  <div className="runtime-copy"><strong>{runtime.ready?'บริการวิเคราะห์ AI พร้อมใช้งาน':'บันทึกงานและอ่านผลงานได้ · บริการวิเคราะห์ AI ยังไม่เปิด'}</strong><p>{runtime.ready?'ระบบรับคำสั่งและส่งผลงานกลับให้BOSSตรวจ':'แนบเอกสารและเก็บคำสั่งไว้ได้ คำสั่งใหม่จะยังไม่ถูก AI วิเคราะห์จนกว่าจะเชื่อมบริการ'}</p>
  <div className="runtime-actions">{onSecretary&&<button className="btn" onClick={onSecretary}>ถามสถานะกับเลขา</button>}{onTasks&&<button className="btn" onClick={onTasks}>ดูงานและผลงาน</button>}{onRefresh&&<button className="btn" onClick={()=>void refresh()} disabled={checking}><RefreshCw size={13} className={checking?'spin':''}/>{checking?'กำลังตรวจ':'ตรวจสถานะอีกครั้ง'}</button>}</div>
  <details className="runtime-details"><summary>รายละเอียดการเชื่อมต่อและสิ่งที่ยังขาด</summary><div className="runtime-checks"><span>บริการ AI: {runtime.providerConfigured?'ตั้งค่าแล้ว':'ยังไม่มีคีย์และโมเดล'}</span><span>ตัวรับงาน: {runtime.workerOnline?'เชื่อมต่ออยู่':runtime.workerConfigured?'ขาดสัญญาณ':'ยังไม่ตั้งค่า'}</span><span>ค้นเว็บ: {runtime.webSearchEnabled?'เปิด':'ยังไม่เปิด'}</span></div><p>การเปิด AI อัตโนมัติต้องตั้งค่าบริการและตัวรับงานที่ระบบหลังบ้าน การตรวจสถานะไม่ได้สร้างคีย์หรือเชื่อมต่อแทน ห้ามส่งคีย์ผ่านแชตหรือแนบเป็นเอกสารงาน</p>{runtime.lastHeartbeat&&<small>สัญญาณล่าสุด {new Date(runtime.lastHeartbeat).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}</small>}</details>{note&&<small role="status">{note}</small>}</div>
 </section>;
}
export type OutputDocument={title:string;department:Dept;content:string;status?:string;nextAction?:string;updatedAt?:string;taskId?:string};
export function OutputViewer({document,onClose,onDetails}:{document:OutputDocument;onClose:()=>void;onDetails?:()=>void}){
  const ref=useRef<HTMLDialogElement>(null);
  useEffect(()=>{const el=ref.current;el?.showModal();return()=>el?.close();},[]);
  function download(){const text=[document.title,department(document.department).name,document.updatedAt??'',document.content,'',document.nextAction??''].join('\n');const url=URL.createObjectURL(new Blob([text],{type:'text/plain;charset=utf-8'}));const a=window.document.createElement('a');a.href=url;a.download='Roangmai110-'+document.department+'-'+new Date().toISOString().slice(0,10)+'.txt';a.click();setTimeout(()=>URL.revokeObjectURL(url),1000);}
  return <dialog ref={ref} className="output-viewer" aria-labelledby="output-title" onCancel={e=>{e.preventDefault();onClose();}}>
    <header className="output-toolbar"><div><small>โรงไม้110 · ผลงานสำหรับผู้บริหาร</small><h2 id="output-title">{executiveText(document.title,160)}</h2></div><div><button className="icon-button" onClick={onClose} aria-label="ปิดผลงานเต็มจอ"><X size={24}/></button></div></header>
    <article className="output-page"><div className="office-cast-profile"><OfficeAvatar id={officeCharacter(document.department).id}/><strong>{officeCharacter(document.department).name}</strong></div><div className="output-meta"><span>{department(document.department).name}</span><span>{document.status??'รอตรวจผลงาน'}</span>{document.updatedAt&&<span>{new Date(document.updatedAt).toLocaleString('th-TH',{timeZone:'Asia/Bangkok'})}</span>}</div>
    <EvidenceText text={executiveSummary(document.content)||'ยังไม่มีสรุปที่อ่านได้ กรุณาให้เลขาจัดสรุปใหม่'}/>{executiveText(document.content,Infinity)!==executiveSummary(document.content)&&<details className="output-more"><summary>รายละเอียดเพิ่มเติม</summary><EvidenceText text={executiveText(document.content,Infinity)}/></details>}
    {document.nextAction&&<div className="output-next"><h3>ขั้นถัดไป</h3><EvidenceText text={executiveText(document.nextAction,Infinity)}/></div>}
    </article>
  </dialog>;
}
