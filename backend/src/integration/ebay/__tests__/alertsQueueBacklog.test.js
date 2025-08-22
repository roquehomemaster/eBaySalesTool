const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_QUEUE_BACKLOG_READY_THRESHOLD='10';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_ADMIN_API_KEY='k';

jest.mock('../metrics', () => {
  const real = jest.requireActual('../metrics');
  return { ...real, snapshot: () => ({ gauges:{ 'adapter.oauth.degraded':0, queue_pending_depth:25 }, counters:{}, histograms:{}, timestamps:{} }) };
});

jest.mock('axios', () => ({ post: jest.fn(()=>({ data:{ access_token:'ok', expires_in:3600 } })) }));

const app = require('../../../app');

describe('alerts queue backlog', () => {
  test('alerts endpoint includes queue_backlog with severity escalation and history', async () => {
  const res = await request(app).get('/api/admin/ebay/metrics/alerts').set('X-Admin-Auth','k');
    expect(res.status).toBe(200);
    const keys = res.body.active.map(a=>a.key);
    expect(keys).toContain('queue_backlog');
    const qb = res.body.active.find(a=>a.key==='queue_backlog');
    expect(qb.depth).toBe(25);
    expect(qb.severity).toBe('page');
    expect(Array.isArray(res.body.history)).toBe(true);
    expect(res.body.history.length).toBeGreaterThan(0);
  });
});
