import * as T from 'three';
import {hero,pose,type Rig,ball} from './office-3d-models';
// Rebuild proportions on the original generated rig; Boos never enters this function.
export function chibiHero(id:string):Rig{
 if(id==='boos')throw new Error('Boos must retain the original rig');
 const rig=hero(id);for(const child of rig.body.children){if(child===rig.head||rig.arms.includes(child as T.Group)||rig.legs.includes(child as T.Group))continue;child.position.y=child.position.y*.7+.10;child.scale.y*=.74;if(id==='hulk')child.scale.x*=.8;}
 rig.head.position.y=1.60;rig.head.scale.set(1.7,1.52,1.72);
 for(const a of rig.arms){a.position.y=1.13;a.position.x*=.92;a.scale.set(.95,.68,1.1);ball(a,id==='hulk'?'#77a64d':id==='iron-man'?'#ae2f32':id==='spider-man'?'#b82e3b':'#35476b',0,-.57,0,.15,1,1,1);}
 for(const l of rig.legs){l.position.y=.65;l.scale.set(1,.74,1.12);const boot=l.children[1];ball(boot,id==='hulk'?'#77a64d':id==='spider-man'?'#b82e3b':'#303b4a',0,-.31,.10,.16,1, .75,1.3);}
 rig.root.userData.chibi=true;return rig;
}
export function chibiPose(r:Rig,mode:string,t:number){pose(r,['gaming','meeting','billiards'].includes(mode)?'reading':mode,t*.72);r.body.position.y=mode==='walking'?Math.abs(Math.sin(t*8))*.022:-.055;
 if(mode==='gaming'){r.paper.visible=false;r.arms.forEach((a,i)=>a.rotation.x=-.9+Math.sin(t*7+i)*.07);}
 if(mode==='billiards'){r.paper.visible=false;r.body.rotation.x=.25;r.arms[1].rotation.x=-1.1+Math.sin(t*2)*.1;}
 if(mode==='meeting'){r.paper.visible=true;r.head.rotation.y=Math.sin(t*.6)*.15;}else r.head.rotation.y=0;
}
