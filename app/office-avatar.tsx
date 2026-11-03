import {ChibiPortrait} from './chibi-portrait';
import {HeroArt} from './hero-art';
import {officeCharacters,type OfficeAvatarId} from '@/lib/office';

export function OfficeAvatar({id,color}:{id:OfficeAvatarId;color?:string}){
 const character=officeCharacters.find(c=>c.id===id)!;
 if(['iron-man','captain-america','thor','hulk','spider-man'].includes(id))return <ChibiPortrait id={id} name={character.name}/>;
 if(character.kind==='hero')return <svg viewBox="-40 -100 80 115" role="img" aria-label={character.name}><HeroArt id={id} color={character.color}/></svg>;
 if(id==='person')return <div className="person-avatar" style={{'--agent-color':color} as React.CSSProperties}><div className="agent-head"><i/><i/></div><div className="agent-shirt"/><div className="agent-legs"/></div>;
 const {kind,number}=character,c=character.color;
 const compact=kind==='compact',van=kind==='van',tow=kind==='tow',fork=kind==='forklift',classic=kind==='classic',fins=kind==='fins',low=kind==='lowrider';
 const tall=van||tow||compact||fork;
 return <svg className={'office-car car-'+kind} viewBox="0 0 132 88" role="img" aria-label={character.name}>
  <ellipse cx="67" cy="77" rx="53" ry="7" fill="#493326" opacity=".18"/>
  {tow&&<g stroke="#594632" strokeWidth="4" strokeLinecap="round" strokeLinejoin="round" fill="none"><path d="M24 49 13 19 44 12 64 47"/><path d="M15 19 43 37 44 12"/><path d="M13 19 9 44q-8 8-1 11q6 2 8-4"/></g>}
  {fins&&<path d="m18 45-7-19 31 17M81 41l8-15 10 23" fill={c} stroke="#354e42" strokeWidth="2"/>}
  {kind==='racer'&&<path d="M9 45 6 36l29-1 4 10" fill={c} stroke="#79271e" strokeWidth="2"/>}
  {fork&&<g stroke="#4a5260" strokeWidth="5" fill="none" strokeLinecap="round"><path d="M96 46v29h25M104 43v31h21"/></g>}
  <g className="car-wheel"><ellipse cx="31" cy="65" rx="12" ry="16" fill="#292d34"/><ellipse cx="32" cy="65" rx="6" ry="10" fill="#abb2b8"/><ellipse cx="33" cy="65" rx="2" ry="5" fill="#47505a"/></g>
  <g className="car-wheel"><ellipse cx="99" cy="65" rx="13" ry="16" fill="#252a30"/><ellipse cx="100" cy="65" rx="7" ry="10" fill={kind==='racer'?'#c04437':'#c5c8c8'}/><ellipse cx="100" cy="65" rx="3" ry="5" fill="#53626a"/></g>
  <path d={van?'M14 27Q15 12 33 12h42q13 0 21 17l14 20v17q-4 7-17 7H24q-14 0-15-12Z':fork?'M24 25q1-12 14-12h25q10 0 14 12l12 20 15 6v18H23Q9 64 15 49Z':tow?'M17 47h22V25q1-10 14-10h25q11 2 13 15l6 15 22 7-2 16q-7 9-27 8L24 69 9 58Z':compact?'M14 47q8-4 15-24Q35 9 57 12q22 2 30 28l24 10q10 6 6 19-19 9-34 8L20 69Q7 64 14 47Z':classic?'M9 49q8-6 19-8l13-20q14-8 33 0l15 21 28 8q10 7 3 21-13 6-30 6L17 67Q8 64 9 49Z':low?'M8 49 31 40l12-15q19-8 36 2l15 17 27 11q5 8-2 14L26 72 8 61Z':'M9 48q9-6 24-9l16-17q12-8 28-1l18 21 24 9q9 8 0 18-15 10-37 7L22 68Q8 66 9 48Z'} fill={c} stroke="#29323b" strokeWidth="2.2" strokeLinejoin="round"/>
  <path d={tall?'M43 24q16-8 33 0l10 20-43-5Z':'M48 26q14-6 25-1l14 18-48-6Z'} fill="#edf7ec" stroke="#3e5967" strokeWidth="2"/>
  <path d={tall?'m44 25 1 6q21-8 32 1l-3-8Z':'m48 26-4 5q20-7 32 2l-4-8Z'} fill={c} opacity=".75"/>
  <g className="car-eyes"><ellipse cx={tall?57:55} cy={tall?31:30} rx="4.5" ry="6" fill="#2c505d"/><ellipse cx={tall?73:71} cy={tall?33:32} rx="4.5" ry="6" fill="#2c505d"/><circle cx={tall?58:56} cy={tall?29:28} r="1.5" fill="white"/><circle cx={tall?74:72} cy={tall?31:30} r="1.5" fill="white"/></g>
  <path d="m93 46 22 8-11 6-22-8Z" fill="#fff8e7" opacity=".27"/>
  <path d="m17 49 18-6 5 5-21 6Z" fill="#fff8e7" opacity=".22"/>
  {number&&<><path d="m21 48 25-7-6 9 17-2-28 14 6-10Z" fill="#ffcf55" stroke="#c97820" strokeWidth="1"/><text x="49" y="59" fontSize={number.length>2?14:17} fill="#fff6c5" stroke="#792a22" strokeWidth=".7" fontWeight="900" fontFamily="Arial,sans-serif" fontStyle="italic">{number}</text></>}
  {tow&&<><path d="m21 52 11-3 6 7-13 3Z" fill="#754c32"/><path d="m79 47 11 4-9 5-7-5Z" fill="#76543e"/><circle cx="107" cy="55" r="5" fill="#f0d2a0" stroke="#644d35" strokeWidth="2"/><path d="M83 64q14 6 29 0l-2 8H88Z" fill="#402f29"/><path d="m92 65 6 1v9h-6Zm8 1 6-1v8h-6Z" fill="#f6e6be"/></>}
  {!tow&&<><path d="M83 64q15 7 29-1-5 10-18 8Z" fill="#263d47"/><path d="m88 65 19-1q-7 5-19 1" fill="#f9f6e9"/>{classic?<path d="M80 57h38M84 60h31" stroke="#d2d9d1" strokeWidth="2"/>:<><ellipse cx="82" cy="53" rx="6" ry="3" fill="#fff3c6" transform="rotate(10 82 53)"/><ellipse cx="117" cy="57" rx="4" ry="3" fill="#fff3c6"/></>}</>}
  {(classic||low||fins)&&<path d="m14 59 57 9m11 6 36-2" stroke="#cbd5d4" strokeWidth="2.5" strokeLinecap="round"/>}
  {van&&<><path d="M19 27h16v17H17Z" fill="#c6decd" stroke="#557663" strokeWidth="1.5"/><path d="M27 55c-5-9-13 2 0 8 14-6 5-17 0-8" fill="#f4d96b"/></>}
 </svg>;
}
