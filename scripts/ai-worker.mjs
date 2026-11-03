import { pathToFileURL } from 'node:url';
import { setTimeout as delay } from 'node:timers/promises';

export function configuration(env=process.env){
  let site;try{site=new URL(env.RM110_SITE_URL??'');}catch{throw new Error('Set RM110_SITE_URL to the deployed private Site URL');}
  if(site.protocol!=='https:'||site.username||site.password||site.pathname!=='/'||site.search||site.hash)throw new Error('RM110_SITE_URL must be an HTTPS origin');
  if(!env.RM110_SITE_BEARER||!env.RM110_WORKER_SECRET||env.RM110_WORKER_SECRET.length<32)throw new Error('Set the Site service bearer and a worker secret of at least 32 characters in the service environment');
  return {url:new URL('/api/ai/worker',site),siteBearer:env.RM110_SITE_BEARER,workerSecret:env.RM110_WORKER_SECRET};
}
export async function cycle(config,fetcher=fetch){
  const response=await fetcher(config.url,{method:'POST',redirect:'error',headers:{
    'OAI-Sites-Authorization':'Bearer '+config.siteBearer,
    Authorization:'Bearer '+config.workerSecret,'Content-Type':'application/json',
  },body:'{}',signal:AbortSignal.timeout(35_000)});
  if(!response.ok)throw new Error('Receiver HTTP '+response.status);
  return response.json();
}
export async function main(){
  const config=configuration();let stopping=false,failures=0;
  process.on('SIGTERM',()=>{stopping=true;});process.on('SIGINT',()=>{stopping=true;});
  const once=process.argv.includes('--once');
  do{
    let wait=2000;
    try{const result=await cycle(config);failures=0;
      if(result.processed||once)console.log(JSON.stringify({at:new Date().toISOString(),processed:result.processed,ready:result.ready}));
    }catch(error){failures++;wait=Math.min(60_000,2000*2**Math.min(failures,5));
      // Never log request headers, configuration values, provider text or fetch stacks.
      console.error(JSON.stringify({at:new Date().toISOString(),error:error instanceof Error&&/^Receiver HTTP \d+$/.test(error.message)?error.message:'Receiver connection failed',retryAfterMs:wait}));
      if(once){process.exitCode=1;break;}
    }
    if(!once&&!stopping)await delay(wait);
  }while(!once&&!stopping);
}
if(process.argv[1]&&import.meta.url===pathToFileURL(process.argv[1]).href){
  main().catch(()=>{console.error('AI receiver cannot start: check the service environment');process.exitCode=1;});
}
