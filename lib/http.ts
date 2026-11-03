export function json(data:unknown,status=200){return Response.json(data,{status,headers:{'Cache-Control':'private, no-store','X-Content-Type-Options':'nosniff'}});}
export function actor(request:Request){return request.headers.get('oai-authenticated-user-id');}
export function writeAllowed(request:Request){const origin=request.headers.get('origin');return !!actor(request) && origin===new URL(request.url).origin && request.headers.get('content-type')?.includes('application/json');}
export async function readBody(request:Request){const text=await request.text();if(text.length>150000)throw new Error('ข้อมูลมากเกินไป');return JSON.parse(text);}
