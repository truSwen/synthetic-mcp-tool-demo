export const scenarios = Object.freeze({
  list: { name: 'list_demo_accounts', arguments: { limit: 2 } },
  brief: { name: 'get_demo_brief', arguments: { account_id: 'demo-001' } },
  supported: { name: 'check_demo_claim', arguments: { account_id: 'demo-001', claim: 'has_enquiry_form' } },
  unknown: { name: 'check_demo_claim', arguments: { account_id: 'demo-001', claim: 'uses_crm' } },
  hypothesis: { name: 'check_demo_claim', arguments: { account_id: 'demo-002', claim: 'needs_automation' } },
  refused: { name: 'get_demo_brief', arguments: { account_id: 'not-an-allowed-fixture' } }
});
