const request = require('supertest');

process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='9';
process.env.EBAY_QUEUE_BACKLOG_READY_THRESHOLD='10';

// Mock metrics to simulate backlog depth
jest.mock('../metrics', () => {
  const real = jest.requireActual('../metrics');
  return {
    ...real,
    snapshot: () => ({ gauges: { queue_pending_depth: 15 }, counters:{}, histograms:{}, timestamps:{} })
  };
});

// Mock axios token refresh success
jest.mock('axios', () => ({ post: jest.fn(()=>({ data:{ access_token:'ok', expires_in:3600 } })) }));

const app = require('../../../app');

describe('readiness queue backlog gate', () => {
  test('returns 503 and queue_backlog when depth >= threshold', async () => {
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.issues).toContain('queue_backlog');
  });
});
