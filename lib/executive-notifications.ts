import {db,allItems} from './store';
import {executiveQueue} from './executive-queue';
export async function syncExecutiveNotifications(){
 const items=await allItems(),q=executiveQueue(items);
 for(const item of [...q.review,...q.summaries,...q.approvals.filter(i=>i.kind==='tasks')]){
  const sources=item.reviewSources??items.filter(i=>i.department==='director'&&(item.description+' '+item.result).includes(i.id)).map(i=>({id:i.id,version:i.version}));
  const guards=sources.map(()=>"EXISTS(SELECT 1 FROM records WHERE kind='tasks' AND id=? AND version=? AND json_extract(payload,'$.status') IN ('review','done') AND length(json_extract(payload,'$.result'))>0)");
  await db().prepare("INSERT OR IGNORE INTO notifications(id,record_id,kind,title,message,created_at,revision) SELECT ?,?,?,?,?,?,? WHERE EXISTS(SELECT 1 FROM records WHERE kind='tasks' AND id=? AND version=?)"+(guards.length?' AND '+guards.join(' AND '):'')).bind('secretary:'+item.id+':'+item.version,item.id,'tasks',item.title,'ผู้จัดการตรวจและเลขาคัดแล้ว · v'+item.version+' · '+item.nextAction.slice(0,200),item.updatedAt||new Date().toISOString(),item.version,item.id,item.version,...sources.flatMap(s=>[s.id,s.version])).run();
 }
}
