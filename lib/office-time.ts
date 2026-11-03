// Bangkok has no daylight-saving transition. This clock is shared by UI and worker.
export function officeClock(now=new Date()){
 const parts=new Intl.DateTimeFormat('en-GB',{timeZone:'Asia/Bangkok',hour:'2-digit',minute:'2-digit',hourCycle:'h23'}).formatToParts(now);
 const hour=Number(parts.find(p=>p.type==='hour')!.value),minute=Number(parts.find(p=>p.type==='minute')!.value);
 const time=hour+minute/60;
 const night=time<5||time>=19;
 // Continuous ambience by local civil time; not an assertion of sunrise at this location.
 const darkness=time<5?.48:time<7?.48*(7-time)/2:time<17?0:time<20?.48*(time-17)/3:.48;
 return {hour,minute,open:hour>=5,period:time<5?'กลางคืน':time<10?'เช้า':time<16?'กลางวัน':time<19?'เย็น':'กลางคืน',darkness,night};
}
