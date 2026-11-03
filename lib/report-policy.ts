import {z} from 'zod';
export const REPORT_TO='sutee.arw@gmail.com';
export const reportSettingsSchema=z.object({enabled:z.boolean(),repeatHours:z.number().int().min(24).max(720).nullable()}).strict();
export type ReportSettings=z.infer<typeof reportSettingsSchema>;
export function reportDue(lastSeen:string|null,settings:ReportSettings,now=Date.now()){
 const seen=lastSeen?Date.parse(lastSeen):NaN;if(!settings.enabled||!Number.isFinite(seen)||now-seen<86400000)return null;
 const n=settings.repeatHours===null?0:Math.floor((now-seen-86400000)/(settings.repeatHours*3600000));
 return lastSeen+':'+n;
}
