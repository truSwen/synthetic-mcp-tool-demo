import {Client,StreamableHTTPClientTransport} from '@modelcontextprotocol/client';
import {CfWorkerJsonSchemaValidator} from '@modelcontextprotocol/client/validators/cf-worker';
import {scenarios} from './scenarios.js';
export async function runHttpScenario(key,endpoint,fetchImpl=fetch){
 if(!Object.hasOwn(scenarios,key))throw new Error('Unknown demo scenario');
 const client=new Client({name:'synthetic-browser-client',version:'1.0.0'},{jsonSchemaValidator:new CfWorkerJsonSchemaValidator()});
 const transport=new StreamableHTTPClientTransport(new URL(endpoint),{fetch:fetchImpl});
 try{await client.connect(transport);const inventory=await client.listTools();const result=await client.callTool(scenarios[key]);return{synthetic:true,transport:'MCP over Streamable HTTP',server:client.getServerVersion(),capabilities:client.getServerCapabilities(),tools:inventory.tools.map(({name,annotations})=>({name,annotations})),request:scenarios[key],result};}
 finally{await transport.terminateSession();await client.close();}
}
