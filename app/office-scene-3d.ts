import * as T from 'three';
import {OrbitControls} from 'three/addons/controls/OrbitControls.js';
import {departments,type Dept} from '@/lib/company';
import {officeCharacter} from '@/lib/office';
import {officeClock} from '@/lib/office-time';
import {hero,pose} from '@/lib/office-3d-models';
import {chibiHero,chibiPose} from '@/lib/office-chibi';
import {buildCampus} from '@/lib/office-campus-building';
import {campusSky} from '@/lib/office-campus-sky';
import {buildNature} from '@/lib/office-campus-nature';
import {makeWalker,advanceWalker,campusSeats,sampleCampusPath,pathLength,campusDogPath,type OfficeZone} from '@/lib/office-campus-nav';
import type {OfficeRoomProps} from './office-room';
export type SceneSettings={zone:OfficeZone;quality:'low'|'medium'|'high';reduced:boolean};
export function createOfficeScene(host:HTMLDivElement,get:()=>OfficeRoomProps,paused:()=>boolean,settings:()=>SceneSettings,onZone:(zone:OfficeZone)=>void){
 const scene=new T.Scene();scene.background=new T.Color('#d2dfda');const camera=new T.PerspectiveCamera(40,1,.1,400),renderer=new T.WebGLRenderer({antialias:true});renderer.outputColorSpace=T.SRGBColorSpace;renderer.toneMapping=T.ACESFilmicToneMapping;renderer.toneMappingExposure=1.15;renderer.domElement.setAttribute('aria-label','สำนักงานสองชั้นและสวน 3D');host.insertBefore(renderer.domElement,host.firstChild);
 const controls=new OrbitControls(camera,renderer.domElement);controls.enableDamping=true;controls.minDistance=5;controls.maxDistance=75;controls.minPolarAngle=.15;controls.maxPolarAngle=Math.PI/2-.08;
 const ambient=new T.HemisphereLight('#e7f1ff','#71805a',2.1);scene.add(ambient);const sun=new T.DirectionalLight('#fff1ce',3);sun.position.set(-8,23,12);sun.shadow.mapSize.set(1024,1024);sun.shadow.camera.left=-17;sun.shadow.camera.right=17;sun.shadow.camera.top=17;sun.shadow.camera.bottom=-17;sun.shadow.camera.far=65;sun.shadow.bias=-.0005;scene.add(sun);const lamp=new T.PointLight('#ffddae',18,24);lamp.position.set(0,6,0);scene.add(lamp);
 const sky=campusSky();scene.add(sky.mesh);
 const building=buildCampus();scene.add(building.ground,building.upper,building.stairs,building.roof);const nature=buildNature();scene.add(nature.root);scene.add(nature.pet.root);
 // Preserve every original Boos mesh/proportion/color and its previous display scale.
 const boos=hero('boos');boos.root.scale.setScalar(.67);boos.root.position.set(-5.4,3.4,-6.05);pose(boos,'resting',0);scene.add(boos.root);
 const agents=departments.map((d,i)=>{const rig=chibiHero(officeCharacter(d.id).id);rig.root.scale.setScalar(.8);rig.root.position.set(campusSeats[d.id].x,0,campusSeats[d.id].z);rig.root.userData.department=d.id;scene.add(rig.root);const ring=new T.Mesh(new T.RingGeometry(.38,.42,32),new T.MeshBasicMaterial({color:'#76acff',side:T.DoubleSide}));ring.rotation.x=-Math.PI/2;ring.position.y=.04;rig.root.add(ring);return {d,rig,ring,walker:makeWalker(d.id,i),label:host.querySelector<HTMLElement>(`[data-agent="${d.id}"]`)!};});
 const docLabel=host.querySelector<HTMLElement>('[data-documents]')!,boosLabel=host.querySelector<HTMLElement>('[data-boos]')!;
 let width=host.clientWidth,height=host.clientHeight,currentZone:OfficeZone='overview',currentQuality='';
 const zones:Record<OfficeZone,{target:number[];eye:number[]}>={overview:{target:[1,1,2],eye:[25,24,31]},floor1:{target:[0,.7,-2.5],eye:[13,13,17]},floor2:{target:[0,4.1,-3],eye:[13,17,17]},garden:{target:[1,.3,7],eye:[20,20,27]}};
 function reset(){const v=zones[settings().zone],target=new T.Vector3(...v.target as [number,number,number]),offset=new T.Vector3(...v.eye as [number,number,number]).sub(target);offset.multiplyScalar(Math.max(1,1.2/(width/height)));camera.position.copy(target).add(offset);controls.target.copy(target);controls.update();}
 function applyZone(zone:OfficeZone){currentZone=zone;building.ground.visible=zone!=='floor2';building.upper.visible=zone==='overview'||zone==='floor2';building.roof.visible=zone==='overview';building.stairs.visible=zone!=='garden';nature.root.visible=zone==='overview'||zone==='garden';boos.root.visible=zone==='overview'||zone==='floor2';boosLabel.hidden=!boos.root.visible;docLabel.hidden=zone!=='floor2';reset();}
 const resize=new ResizeObserver(()=>{width=host.clientWidth;height=host.clientHeight;camera.aspect=width/height;camera.updateProjectionMatrix();renderer.setSize(width,height,false);});resize.observe(host);reset();
 const boxes:{x:number;y:number;w:number;h:number}[]=[];
 function label(el:HTMLElement,p:T.Vector3){
  const v=p.project(camera),w=el.offsetWidth,h=el.offsetHeight,ax=(v.x*.5+.5)*width,ay=(-v.y*.5+.5)*height;
  let best={x:Math.max(w/2+6,Math.min(width-w/2-6,ax)),y:Math.max(h+6,Math.min(height-12,ay)),score:Infinity};
  // Prefer directly above the head; spread nearby labels only when necessary.
  for(let row=0;row<8;row++)for(const col of [0,-1,1,-2,2,-3,3]){
   const x=Math.max(w/2+6,Math.min(width-w/2-6,ax+col*(w+8))),y=Math.max(h+6,Math.min(height-12,ay-row*(h+8)));
   const overlaps=boxes.filter(b=>Math.abs(b.x-x)<(b.w+w)/2+5&&y>b.y-b.h-5&&y-h<b.y+5).length;
   const score=overlaps*100000+Math.abs(x-ax)+Math.abs(y-ay)*1.4;
   if(score<best.score)best={x,y,score};
  }
  boxes.push({x:best.x,y:best.y,w,h});el.style.left=best.x+'px';el.style.top=best.y+'px';
  const dx=ax-best.x,dy=ay-best.y+8;el.style.setProperty('--leader-height',Math.hypot(dx,dy)+'px');el.style.setProperty('--leader-angle',Math.atan2(-dx,dy)+'rad');el.dataset.anchor=[ax,ay].join(',');
 }


 const ray=new T.Raycaster(),pointer=new T.Vector2();let down={x:0,y:0};const pointerDown=(e:PointerEvent)=>down={x:e.clientX,y:e.clientY};const pointerUp=(e:PointerEvent)=>{if(Math.hypot(e.clientX-down.x,e.clientY-down.y)>6)return;const rect=renderer.domElement.getBoundingClientRect();pointer.set((e.clientX-rect.left)/rect.width*2-1,-(e.clientY-rect.top)/rect.height*2+1);ray.setFromCamera(pointer,camera);const candidates:T.Object3D[]=agents.filter(a=>a.rig.root.visible).map(a=>a.rig.root);if(building.upper.visible)candidates.push(building.documentTray);const hit=ray.intersectObjects(candidates,true)[0];if(hit){let o:T.Object3D|null=hit.object;while(o&&!o.userData.department&&!o.userData.documents)o=o.parent;if(o?.userData.department)get().onSelect(o.userData.department);if(o?.userData.documents)get().onDocuments();}};
 renderer.domElement.addEventListener('pointerdown',pointerDown);renderer.domElement.addEventListener('pointerup',pointerUp);const lost=(e:Event)=>{e.preventDefault();host.dataset.context='lost';};renderer.domElement.addEventListener('webglcontextlost',lost);
 let frame=0,last=performance.now(),time=0,dogDistance=0,disposed=false;
 function animate(){if(disposed)return;const now=performance.now(),dt=Math.min((now-last)/1000,.5);last=now;const s=settings(),clock=officeClock(),delta=paused()||document.hidden?0:dt;time+=delta;if(s.zone!==currentZone)applyZone(s.zone);if(currentQuality!==s.quality){currentQuality=s.quality;renderer.setPixelRatio(Math.min(devicePixelRatio,s.quality==='high'?1.7:s.quality==='medium'?1.2:.8));renderer.shadowMap.enabled=s.quality!=='low';sun.castShadow=s.quality!=='low';sun.shadow.mapSize.set(s.quality==='high'?2048:1024,s.quality==='high'?2048:1024);if(sun.shadow.map){sun.shadow.map.dispose();sun.shadow.map=null;}}
 const palette=sky.update(clock,time);host.dataset.sky=JSON.stringify(palette);
 const nightFactor=clock.darkness/.48;(scene.background as T.Color).set('#d2dfda').lerp(new T.Color('#202d38'),nightFactor);ambient.intensity=2.1-nightFactor*1.1;sun.intensity=3-nightFactor*2.3;lamp.intensity=nightFactor*22;sun.color.set(clock.hour>=16&&clock.hour<19?'#ffc58b':'#fff1ce');controls.update();for(const group of [building.ground,building.upper])for(const object of group.children){if(object.position.z<-6.75&&object.position.y>.1)object.visible=camera.position.z>-5;if(object.position.x<-7.8&&object.position.y>.1)object.visible=camera.position.x>-7;}boxes.length=0;
 const snapshots:Record<string,unknown>={};for(const a of agents){const result=advanceWalker(a.walker,a.d.id,delta,clock.open,!!get().active[a.d.id]);const stairY=result.x>8.1&&result.z<.4&&result.z>-5.8?Math.ceil((.4-result.z)/6.2*16)/16*3.4:result.y;a.rig.root.position.set(result.x,stairY,result.z);a.rig.root.rotation.y=result.angle;chibiPose(a.rig,result.mode,time);a.rig.root.visible=currentZone==='overview'||(currentZone==='floor1'&&result.y<1.7&&result.z<1.6)||(currentZone==='floor2'&&result.y>=1.7)||(currentZone==='garden'&&result.z>=1.6);a.label.hidden=!a.rig.root.visible;a.ring.visible=get().selected===a.d.id;a.label.dataset.pose=result.mode;a.label.dataset.world=[result.x,result.y,result.z].map(v=>v.toFixed(3)).join(',');if(a.rig.root.visible){const p=a.rig.root.position.clone();p.y+=2.05;label(a.label,p);const pick=a.rig.root.position.clone();pick.y+=1.2;pick.project(camera);a.label.dataset.pick=[(pick.x*.5+.5)*width,(-pick.y*.5+.5)*height].join(',');}snapshots[a.d.id]={...result,visible:a.rig.root.visible};}
 docLabel.hidden=currentZone!=='floor2';boosLabel.hidden=!boos.root.visible;
 if(boos.root.visible){label(boosLabel,new T.Vector3(-5.4,5.3,-6.05));if(!docLabel.hidden)label(docLabel,new T.Vector3(-6.45,4.65,-4.75));}
 const natural=nature.animate(time,clock.night,s.quality);if(clock.open)dogDistance+=delta*(time%18<10?1.1:1.9);const dp=clock.open?sampleCampusPath(campusDogPath,dogDistance%pathLength(campusDogPath)):{x:-7,y:0,z:3,angle:0};nature.pet.root.visible=currentZone==='overview'||(currentZone==='floor1'&&dp.z<1.6)||(currentZone==='garden'&&dp.z>=1.6);nature.pet.root.position.set(dp.x,0,dp.z);nature.pet.root.rotation.y=dp.angle-Math.PI/2;nature.pet.root.scale.y=clock.open?.75:.45;nature.pet.legs.forEach((l,i)=>l.rotation.z=clock.open?Math.sin(time*9+i*Math.PI)*.35:0);nature.pet.tail.rotation.y=clock.open?Math.sin(time*7)*.4:0;
 building.billiardBalls.forEach((b,i)=>{if(i===0)b.position.x=4.9+Math.sin(time*.7)*.25;});building.cue.rotation.y=.45+Math.sin(time*.7)*.04;
 renderer.render(scene,camera);host.dataset.frames=String(renderer.info.render.frame);host.dataset.zone=currentZone;host.dataset.period=clock.open?'open':'sleep';host.dataset.hour=String(clock.hour);host.dataset.fly=natural.fly.join(',');host.dataset.fall=String(natural.fall);host.dataset.animals=JSON.stringify(natural.animals);host.dataset.fish=natural.fish.join(',');host.dataset.water=String(natural.water);host.dataset.animal=natural.animal.join(',');host.dataset.fireflies=String(natural.flies);host.dataset.dog=[dp.x,dp.z].join(',');host.dataset.triangles=String(renderer.info.render.triangles);host.dataset.quality=s.quality;frame=requestAnimationFrame(animate);}
 animate();
 return {zoom:(factor:number)=>{camera.position.sub(controls.target).multiplyScalar(factor).add(controls.target);controls.update();},reset,focus:(dept:Dept)=>{const a=agents.find(a=>a.d.id===dept)!;const p=a.rig.root.position;const zone:OfficeZone=p.y>1.7?'floor2':p.z>1.6?'garden':'floor1';onZone(zone);},dispose:()=>{disposed=true;cancelAnimationFrame(frame);resize.disconnect();controls.dispose();renderer.domElement.removeEventListener('pointerdown',pointerDown);renderer.domElement.removeEventListener('pointerup',pointerUp);renderer.domElement.removeEventListener('webglcontextlost',lost);scene.traverse(o=>{if(o instanceof T.Mesh){o.geometry.dispose();for(const m of Array.isArray(o.material)?o.material:[o.material]){for(const v of Object.values(m))if(v instanceof T.Texture)v.dispose();m.dispose();}}});renderer.dispose();renderer.domElement.remove();}};
}
