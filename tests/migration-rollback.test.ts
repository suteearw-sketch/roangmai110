import {test} from 'node:test';
import assert from 'node:assert/strict';
import {DatabaseSync} from 'node:sqlite';
import {readFileSync,readdirSync} from 'node:fs';
test('rollback preserves extension fields and all history; restore refuses intervening writes',()=>{
 const sql=new DatabaseSync(':memory:');for(const f of readdirSync('drizzle').filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync('drizzle/'+f,'utf8'));
 const payload={id:'test',title:'ข้อมูลเดิม',kind:'tasks',status:'todo',result:'หลักฐานเดิม',department:'secretary',reviewSources:[{id:'manager',version:7}],contactDetails:{phone:'',evidence:'ยังไม่พบ'}};
 for(const id of ['untouched','edited'])sql.prepare('INSERT INTO records(kind,id,payload,version,created_at,updated_at) VALUES (?,?,?,?,?,?)').run('tasks',id,JSON.stringify({...payload,id}),3,'2026-11-02','2026-11-02');
 sql.exec(readFileSync('docs/rollback-office.sql','utf8'));
 const compatible=JSON.parse((sql.prepare("SELECT payload FROM records WHERE id='untouched'").get() as any).payload);assert.equal(compatible.reviewSources,undefined);assert.equal(compatible.result,payload.result);
 assert.equal((sql.prepare('SELECT count(*) AS n FROM office_rollback_payloads').get() as any).n,2);
 sql.exec("UPDATE records SET version=version+1,payload=json_set(payload,'$.result','งานใหม่') WHERE id='edited'");
 sql.exec(readFileSync('docs/restore-office.sql','utf8'));
 const untouched=JSON.parse((sql.prepare("SELECT payload FROM records WHERE id='untouched'").get() as any).payload);assert.deepEqual(untouched.reviewSources,payload.reviewSources);assert.equal(untouched.result,payload.result);
 const edited=JSON.parse((sql.prepare("SELECT payload FROM records WHERE id='edited'").get() as any).payload);assert.equal(edited.result,'งานใหม่');assert.equal(edited.reviewSources,undefined);
 assert((sql.prepare('SELECT count(*) AS n FROM record_revisions').get() as any).n>=3);sql.close();
});
