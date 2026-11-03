import {readdirSync} from 'node:fs';
import {spawnSync} from 'node:child_process';
// Run each suite in an independent process so SQLite adapters, mock clocks,
// module hooks and mocked providers cannot leak between files.
let failed=false;
for(const file of readdirSync(new URL('../tests',import.meta.url)).filter(f=>/\.test\.(ts|mjs)$/.test(f)).sort()){
 const result=spawnSync(process.execPath,['--experimental-strip-types',new URL('../tests/'+file,import.meta.url).pathname],{stdio:'inherit',timeout:60000});
 if(result.error||result.status!==0){failed=true;console.error('FAILED:',file,result.error?.message??result.status);}
}
process.exitCode=failed?1:0;
