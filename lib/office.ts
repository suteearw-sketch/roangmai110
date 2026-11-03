import {z} from 'zod';
import {departments,type Dept,type CompanyState} from './company';

export const officeCharacters=[
 {id:'iron-man',name:'Iron Man',color:'#b33630',kind:'hero',number:''},
 {id:'captain-america',name:'Captain America',color:'#315c95',kind:'hero',number:''},
 {id:'thor',name:'Thor',color:'#647b91',kind:'hero',number:''},
 {id:'hulk',name:'Hulk',color:'#658e50',kind:'hero',number:''},
 {id:'spider-man',name:'Spider-Man',color:'#b43537',kind:'hero',number:''},
 {id:'black-panther',name:'Black Panther',color:'#353144',kind:'hero',number:''},
 {id:'black-widow',name:'Black Widow',color:'#313441',kind:'hero',number:''},
 {id:'hawkeye',name:'Hawkeye',color:'#615078',kind:'hero',number:''},
 {id:'kate-bishop',name:'Kate Bishop',color:'#78629e',kind:'hero',number:''},
 {id:'ms-marvel',name:'Ms. Marvel',color:'#31587a',kind:'hero',number:''},
 {id:'racer',name:'สปีด · รถแข่งแดง',color:'#e5332b',kind:'racer',number:'110'},
 {id:'tow',name:'บัดดี้ · รถลากน้ำตาล',color:'#a76c40',kind:'tow',number:''},
 {id:'coupe',name:'สกาย · รถสปอร์ตฟ้า',color:'#71b8e5',kind:'coupe',number:''},
 {id:'classic',name:'โค้ช · รถคลาสสิกน้ำเงิน',color:'#344f85',kind:'classic',number:'01'},
 {id:'fins',name:'มิ้นท์ · รถวินเทจเขียว',color:'#71b8a4',kind:'fins',number:''},
 {id:'lowrider',name:'ไวโอเล็ต · รถม่วง',color:'#9561b1',kind:'lowrider',number:''},
 {id:'compact',name:'โกลด์ · รถเล็กเหลือง',color:'#f4ce60',kind:'compact',number:''},
 {id:'forklift',name:'บลู · รถช่างฟ้า',color:'#6f9fce',kind:'forklift',number:''},
 {id:'van',name:'โอลีฟ · รถตู้เขียว',color:'#8fae70',kind:'van',number:''},
 {id:'sun',name:'ซัน · รถแข่งเหลือง',color:'#edbd35',kind:'racer',number:'08'},
 {id:'person',name:'ทีมงานแบบเดิม',color:'#ad7953',kind:'person',number:''},
] as const;
export type OfficeAvatarId=typeof officeCharacters[number]['id'];
export const defaultOfficeAvatars:Record<Dept,OfficeAvatarId>={director:'iron-man',marketing:'hulk',development:'captain-america',finance:'thor',secretary:'spider-man'};
export const avatarPreferenceSchema=z.object({department:z.enum(departments.map(d=>d.id) as [Dept,...Dept[]]),avatar:z.enum(officeCharacters.map(a=>a.id) as [OfficeAvatarId,...OfficeAvatarId[]])}).strict();
// Fixed visual cast; legacy saved preferences and all department identities remain intact.
export function officeCharacter(dept:Dept,_preferences?:CompanyState['officeAvatars']){return officeCharacters.find(c=>c.id===defaultOfficeAvatars[dept])!;}
export type OfficeTransfer={id:string;from:Dept;to:Dept;title:string;at:string;type:'request'|'reply'|'assignment';taskId:string};
// A destination is never guessed from a task title or a character's animation.
export function officeTransfers(data:Pick<CompanyState,'items'|'runs'>):OfficeTransfer[]{
 const events:OfficeTransfer[]=[];
 for(const task of data.items){
  if(task.kind!=='tasks'||!task.handoff||task.department===task.handoff.from)continue;
  events.push({id:task.id+':request',from:task.handoff.from,to:task.department,title:task.title,at:task.handoff.requestedAt,type:'request',taskId:task.id});
  if(task.result&&['review','done'].includes(task.status)&&task.updatedAt)events.push({id:task.id+':reply',from:task.department,to:task.handoff.from,title:task.title,at:task.updatedAt,type:'reply',taskId:task.id});
 }
 for(const run of data.runs){
  if(run.status!=='complete'||!run.result)continue;
  run.result.tasks.forEach((proposal,index)=>{
   const task=data.items.find(t=>t.kind==='tasks'&&t.id===`ai-${run.id}-${index}`);
   if(!task||task.department===run.department||task.handoff)return;
   events.push({id:task.id+':assignment',from:run.department,to:task.department,title:task.title,at:task.updatedAt||run.createdAt,type:'assignment',taskId:task.id});
  });
 }
 return events.sort((a,b)=>b.at.localeCompare(a.at));
}

export const marvelCharacters=officeCharacters.filter(c=>c.kind==='hero');
