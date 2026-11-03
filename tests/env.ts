import {mock} from 'node:test';
// All server integration tests start during Bangkok work hours; boundary tests
// explicitly move this clock. No production or paid service is used.
mock.timers.enable({apis:['Date'],now:Date.parse('2026-11-02T05:00:00Z')});
import { DatabaseSync } from 'node:sqlite';
import { readFileSync, readdirSync } from 'node:fs';
const sql=new DatabaseSync(':memory:');
for(const file of readdirSync(new URL('../drizzle/',import.meta.url)).filter(f=>f.endsWith('.sql')).sort())sql.exec(readFileSync(new URL('../drizzle/'+file,import.meta.url),'utf8'));
class Statement {
 query:string;values:any[]=[];
 constructor(query:string){this.query=query;}
 bind(...values:any[]){const result=new Statement(this.query);result.values=values;return result;}
 async first(){return sql.prepare(this.query).get(...this.values)??null;}
 async all(){return {results:sql.prepare(this.query).all(...this.values),success:true,meta:{}};}
 async run(){const r=sql.prepare(this.query).run(...this.values);return {success:true,meta:{changes:Number(r.changes)}};}
}
let batches:Promise<unknown>=Promise.resolve();
export const env:{DB:any;OPENAI_API_KEY?:string;OPENAI_MODEL?:string;AI_WORKER_SECRET?:string;AI_WEB_SEARCH_ENABLED?:string;AI_AUTONOMY_ENABLED?:string;AI_DAILY_CALL_LIMIT?:string;AI_MAX_CONCURRENCY?:string;AI_MAX_OUTPUT_TOKENS?:string;REPORT_EMAIL_API_KEY?:string;REPORT_EMAIL_FROM?:string;BUCKET?:any}={AI_DAILY_CALL_LIMIT:'100',AI_MAX_CONCURRENCY:'4',DB:{prepare:(q:string)=>new Statement(q),batch:(statements:Statement[])=>{const result=batches.then(async()=>{sql.exec('BEGIN');try{const results=[];for(const s of statements)results.push(await s.run());sql.exec('COMMIT');return results;}catch(e){sql.exec('ROLLBACK');throw e;}});batches=result.catch(()=>{});return result;}}};
