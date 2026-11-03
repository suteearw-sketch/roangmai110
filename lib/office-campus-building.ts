import * as T from 'three';
import {box,ball} from './office-3d-models';
import {campusSeats,meetingSeats,floorHeight} from './office-campus-nav';
import {officeCharacter} from './office';
import {departments} from './company';
export function sign(parent:T.Object3D,text:string,x:number,y:number,z:number,width=2,color='#e6e5d9'){
 const canvas=document.createElement('canvas');canvas.width=768;canvas.height=128;const ctx=canvas.getContext('2d')!;ctx.font='600 48px sans-serif';ctx.fillStyle=color;ctx.textAlign='center';ctx.fillText(text,384,78);const texture=new T.CanvasTexture(canvas);texture.colorSpace=T.SRGBColorSpace;const m=new T.Mesh(new T.PlaneGeometry(width,width/6),new T.MeshBasicMaterial({map:texture,transparent:true,depthWrite:false}));m.position.set(x,y,z);parent.add(m);return m;
}
export function chair(parent:T.Object3D,x:number,y:number,z:number,rotation=0,color='#536f64'){
 const g=new T.Group();g.position.set(x,y,z);g.rotation.y=rotation;parent.add(g);box(g,color,0,.43,0,.66,.13,.58);box(g,color,0,.80,-.25,.66,.70,.12);box(g,'#333b40',0,.20,0,.07,.4,.07);for(const a of [0,Math.PI/2]){const m=box(g,'#333b40',0,.07,0,.62,.06,.06);m.rotation.y=a;}return g;
}
function desk(parent:T.Object3D,x:number,z:number,name:string){box(parent,'#c8ab7e',x,.84,z,2,.13,.85);for(const dx of [-.84,.84])box(parent,'#354849',x+dx,.40,z,.06,.8,.65);box(parent,'#252b33',x,.1+1,z-.08,.70,.48,.075);box(parent,'#769cad',x,1.11,z-.035,.62,.38,.015);box(parent,'#35434d',x,.93,z-.08,.06,.20,.06);box(parent,'#b1b5af',x,.925,z+.24,.55,.025,.19);box(parent,'#f3e4c4',x-.62,.925,z+.1,.35,.022,.4);sign(parent,name,x,.64,z+.45,1.6,'#233d3b');}
function glassPartition(parent:T.Object3D,x:number,doorZ:number){
 const bottom=-7,top=1,height=3.2,halfDoor=.72;
 const material=new T.MeshPhysicalMaterial({color:'#d6e7ed',transparent:true,opacity:.16,roughness:.12,metalness:.05,depthWrite:false,side:T.DoubleSide});
 for(const [start,end] of [[bottom,doorZ-halfDoor],[doorZ+halfDoor,top]]){const length=end-start;if(length<=0)continue;const pane=new T.Mesh(new T.BoxGeometry(.035,height,length),material);pane.position.set(x,height/2,(start+end)/2);parent.add(pane);for(const z of [start,end])box(parent,'#65757b',x,height/2,z,.055,height,.055);}
 for(const y of [.035,height])box(parent,'#65757b',x,y,-3,.06,.06,8);box(parent,'#65757b',x,height-.1,doorZ,.065,.1,halfDoor*2);
 // Door leaf is held open into the room; the corridor through the frame stays clear.
 const door=new T.Group();door.position.set(x,0,doorZ-halfDoor);door.rotation.y=Math.PI/2;parent.add(door);const pane=new T.Mesh(new T.BoxGeometry(.035,3.0,1.35),material);pane.position.set(0,1.52,.675);door.add(pane);for(const z of [0,1.35])box(door,'#65757b',0,1.52,z,.05,3.04,.05);for(const y of [.04,3.04])box(door,'#65757b',0,y,.675,.05,.05,1.4);box(door,'#aebbc0',.055,1.35,1.18,.06,.35,.04);
}
export function buildCampus(){const ground=new T.Group(),upper=new T.Group(),stairs=new T.Group(),roof=new T.Group();
 // Cutaway: rear walls and short side walls leave the front open, no fake backdrop.
 box(ground,'#727d75',0,-.18,-3,16.3,.35,8.4);box(ground,'#d4c0a1',0,.015,-3,16,.06,8);
 for(let z=-6.9;z<1;z+=.38)box(ground,'#b7a585',0,.051,z,16,.012,.013);
 box(ground,'#f2f1ec',0,1.6,-7.05,16.2,3.2,.15);box(ground,'#f2f1ec',-8.05,.75,-3,.15,1.5,8.2);box(ground,'#f2f1ec',8.05,.65,-3,.15,1.3,8.2);
 // Room divider has an open portal in the central aisle.
 glassPartition(ground,1.65,-2.8);
 for(const x of [-6,-3.6,-1.2,3.2,6.2]){box(ground,'#e0dac8',x,1.8,-6.94,1.9,1.3,.08);box(ground,'#a8c5c8',x,1.8,-6.88,1.74,1.12,.02);box(ground,'#ecdfc6',x,1.8,-6.85,.04,1.14,.02);}
 for(const d of departments){const s=campusSeats[d.id];desk(ground,s.x,s.z-.95,officeCharacter(d.id).name);chair(ground,s.x,0,s.z,Math.PI);}
 sign(ground,'TEAM STUDIO',-4,2.57,-6.9,3.2);sign(ground,'RELAX / PLAY',4.8,2.57,-6.9,3.2);
 // Snooker: green cloth, cushions, six pockets, balls and a usable cue.
 box(ground,'#73543c',5.25,.73,-4.5,3.1,.35,1.6);box(ground,'#32735d',5.25,.92,-4.5,2.83,.035,1.32);for(const x of [3.85,6.65])for(const z of [-5.2,-3.8]){box(ground,'#594a36',x,.35,z,.12,.7,.12);ball(ground,'#192e25',x,.95,z,.09,1,.25,1);}for(const z of [-5.17,-3.83])box(ground,'#926946',5.25,.96,z,3.05,.10,.10);for(const x of [3.77,6.73])box(ground,'#926946',x,.96,-4.5,.10,.10,1.5);
 const billiardBalls:T.Mesh[]=[];for(let i=0;i<7;i++)billiardBalls.push(ball(ground,['#eee9d5','#ae3835','#c49b3e','#373e4b'][i%4],4.6+i*.19,.99,-4.3+(i%2)*.22,.055));const cue=box(ground,'#c8a879',3.45,.95,-4.4,.035,.035,1.6);cue.rotation.y=.45;
 box(ground,'#293342',5.2,1.25,-1.6,2,.98,.10);box(ground,'#507496',5.2,1.25,-1.53,1.85,.82,.025);sign(ground,'PLAY / PAUSE',5.2,1.3,-1.5,1.5);box(ground,'#39483c',5.2,.50,-1.6,2.4,.18,.45);box(ground,'#1e232c',6,.72,-1.5,.25,.3,.25);chair(ground,4.8,0,-.1,Math.PI,'#5e7091');chair(ground,6.3,0,-.1,Math.PI,'#5e7091');box(ground,'#262b39',4.8,.65,-.4,.28,.08,.14);
 // Upper slab has a dedicated stair opening outside its east edge.
 upper.position.y=floorHeight;box(upper,'#c8b08b',0,-.1,-3,16,.20,8);box(upper,'#dfceb0',0,.025,-3,16,.045,8);box(upper,'#f2f1ec',0,1.6,-7.05,16,3.2,.14);box(upper,'#f2f1ec',-8,.65,-3,.13,1.3,8);box(upper,'#f2f1ec',8,.65,-3,.13,1.3,8);
 for(const x of [-6,-3.6,-1.2,3.2,6.2]){box(upper,'#b0cfd0',x,1.6,-6.94,1.7,1.05,.04);box(upper,'#e5dfcc',x,1.6,-6.9,.045,1.1,.04);}
 glassPartition(upper,1.3,-5.8);sign(upper,'BOSS / PRIVATE OFFICE',-4.6,2.8,-6.9,4.8);sign(upper,'MEETING ROOM',4.8,2.8,-6.9,3.4);
 box(upper,'#c2a174',-5.4,.88,-4.9,2.8,.16,1.2);for(const x of [-6.55,-4.25])box(upper,'#3e514a',x,.4,-4.9,.12,.8,1);chair(upper,-5.4,0,-6.05,0,'#344b42');box(upper,'#2d383a',-5.4,1.2,-4.9,.8,.48,.07);box(upper,'#8eaeba',-5.4,1.2,-4.945,.72,.40,.015);box(upper,'#e3ddcc',-4.5,1,-4.75,.4,.035,.45);
 // Lounge occupies the front half: sofa faces east toward the television.
 const sofa=new T.Group();sofa.position.set(-6.6,0,-1.5);sofa.rotation.y=Math.PI/2;upper.add(sofa);box(sofa,'#758e79',0,.4,0,3.2,.6,.85);box(sofa,'#516e59',0,.8,-.36,3.2,.7,.14);for(const x of [-1.55,1.55])box(sofa,'#516e59',x,.65,0,.16,.7,.85);for(const x of [-1,0,1])box(sofa,'#9fb3a0',x,.73,-.20,.75,.4,.15);
 box(upper,'#9b815b',-4.6,.43,-1.5,.85,.10,1.8);for(const z of [-2.1,-.9])box(upper,'#48564b',-4.6,.2,z,.65,.4,.06);
 const tv=new T.Group();tv.position.set(.45,0,-1.5);tv.rotation.y=-Math.PI/2;upper.add(tv);box(tv,'#283239',0,1.3,0,2.1,1.1,.12);box(tv,'#638797',0,1.3,.075,1.94,.94,.02);sign(tv,'ROANGMAI 110',0,1.3,.095,1.8);box(tv,'#57685e',0,.52,0,2.4,.16,.5);
 box(upper,'#bb9c73',4.5,.84,-2.4,1.4,.14,4);for(const z of [-3.7,-1.1])box(upper,'#3a4d47',4.5,.4,z,.8,.8,.12);
 for(const s of meetingSeats)chair(upper,s.x,0,s.z,s.x<4?Math.PI/2:-Math.PI/2,'#687e77');box(upper,'#25373e',4.5,1.65,-6.5,2.8,1.4,.1);sign(upper,'REVIEW / DECISIONS',4.5,1.7,-6.43,2.5);
 const documentTray=box(upper,'#bd9959',-6.45,.98,-4.75,.5,.08,.6);documentTray.userData.documents=true;for(let i=0;i<3;i++)box(documentTray,'#f6e8cc',0,.06+i*.018,0,.43,.015,.51);sign(upper,'DOCUMENTS',-6.45,1.35,-4.5,1.3);
 for(let i=0;i<16;i++){const height=(i+1)*floorHeight/16;box(stairs,'#b8ab90',9,height/2,.4-(i+.5)*6.2/16,1.6,height,6.2/16);}for(const x of [8.2,9.8]){for(let i=0;i<=8;i++){const y=i*floorHeight/8;box(stairs,'#4e665e',x,y+.5,.4-i*6.2/8,.045,1,.045);}const rail=box(stairs,'#4e665e',x,2.2,-2.7,.06,.06,7.07);rail.rotation.x=Math.atan(floorHeight/6.2);}
 box(stairs,'#c8b08b',8.5,floorHeight-.1,-6.2,3,.2,1);box(ground,'#c8b08b',8.5,-.04,.8,3,.08,2.8);
 // Narrow rear roof canopy gives a readable two-storey silhouette, leaving rooms cut away.
 box(roof,'#34504a',0,6.65,-6.7,16.5,.18,1);box(roof,'#34504a',-8.1,6.52,-3,.35,.14,8.5);
 return {ground,upper,stairs,roof,documentTray,billiardBalls,cue};
}
