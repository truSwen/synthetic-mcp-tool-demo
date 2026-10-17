import { Client } from '@modelcontextprotocol/client';
import { StdioClientTransport } from '@modelcontextprotocol/client/stdio';
import { fileURLToPath, pathToFileURL } from 'node:url';

export async function connectDemo() {
  const client = new Client({ name: 'synthetic-demo-client', version: '1.0.0' });
  const transport = new StdioClientTransport({ command: process.execPath,
    args: [fileURLToPath(new URL('./server.js', import.meta.url))], stderr: 'pipe' });
  transport.stderr?.on('data', () => {}); // Never send server diagnostics to the web UI.
  try { await client.connect(transport); return client; }
  catch (error) { await client.close(); throw error; }
}
export const scenarios = Object.freeze({
  list: { name: 'list_demo_accounts', arguments: { limit: 2 } },
  brief: { name: 'get_demo_brief', arguments: { account_id: 'demo-001' } },
  supported: { name: 'check_demo_claim', arguments: { account_id: 'demo-001', claim: 'has_enquiry_form' } },
  unknown: { name: 'check_demo_claim', arguments: { account_id: 'demo-001', claim: 'uses_crm' } },
  hypothesis: { name: 'check_demo_claim', arguments: { account_id: 'demo-002', claim: 'needs_automation' } },
  refused: { name: 'get_demo_brief', arguments: { account_id: 'not-an-allowed-fixture' } }
});
export async function runScenario(key = 'supported') {
  if (!Object.hasOwn(scenarios, key)) throw new Error('Unknown demo scenario');
  const client = await connectDemo();
  try {
    const inventory = await client.listTools();
    const result = await client.callTool(scenarios[key]);
    // The negotiated server identity/capabilities come from the real MCP connection.
    return { synthetic: true, transport: 'MCP over stdio', server: client.getServerVersion(),
      capabilities: client.getServerCapabilities(), tools: inventory.tools.map(({ name, annotations }) => ({ name, annotations })),
      request: scenarios[key], result };
  } finally { await client.close(); }
}
if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href)
  console.log(JSON.stringify(await runScenario(process.argv[2] || 'supported'), null, 2));
