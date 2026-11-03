import type {Item} from './company';
export type ProspectRow={name:string;contact:string;business:string;status:string;source:Item;notes:string};
const clean=(s:string)=>s.replace(/\[([^\]]+)\]\((https?:\/\/[^)]+)\)/g,'$1 $2').replace(/[*`]/g,'').trim();
const key=(s:string)=>s.normalize('NFKC').toLowerCase().replace(/[’‘']/g,'').replace(/[^\p{L}\p{N}]/gu,'');
function contacts(s:string){const found=s.match(/https?:\/\/[^\s|<>"）)]+|[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}|0\d[\d -]{6,14}\d|(?:LINE\s*:?\s*)?@[\w.-]+/gi)??[];return [...new Set(found)].join(' · ');}
export function prospectRows(items:Item[]){
 const rows:ProspectRow[]=[], covered=new Set<string>();
 const works=items.filter(i=>i.kind==='tasks'&&i.department==='marketing'&&i.result&&!/(อีเวนต์|ผู้จัด|เทศกาล|คอนเทนต์|โพสต์|ซีรีส์|Hook|กิจกรรม)/i.test(i.title)).sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??''));
 for(const source of works){
  const lines=source.result.split('\n');let added=false;
  for(let i=0;i<lines.length-1;i++){
   const cells=(s:string)=>s.trim().replace(/^\||\|$/g,'').split('|').map(clean);
   if(!lines[i].trim().startsWith('|')||!/^\s*\|?\s*:?-{3}/.test(lines[i+1]))continue;
   const header=cells(lines[i]);const ni=header.findIndex(h=>/^(ราย|รายใหม่|แบรนด์|ชื่อร้าน|ชื่อแบรนด์|ผู้ประกอบการ)(\s|\/|$)/.test(h));
   if(ni<0)continue;
   const ci=header.findIndex(h=>/ติดต่อ|ช่องทาง/.test(h));const bi=header.findIndex(h=>/ประเภทธุรกิจ|หมวดธุรกิจ/.test(h));
   for(let j=i+2;j<lines.length&&lines[j].trim().startsWith('|');j++){
    const row=cells(lines[j]);let name=(row[ni]??'').split(/\s[—–]\s/)[0].trim();
    if(!name||name.length>140||/^(รวม|หมายเหตุ|หลักฐาน|ข้อจำกัด)/.test(name))continue;
    rows.push({name,contact:ci>=0?contacts(row[ci]??''):'',business:bi>=0?row[bi]??'':'',status:'รายชื่อจากงานวิจัย',source,notes:row.filter((_,n)=>n!==ni).join('\n')});added=true;
   }
  }
  // Earlier research saved one brand per task rather than a table.
  if(!added){const match=source.title.match(/^คัดกรอง(?:ทำเล\s+)?(.+?)(?:สำหรับ|\s+และ)/);if(match){rows.push({name:match[1].trim(),contact:contacts(source.result),business:'',status:'รายชื่อจากงานวิจัย',source,notes:source.nextAction});added=true;}}
  if(added)covered.add(source.id);
 }
 for(const source of items.filter(i=>i.kind==='leads'))rows.push({name:source.title,contact:source.contact,business:source.category,status:source.status,source,notes:source.nextAction});
 const map=new Map<string,ProspectRow>();for(const row of rows){const k=key(row.name);if(row.source.kind==='leads'&&map.has(k)){const research=map.get(k)!;map.set(k,{...row,contact:row.contact||research.contact,business:row.business||research.business});continue;}if(!map.has(k))map.set(k,row);else{const old=map.get(k)!;if(!old.contact)old.contact=row.contact;if(!old.business)old.business=row.business;}}
 return {rows:[...map.values()].sort((a,b)=>a.name.localeCompare(b.name,'th')),unstructured:works.filter(w=>!covered.has(w.id))};
}
