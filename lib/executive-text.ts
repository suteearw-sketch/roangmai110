// Display formatting only: preserve the original stored evidence.
export function executiveText(value:string,max=900){
 const cleaned=value.replace(/```[\s\S]*?```/g,'').replace(/\[([^\]]+)\]\(https?:\/\/[^)]+\)/g,'$1').replace(/https?:\/\/\S+/g,'').replace(/\b(?:mcp|appgprj|appgrepo|libfile|ai-run)[-_][a-zA-Z0-9_-]+\b/gi,'').replace(/\b[0-9a-f]{8}-[0-9a-f-]{27,}\b/gi,'').split('\n').filter(line=>!/(?:\bMCP\b|commit_sha|project_id|taskId|runId|tool_call|จัดการ MCP)/i.test(line)).map(line=>line.replace(/^\s*#{1,6}\s*/,'').replace(/\*\*/g,'').replace(/`([^`]+)`/g,'$1').trim()).join('\n').replace(/\n{3,}/g,'\n\n').trim();
 return cleaned.length>max?cleaned.slice(0,max).trimEnd()+'…':cleaned;
}
export function executiveSummary(value:string){
 const cleaned=executiveText(value,Infinity);const lines=cleaned.split('\n');
 const heading=lines.findIndex(line=>/^(?:3\s*(?:เรื่องสำคัญ|ประเด็น)|สรุป(?:สำคัญ|ผู้บริหาร)?)/.test(line));
 const relevant=heading>=0?lines.slice(heading+1):lines;
 const points:string[]=[];let current='';
 for(const line of relevant){if(/^\|/.test(line)||/^(?:ตาราง|หลักฐาน|ข้อจำกัด|รายละเอียด)/.test(line)){if(current)points.push(current);break;}if(/^\d[.)\s]/.test(line)){if(current)points.push(current);if(points.length>=3)break;current=line;}else if(current&&line)current+=' '+line;}
 if(points.length<3&&current&&!points.includes(current))points.push(current);
 if(points.length)return points.slice(0,3).join('\n\n');
 return relevant.filter(line=>line&&!/^(?:อ่าน|ต้นทาง|อ้างอิง|งานต้นทาง|ข้อมูลระบบ)/.test(line)).slice(0,3).join('\n\n');
}
