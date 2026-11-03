// Original layered vector drawings, built for this office, not cropped reference assets.
export function HeroArt({id='unassigned',color='#527563',sleeping=false}:{id?:string;color?:string;sleeping?:boolean}){
 const iron=id==='iron-man',boss=id==='boos',panther=id==='black-panther',spider=id==='spider-man',hulk=id==='hulk';
 const hair=['black-widow','kate-bishop','ms-marvel','thor','hawkeye'].includes(id);
 const cape=boss||id==='thor';const suit=boss?'#29483d':color;
 return <g className={'hero-drawing '+(sleeping?'hero-asleep':'')} stroke="#24352e" strokeWidth="1.7" strokeLinejoin="round">
  <ellipse cy="2" rx="19" ry="6" fill="#16372c" opacity=".18" stroke="none"/>
  {cape&&<path d="M-15-56Q-29-28-24-5L0-10 25-4Q27-34 14-57Z" fill={boss?'#153c30':'#9e3839'}/>}
  <g className="hero-legs"><path d="M-13-29-12-8-17-4Q-13 1-4-3L-1-27M3-28 5-5Q13 1 19-4L13-10 15-29" fill={iron?'#9b3029':boss?'#667774':hulk?'#624274':spider?'#264e83':suit}/><path d="m-12-16 8 2m9-1 8-2" stroke="#e1dbb9" opacity=".65"/></g>
  <path d="M-11-60Q-19-57-18-42L-14-25Q0-19 15-26L18-46Q18-57 10-60Z" fill={suit}/>
  <path d="m-13-53 12 5 14-5-2 15-11 5-11-4Z" fill={iron?'#d5ad61':boss?'#8a9990':'#faf1d2'} opacity={iron||boss?1:.22}/>
  <path className="hero-arm" d="M-17-54Q-26-48-22-34L-14-30-12-36-17-40-12-50M15-54Q24-48 22-35L14-31 10-36 16-41 12-51" fill={iron?'#ac3630':boss?'#81928a':suit}/>
  <path d="M-14-28Q0-24 15-29L14-24-13-24Z" fill="#333e37"/><rect x="-3" y="-28" width="7" height="5" rx="1" fill="#d9bc77"/>
  {hair&&<path d="M-14-67Q-18-87 0-88Q19-87 14-63L18-52-17-54Z" fill={id==='black-widow'?'#a95635':id==='thor'?'#cbb07a':'#35313f'}/>}
  {boss&&<path d="M-22-55Q-21-93 0-94Q23-86 22-54L10-64-13-62Z" fill="#193c30"/>}
  <path d="M-12-77Q0-87 12-77L13-65Q10-55 0-54Q-11-56-13-66Z" fill={iron?'#d7b36f':boss?'#a7b5ab':panther?'#33303f':spider?'#bd4140':hulk?'#8ba45c':hair?'#d7ad86':suit}/>
  <path d="m-9-73 6 2m6 0 6-2" stroke={iron?'#e1fcff':'#24352e'} strokeWidth="3"/>
  <path d={sleeping?'m-8-69 5 1m6 0 5-1':'m-8-69 5-1m6 0 5 1'} stroke={iron?'#dffeff':boss?'#202f29':'#f4ead6'} strokeWidth="2.6"/>
  <path d="M-3-66 0-62 3-66M-4-59h8" fill="none" strokeWidth="1"/>
  {iron&&<><path d="M-12-77-2-79 0-73 3-79 12-77 10-84 0-88-11-84Z" fill="#9c352c"/><circle cy="-44" r="4.5" fill="#d0f6f3" stroke="#f3e9c8"/></>}
  {boss&&<><path d="M-7-60v-4m5 5v-5m5 5v-5m4 4v-4" stroke="#273b32"/><circle cx="12" cy="-56" r="3" fill="#b4b9a2"/></>}
  {panther&&<path d="m-12-76-2-10 8 7m12 0 8-7-2 11M-9-59l3-5m12 0 3 5" fill="#38343f"/>}
  {spider&&<><path d="M-11-73-2-69-8-65Zm22 0-9 4 6 4Z" fill="white"/><path d="M0-79v22m-12-13h24m-22-7 20 15m-20 0 19-15" stroke="#2b3540" strokeWidth=".7"/></>}
  {id==='captain-america'&&<><text y="-75" textAnchor="middle" stroke="none" fill="#f3edda" fontSize="9" fontWeight="bold">A</text><circle cx="20" cy="-34" r="13" fill="#b3433d"/><circle cx="20" cy="-34" r="9" fill="#eee8d6"/><circle cx="20" cy="-34" r="6" fill="#3d6387"/><path d="m20-39 1 4 4 0-3 2 1 4-3-2-3 2 1-4-3-2h4Z" fill="#fff" stroke="none"/></>}
  {id==='thor'&&<path d="M-21-32v-17m-6-5h13v10h-13Z" fill="#a8b1ae"/>}
  {sleeping&&<text x="20" y="-81" stroke="none" fill="#567965" fontSize="18">z Z</text>}
 </g>;
}
