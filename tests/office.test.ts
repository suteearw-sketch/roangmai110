import {registerHooks} from 'node:module';
import {test} from 'node:test';
import assert from 'node:assert/strict';
registerHooks({resolve(s,c,n){if(s==='cloudflare:workers')return n(new URL('./env.ts',import.meta.url).href,c);if(s.startsWith('@/'))return n(new URL('../'+s.slice(2)+'.ts',import.meta.url).href,c);try{return n(s,c);}catch(e){if(s.startsWith('.')&&!s.endsWith('.ts'))return n(s+'.ts',c);throw e;}}});
const {POST:preferences}=await import('../app/api/office/preferences/route.ts');
const {POST:queue}=await import('../app/api/ai/queue/route.ts');
const {allItems,state,saveItem,ensureSeed}=await import('../lib/store.ts');
const {officeTransfers,officeCharacter}=await import('../lib/office.ts');
const req=(path:string,body:unknown,auth=true,origin='https://hq.test')=>new Request('https://hq.test'+path,{method:'POST',headers:{...(auth?{'oai-authenticated-user-id':'test-owner'}:{}),origin,'Content-Type':'application/json'},body:JSON.stringify(body)});
await test('office preserves real handoffs and character preferences without invented work',async t=>{
 await ensureSeed();
 await t.test('rejects unauthorized and cross-origin avatar writes',async()=>{
  assert.equal((await preferences(req('/api/office/preferences',{department:'leasing',avatar:'tow'},false))).status,403);
  assert.equal((await preferences(req('/api/office/preferences',{department:'leasing',avatar:'tow'},true,'https://other.test'))).status,403);
 });
 await t.test('persists the fixed cast preference; rejects other and unknown names',async()=>{
  assert.equal((await preferences(req('/api/office/preferences',{department:'development',avatar:'captain-america'}))).status,200);
  const loaded=await state();assert.equal(loaded.officeAvatars?.development,'captain-america');assert.equal(officeCharacter('development',loaded.officeAvatars).id,'captain-america');
  assert.equal((await preferences(req('/api/office/preferences',{department:'development',avatar:'invalid'}))).status,400);
  assert.equal((await preferences(req('/api/office/preferences',{department:'development',avatar:'sun'}))).status,400);
  assert.equal(officeCharacter('marketing',{marketing:'invalid'}).id,'hulk');
 });
 await t.test('ordinary tasks and a proposed department name create no journey',async()=>{
  const loaded=await state();assert.deepEqual(officeTransfers(loaded),[]);
 });
 await t.test('one saved handoff creates one request; retry keeps original identity; completion creates reply',async()=>{
  const command={id:crypto.randomUUID(),department:'research',requestedBy:'marketing',prompt:'ขอขนาดพื้นที่เพื่อเตรียมสื่อ'};
  assert.equal((await queue(req('/api/ai/queue',command))).status,201);
  const id='web-ai-'+command.id;let loaded=await state();let task=loaded.items.find(i=>i.id===id)!;
  assert.equal(task.status,'todo');assert.equal(task.handoff?.from,'marketing');
  assert.equal(officeTransfers(loaded).length,1);assert.equal(officeTransfers(loaded)[0].to,'development');
  assert.equal((await queue(req('/api/ai/queue',command))).status,200);
  assert.equal(officeTransfers(await state()).length,1);
  assert.equal((await queue(req('/api/ai/queue',{...command,requestedBy:'director'}))).status,409);
  const {version,updatedAt,...plain}=task;await saveItem({...plain,status:'review',result:'ข้อมูลที่ยืนยันแล้วและข้อจำกัด'},version,'test-owner');
  const events=officeTransfers(await state());assert.equal(events.length,2);const reply=events.find(e=>e.type==='reply')!;assert.equal(reply.from,'development');assert.equal(reply.to,'marketing');
 });
 await t.test('same-department requests cannot enter the durable queue',async()=>{
  const id=crypto.randomUUID();assert.equal((await queue(req('/api/ai/queue',{id,department:'marketing',requestedBy:'marketing',prompt:'test'}))).status,400);
  assert.equal((await allItems()).some(i=>i.id==='web-ai-'+id),false);
 });
});
