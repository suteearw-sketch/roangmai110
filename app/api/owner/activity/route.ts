import {actor,json,writeAllowed} from '@/lib/http';
import {db} from '@/lib/store';
export async function POST(request:Request){
 if(!writeAllowed(request))return json({error:'กรุณาใช้งานจากแอปนี้'},403);
 await db().prepare('INSERT INTO metadata(key,value) VALUES (?,?) ON CONFLICT(key) DO UPDATE SET value=excluded.value').bind('owner-last-seen',new Date().toISOString()).run();
 return json({ok:true});
}
