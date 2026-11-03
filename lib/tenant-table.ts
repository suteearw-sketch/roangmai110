import type {Item} from './company';
const collator=new Intl.Collator('en',{numeric:true,sensitivity:'base'});
function range(unit:string){const m=unit.match(/^([A-Z]\d*)\/(\d+)(?:[–-](?:[A-Z]\d*\/)?(\d+))?$/i);return m?{zone:m[1],start:Number(m[2]),end:Number(m[3]??m[2])}:null;}
function name(item:Item){return item.title.split(' · ')[0].trim();}
export function tenantRows(items:Item[]){
 const rows=items.filter(i=>i.kind==='tenants');
 return rows.filter(row=>{const r=range(row.unit);return !r||!rows.some(other=>{if(other.id===row.id||name(other)!==name(row))return false;const o=range(other.unit);return o&&o.zone===r.zone&&o.start<=r.start&&o.end>=r.end&&(o.start<r.start||o.end>r.end);});}).sort((a,b)=>collator.compare(a.unit,b.unit)||a.title.localeCompare(b.title,'th'));
}
