import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(s,c,n){try{return n(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return n(s+'.ts',c);throw e;}}});
const {prospectRows}=await import('../lib/prospect-table.ts');
const base={kind:'tasks',department:'marketing',status:'review',title:'ตรวจแบรนด์ใหม่',updatedAt:'2026-10-27',nextAction:''};
test('combines current marketing research and register with provenance and unknown categories',()=>{
 const first={...base,id:'task-1',result:'|ราย|ช่องทางพบจริง/บทบาท|ข้อจำกัด|\n|---|---|---|\n|Ochaya|Sales@ochaya.co.th 02-726-5836|แฟรนไชส์ ไม่ใช่ตอบรับเช่า|'};
 const latest={...base,id:'task-2',updatedAt:'2026-10-28',result:'|ลำดับ|ชื่อร้าน|ข้อมูลติดต่อ|ประเภทธุรกิจ|\n|---|---|---|---|\n|1|Ochaya|new@example.com|เครื่องดื่ม|'};
 const result=prospectRows([first,latest,{...base,id:'lead',kind:'leads',title:'ร้าน B',contact:'',category:'',status:'target'}] as any);
 assert.equal(result.rows.length,2);const row=result.rows.find(r=>r.name==='Ochaya')!;assert.equal(row.source.id,'task-2');assert.match(row.contact,/new@example.com/);assert.equal(row.business,'เครื่องดื่ม');assert.equal(result.rows.find(r=>r.name==='ร้าน B')!.business,'');
});
test('does not turn campaign tables or evidence tables into stores and keeps legacy evidence available',()=>{
 const result=prospectRows([{...base,id:'a',title:'ตารางโพสต์',result:'|ชื่อร้าน|ช่องทาง|\n|---|---|\n|ไม่ใช่ร้านเป้าหมาย|https://example.com|'}, {...base,id:'b',result:'|หลักฐาน|ข้อค้นพบ|\n|---|---|\n|E1|ข้อมูลย่าน|'}, {...base,id:'c',title:'คัดกรอง PETClub สำหรับ G2',result:'ติดต่อ info@pet.example.com'}] as any);
 assert.equal(result.rows.length,1);assert.equal(result.rows[0].name,'PETClub');assert.equal(result.rows[0].source.id,'c');assert.equal(result.unstructured[0].id,'b');
});
