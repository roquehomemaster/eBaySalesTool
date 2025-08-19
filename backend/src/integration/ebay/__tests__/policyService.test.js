const { refreshPolicies, purgeExpired } = require('../policyService');

jest.mock('../../../../models/ebayIntegrationModels', () => {
  let store = [];
  return {
    EbayPolicyCache: {
      findOne: jest.fn(async ({ where:{ policy_type, external_id } }) => store.find(r => r.policy_type===policy_type && r.external_id===external_id) || null),
      create: jest.fn(async rec => { const row = { policy_cache_id: store.length+1, ...rec }; store.push(row); return row; }),
      count: jest.fn(async ({ where:{ policy_type } }) => store.filter(r=>r.policy_type===policy_type).length),
      destroy: jest.fn(async ({ where:{ expires_at:{ [Symbol.for('lt')]: now } } }) => { /* simplified */ const before = store.length; store = store.filter(r => r.expires_at > new Date()); return before - store.length; })
    }
  };
});

jest.mock('axios', () => ({ get: jest.fn(async (url) => {
  if (url.includes('shipping')) { return { data:{ policies:[ { id:'S1', name:'Ship1' } ] } }; }
  if (url.includes('return')) { return { data:{ policies:[ { id:'R1', name:'Return1' } ] } }; }
  return { data:{ policies:[] } };
}) }));

describe('policyService', () => {
  beforeEach(() => { process.env.EBAY_POLICY_ENABLED = 'true'; process.env.EBAY_API_BASE_URL = 'https://api.example'; process.env.EBAY_POLICY_TYPES = 'shipping,return'; });

  test('refreshPolicies inserts policies', async () => {
    const res = await refreshPolicies();
    expect(res.skipped).toBe(false);
    expect(res.totalFetched).toBe(2);
  expect(res.newOrChanged).toBe(2);
  expect(res.changedPolicies).toBe(2);
  });

  test('refreshPolicies skipped when flag disabled', async () => {
    process.env.EBAY_POLICY_ENABLED = 'false';
    const res = await refreshPolicies();
  expect(res.skipped).toBe(true);
  });
});
