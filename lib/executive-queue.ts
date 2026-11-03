import type {Item} from './company';
import {executiveText} from './executive-text';
const ids=(s:string)=>s.match(/(?:mcp-|web-ai-)[a-zA-Z0-9_-]+/g)??[];
export const isSystemLog=(i:Item)=>i.id==='mcp-3b6f5ea2-2d29-4cc7-88de-054248fa1c67'||/บันทึกรอบ(?:ทำงาน|อัตโนมัติ)|บันทึกการทำงานอัตโนมัติ/.test(i.title);
export function executiveTitle(i:Item){return executiveText(i.title,150).replace(/\s*·\s*\d{4}-\d{2}-\d{2}/g,'').replace(/ผู้จัดการวางงานเอง\s*·\s*/g,'').trim()||'สรุปงาน';}
export function executivePriority(a:Item,b:Item){const rank={high:0,medium:1,low:2};return rank[a.priority]-rank[b.priority]||(a.due||'9999').localeCompare(b.due||'9999')||(b.updatedAt??'').localeCompare(a.updatedAt??'');}
function topic(i:Item){if(i.category.startsWith('autonomy:'))return i.category.split(':').slice(0,2).join(':');return executiveTitle(i).replace(/\d{1,2}[–\-/.]\d{1,2}|\d{1,4}|\s|[·:]/g,'');}
export function executiveQueue(items:Item[]){
 const tasks=items.filter(i=>i.kind==='tasks'&&!isSystemLog(i));
 const byId=new Map(tasks.map(i=>[i.id,i]));
 const secretary=tasks.filter(i=>i.department==='secretary'&&i.result&&['review','done'].includes(i.status));
 const ready=secretary.filter(i=>{
  if(i.reviewSources)return i.reviewSources.length>0&&i.reviewSources.every(source=>{const p=byId.get(source.id);return p?.department==='director'&&p.version===source.version&&!!p.result&&['review','done'].includes(p.status);});
  // Legacy records store their real source links in the report rather than handoff metadata.
  return ids(i.description+'\n'+i.result).some(id=>{const parent=byId.get(id);return parent?.department==='director'&&!!parent.result&&['review','done'].includes(parent.status);});
 }).sort(executivePriority);
 const latest=new Map<string,Item>();for(const i of [...ready].sort((a,b)=>(b.updatedAt??'').localeCompare(a.updatedAt??'')))if(!latest.has(topic(i)))latest.set(topic(i),i);
 const readyIds=new Set(ready.map(i=>i.id));
 const latestIds=new Set([...latest.values()].map(i=>i.id));
 const approvals=items.filter(i=>i.kind==='approvals'&&i.status==='pending').sort(executivePriority);
 return {review:ready.filter(i=>i.status==='review'&&i.category!=='executive:approval'&&latestIds.has(i.id)),approvals:[...approvals,...ready.filter(i=>i.category==='executive:approval'&&i.status==='review'&&latestIds.has(i.id))].sort(executivePriority),summaries:ready.filter(i=>i.status==='done'&&latestIds.has(i.id)),history:ready.filter(i=>!latestIds.has(i.id)),internal:tasks.filter(i=>!readyIds.has(i.id)),total:ready.length+approvals.length};
}
