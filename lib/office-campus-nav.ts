import type {Dept} from './company';
export type CampusPoint={x:number;y:number;z:number};
export type OfficeZone='overview'|'floor1'|'floor2'|'garden';
export const floorHeight=3.4;
export const campusSeats:Record<Dept,CampusPoint>={director:{x:-6,y:0,z:-4.1},development:{x:-3.6,y:0,z:-4.1},finance:{x:-1.2,y:0,z:-4.1},marketing:{x:-6,y:0,z:-.7},secretary:{x:-3.6,y:0,z:-.7}};
export const nodes:Record<string,CampusPoint>={aisle:{x:1,y:0,z:-2.8},front:{x:1,y:0,z:.4},entry:{x:1,y:0,z:2.8},garden:{x:1,y:0,z:7},gardenEnd:{x:1,y:0,z:11},westEnd:{x:-7,y:0,z:11},westGarden:{x:-7,y:0,z:3},relax:{x:3,y:0,z:-2.8},billiards:{x:3,y:0,z:-4.4},gaming:{x:4.8,y:0,z:-.1},stairsBase:{x:9,y:0,z:.4},stairsTop:{x:9,y:3.4,z:-5.8},upperHall:{x:1,y:3.4,z:-5.8},meeting:{x:3,y:3.4,z:-4.6},boosDoor:{x:-3,y:3.4,z:-5.8},documents:{x:-5.7,y:3.4,z:-4.8}};
export const meetingSeats:CampusPoint[]=[{x:3,y:3.4,z:-3.7},{x:3,y:3.4,z:-2.4},{x:3,y:3.4,z:-1.1},{x:6,y:3.4,z:-3.7},{x:6,y:3.4,z:-2.4},{x:6,y:3.4,z:-1.1}];
export const solids=[{x:-7,z:-5.6,w:2,h:.85,level:0},{x:-4.6,z:-5.6,w:2,h:.85,level:0},{x:-2.2,z:-5.6,w:2,h:.85,level:0},{x:-7,z:-2.2,w:2,h:.85,level:0},{x:-4.6,z:-2.2,w:2,h:.85,level:0},{x:3.7,z:-5.3,w:3.1,h:1.6,level:0},{x:3.8,z:-4.4,w:1.4,h:4,level:3.4},{x:-6.8,z:-5.5,w:2.8,h:1.2,level:3.4},{x:-7.1,z:-3.1,w:.9,h:3.2,level:3.4},{x:-5.1,z:-2.4,w:.9,h:1.8,level:3.4}];
// Explicit portals connect rooms and the stairwell. Paths never shortcut between floors.
export function seatPath(dept:Dept):CampusPoint[]{const s=campusSeats[dept];return [s,{x:s.x,y:0,z:dept==='marketing'||dept==='secretary'?.4:-3},{x:1,y:0,z:dept==='marketing'||dept==='secretary'?.4:-3},nodes.aisle];}
export function excursion(dept:Dept,kind:'garden'|'relax'|'meeting'){
 const start=seatPath(dept);if(kind==='garden')return [...start,nodes.front,nodes.entry,nodes.garden,nodes.gardenEnd,nodes.westEnd,nodes.westGarden,{x:1,y:0,z:3},nodes.entry,nodes.front,nodes.aisle,...start.slice(0,-1).reverse()];
 if(kind==='relax')return [...start,nodes.relax,nodes.billiards,nodes.relax,{x:3,y:0,z:.4},nodes.gaming,{x:3,y:0,z:.4},nodes.relax,nodes.aisle,...start.slice(0,-1).reverse()];
 const i=Object.keys(campusSeats).indexOf(dept),s=meetingSeats[i];const upper=[nodes.front,{x:1,y:0,z:1.8},{x:9,y:0,z:1.8},nodes.stairsBase,nodes.stairsTop,{x:s.x,y:3.4,z:-5.8},s];return [...start,...upper,...upper.slice(0,-1).reverse(),nodes.aisle,...start.slice(0,-1).reverse()];
}
export function pathLength(points:CampusPoint[]){return points.slice(1).reduce((sum,p,i)=>sum+Math.hypot(p.x-points[i].x,p.y-points[i].y,p.z-points[i].z),0);}
export function sampleCampusPath(points:CampusPoint[],distance:number){for(let i=1;i<points.length;i++){const a=points[i-1],b=points[i],length=Math.hypot(b.x-a.x,b.y-a.y,b.z-a.z);if(length&&distance<=length){const f=Math.max(0,distance/length);return {x:a.x+(b.x-a.x)*f,y:a.y+(b.y-a.y)*f,z:a.z+(b.z-a.z)*f,angle:Math.atan2(b.x-a.x,b.z-a.z),segment:i};}distance-=length;}return {...points.at(-1)!,angle:Math.PI,segment:points.length-1};}
export type CampusWalker={distance:number;path:CampusPoint[];trip:number;wait:number;mode:string;hold:number;lastSegment:number};
export function makeWalker(dept:Dept,index:number):CampusWalker{return {distance:0,path:excursion(dept,'relax'),trip:index,wait:.8+index*1.5,mode:'resting',hold:0,lastSegment:0};}
export function advanceWalker(w:CampusWalker,dept:Dept,dt:number,open:boolean,active:boolean){
 const length=pathLength(w.path);if(w.distance===0&&(!open||active)){w.mode=open?'typing':'sleeping';return {...campusSeats[dept],angle:Math.PI,mode:w.mode};}
 if(w.wait>0){w.wait=Math.max(0,w.wait-dt);w.mode=open?'reading':'sleeping';return {...campusSeats[dept],angle:Math.PI,mode:w.mode};}
 const previous=sampleCampusPath(w.path,w.distance);if(w.hold>0){w.hold=Math.max(0,w.hold-dt);w.mode=previous.y>3?'meeting':previous.z<-3?'billiards':'gaming';return {...previous,angle:w.mode==='meeting'?(previous.x<4?Math.PI/2:-Math.PI/2):w.mode==='billiards'?Math.PI/2:Math.PI,mode:w.mode};}
 w.distance+=dt*.85;const p=sampleCampusPath(w.path,w.distance);w.mode='walking';
 if(p.segment!==w.lastSegment&&open&&!active){const point=w.path[p.segment-1];if((point.y>3&&point.z>-4.7)||(point.x===nodes.billiards.x&&point.z===nodes.billiards.z)||(point.x===nodes.gaming.x&&point.z===nodes.gaming.z))w.hold=5;w.lastSegment=p.segment;}
 if(w.distance>=length){w.distance=0;w.trip++;w.path=excursion(dept,(['relax','garden','meeting'] as const)[w.trip%3]);w.wait=6;w.mode=!open?'sleeping':active?'typing':'resting';return {...campusSeats[dept],angle:Math.PI,mode:w.mode};}
 return {...p,mode:w.mode};
}
export const campusDogPath=[nodes.front,{x:-.2,y:0,z:.4},{x:-.2,y:0,z:-3},nodes.aisle,nodes.front,nodes.entry,nodes.garden,nodes.gardenEnd,nodes.westEnd,nodes.westGarden,{x:1,y:0,z:3},nodes.entry,nodes.front];
