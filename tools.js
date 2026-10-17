import { McpServer } from '@modelcontextprotocol/server';
import * as z from 'zod/v4';

// The only data source is this checked-in, fictional fixture. No network calls.
import fixture from './data.json' with {type:'json'};
const accountId = z.enum(['demo-001', 'demo-002']);
const claim = z.enum(['has_enquiry_form', 'uses_crm', 'needs_automation']);
const meta = { synthetic: z.literal(true), notice: z.string() };
const annotations = { readOnlyHint: true, destructiveHint: false, idempotentHint: true, openWorldHint: false };
const reply = output => ({ content: [{ type: 'text', text: JSON.stringify(output) }], structuredContent: output });

export function createServer(options = {}) {
  const server = new McpServer({ name: 'synthetic-evidence-tools', version: '1.0.0' }, options);
  server.registerTool('list_demo_accounts', {
    title: 'List fictional accounts',
    description: 'List two invented accounts from local synthetic fixtures. No external research or real customer data.',
    inputSchema: z.strictObject({ limit: z.number().int().min(1).max(2).default(2) }),
    outputSchema: z.strictObject({ ...meta, accounts: z.array(z.strictObject({ id: accountId, name: z.string(), sector: z.string() })) }),
    annotations
  }, async ({ limit }) => reply({ synthetic: true, notice: fixture.notice,
    accounts: fixture.accounts.slice(0, limit).map(({ id, name, sector }) => ({ id, name, sector })) }));
  server.registerTool('get_demo_brief', {
    title: 'Read a fictional account brief',
    description: 'Retrieve invented evidence for an allowlisted fixture ID. No URLs, filesystem paths or free-text instructions accepted.',
    inputSchema: z.strictObject({ account_id: accountId }),
    outputSchema: z.strictObject({ ...meta, account: z.strictObject({ id: accountId, name: z.string(), sector: z.string() }),
      evidence: z.array(z.strictObject({ id: z.string(), statement: z.string(), source: z.literal('synthetic fixture') })) }),
    annotations
  }, async ({ account_id }) => {
    const { id, name, sector, evidence } = fixture.accounts.find(a => a.id === account_id);
    return reply({ synthetic: true, notice: fixture.notice, account: { id, name, sector }, evidence });
  });
  server.registerTool('check_demo_claim', {
    title: 'Check a bounded fictional claim',
    description: 'Deterministic fixture lookup, not AI reasoning or factual verification. Separates supported synthetic evidence, unknowns and hypotheses.',
    inputSchema: z.strictObject({ account_id: accountId, claim }),
    outputSchema: z.strictObject({ ...meta, account_id: accountId, claim,
      status: z.enum(['supported', 'unknown', 'hypothesis']), evidence_ids: z.array(z.string()), explanation: z.string() }),
    annotations
  }, async ({ account_id, claim: requested }) => {
    const account = fixture.accounts.find(a => a.id === account_id);
    const status = account.claims[requested];
    return reply({ synthetic: true, notice: fixture.notice, account_id, claim: requested, status,
      evidence_ids: status === 'supported' ? account.evidence.map(e => e.id) : [],
      explanation: status === 'supported' ? 'Supported only by the invented fixture, not verified in the real world.' :
        status === 'unknown' ? 'The fixture contains no supporting evidence. Do not infer a fact.' :
          'Illustrative hypothesis only. It is not an established business need.' });
  });
  return server;
}
