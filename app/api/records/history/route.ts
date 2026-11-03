import {actor,json} from '@/lib/http';
import {db} from '@/lib/store';
export async function GET(request:Request){
 if(!actor(request))return json({error:'กรุณาเข้าสู่ระบบ'},401);
 const id=new URL(request.url).searchParams.get('id');if(!id||id.length>100)return json({error:'ระบุงาน'},400);
 const rows=await db().prepare("SELECT version,payload,saved_at AS savedAt FROM record_revisions WHERE kind='tasks' AND record_id=? ORDER BY version DESC LIMIT 100").bind(id).all<{version:number;payload:string;savedAt:string}>();
 return json({items:rows.results.map(r=>({...r,payload:JSON.parse(r.payload)}))});
}
