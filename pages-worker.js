import {createMcpHandler} from '@modelcontextprotocol/server';
import {CfWorkerJsonSchemaValidator} from '@modelcontextprotocol/server/validators/cf-worker';
import {createServer} from './tools.js';
const handler=createMcpHandler(()=>createServer({jsonSchemaValidator:new CfWorkerJsonSchemaValidator()}),{responseMode:'json'});
const assets=new Set(['/','/app.js','/style.css','/404.html']);
const json=(status,error)=>Response.json({error},{status,headers:{'Cache-Control':'no-store','X-Content-Type-Options':'nosniff'}});
export default{async fetch(request,env){
 const url=new URL(request.url),host=url.hostname;
 if(!['127.0.0.1','localhost','tribloc-mcp-tools.pages.dev'].includes(host)&&!(/^[a-z0-9-]+\.tribloc-mcp-tools\.pages\.dev$/.test(host)))return json(403,'HOST_NOT_ALLOWED');
 if(url.pathname!=='/mcp')return assets.has(url.pathname)?env.ASSETS.fetch(request):json(404,'NOT_FOUND');
 const origin=request.headers.get('origin');
 if(origin&&origin!==url.origin)return json(403,'ORIGIN_NOT_ALLOWED');
 if(request.method!=='POST')return json(405,'POST_ONLY');
 if(!request.headers.get('content-type')?.toLowerCase().startsWith('application/json'))return json(415,'JSON_REQUIRED');
 const reader=request.body?.getReader();if(!reader)return json(400,'BODY_REQUIRED');
 let total=0,chunks=[];
 try{while(true){const{done,value}=await reader.read();if(done)break;total+=value.byteLength;if(total>8192){await reader.cancel();return json(413,'BODY_TOO_LARGE');}chunks.push(value);}
 const body=new Uint8Array(total);let offset=0;for(const chunk of chunks){body.set(chunk,offset);offset+=chunk.byteLength;}
 const bounded=new Request(request.url,{method:'POST',headers:request.headers,body});
 const response=await handler.fetch(bounded);const headers=new Headers(response.headers);headers.set('Cache-Control','no-store');headers.set('X-Content-Type-Options','nosniff');return new Response(response.body,{status:response.status,headers});
 }catch{return json(500,'MCP_DEMO_FAILED');}
}};
