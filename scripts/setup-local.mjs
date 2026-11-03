import {mkdirSync,writeFileSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
import {fileURLToPath} from 'node:url';
const root=fileURLToPath(new URL('../',import.meta.url));
process.chdir(root);
mkdirSync('.sites-runtime',{recursive:true});
writeFileSync('.sites-runtime/local-db.json',JSON.stringify({name:'roangmai110-local',compatibility_date:'2026-05-15',d1_databases:[{binding:'DB',database_name:'site-creator-d1',database_id:'00000000-0000-4000-8000-000000000000',migrations_dir:'../drizzle'}]},null,2));
const result=spawnSync(process.execPath,['node_modules/wrangler/bin/wrangler.js','d1','migrations','apply','site-creator-d1','--local','--config','.sites-runtime/local-db.json','--persist-to','.wrangler/state'],{cwd:root,env:{...process.env,CI:'true',WRANGLER_SEND_METRICS:'false',WRANGLER_WRITE_LOGS:'false',WRANGLER_LOG_PATH:root+'.wrangler/logs',MINIFLARE_REGISTRY_PATH:root+'.wrangler/registry'},stdio:['ignore','inherit','inherit']});
if(result.error)throw result.error;process.exitCode=result.status??1;
