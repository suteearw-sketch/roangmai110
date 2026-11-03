import { test } from 'node:test';
import assert from 'node:assert/strict';
import { configuration,cycle } from '../scripts/ai-worker.mjs';
test('independent receiver validates configuration and does not use a visitor login',async()=>{
  assert.throws(()=>configuration({}),/RM110_SITE_URL/);
  assert.throws(()=>configuration({RM110_SITE_URL:'https://user:password@site.test'}),/HTTPS origin/);
  assert.throws(()=>configuration({RM110_SITE_URL:'https://site.test',RM110_SITE_BEARER:'test'}),/secret/);
  const config=configuration({RM110_SITE_URL:'https://site.test',RM110_SITE_BEARER:'test-site-access',RM110_WORKER_SECRET:'test-worker-secret-of-at-least-32-characters'});
  let calls=0;
  const result=await cycle(config,async(url,options)=>{
    calls++;assert.equal(String(url),'https://site.test/api/ai/worker');assert.equal(options.redirect,'error');
    assert.equal(options.headers['OAI-Sites-Authorization'],'Bearer test-site-access');assert.equal(options.headers.Cookie,undefined);
    return Response.json({processed:1,ready:true});
  });
  assert.equal(calls,1);assert.equal(result.processed,1);
  await assert.rejects(cycle(config,async()=>Response.json({error:'do not leak provider response'},{status:503})),/^Error: Receiver HTTP 503$/);
});
