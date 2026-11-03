// World coordinates. All walking corridors are separated from the solid furniture.
export type Point={x:number;y:number};
export const desks={director:{x:195,y:285},marketing:{x:560,y:155},development:{x:820,y:155},finance:{x:790,y:420},secretary:{x:340,y:450}};
export const walkingRoutes={
 director:[{x:195,y:285},{x:195,y:340},{x:270,y:340},{x:270,y:390},{x:270,y:340},{x:195,y:340},{x:195,y:285}],
 marketing:[{x:560,y:155},{x:560,y:265},{x:470,y:265},{x:470,y:330},{x:470,y:265},{x:560,y:265},{x:560,y:155}],
 development:[{x:820,y:155},{x:820,y:265},{x:705,y:265},{x:705,y:325},{x:705,y:265},{x:820,y:265},{x:820,y:155}],
 finance:[{x:790,y:420},{x:790,y:355},{x:875,y:355},{x:875,y:310},{x:875,y:355},{x:790,y:355},{x:790,y:420}],
 secretary:[{x:340,y:450},{x:340,y:375},{x:370,y:375},{x:370,y:315},{x:370,y:375},{x:340,y:375},{x:340,y:450}],
};
export const dogRoute=[{x:420,y:300},{x:680,y:300},{x:680,y:440},{x:700,y:440},{x:700,y:510},{x:440,y:510},{x:440,y:440},{x:420,y:440},{x:420,y:300}];
export const furniture=[{x:100,y:165,w:160,h:65},{x:475,y:50,w:160,h:65},{x:735,y:50,w:160,h:65},{x:725,y:460,w:160,h:65},{x:255,y:495,w:155,h:55},{x:515,y:345,w:130,h:85}];
export function pathPoints(points:Point[]){return points.map(p=>`${p.x},${p.y}`).join(' ');}
