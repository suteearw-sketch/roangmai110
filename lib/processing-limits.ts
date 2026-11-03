import {env} from 'cloudflare:workers';
export function processingLimits(){
 const integer=(s:string|undefined,fallback:number,max:number)=>s&&/^\d+$/.test(s)?Math.min(max,Number(s)):fallback;
 return {dailyCalls:integer(env.AI_DAILY_CALL_LIMIT,0,1000),concurrency:Math.max(1,integer(env.AI_MAX_CONCURRENCY,2,4)),outputTokens:Math.max(256,integer(env.AI_MAX_OUTPUT_TOKENS,7000,16000))};
}
