const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_OAUTH_CLIENT_ID='id';
process.env.EBAY_OAUTH_CLIENT_SECRET='secret';
process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES='0';
process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES='9';
process.env.READINESS_DB_CHECK_INTERVAL_MS='0';

// Mock token refresh success
jest.mock('axios', () => ({ post: jest.fn(()=>({ data:{ access_token:'ok', expires_in:3600 } })) }));

// Mock database pool to fail
jest.mock('../../../utils/database', () => {
  const real = jest.requireActual('../../../utils/database');
  // Provide a simple failing pool object; avoid recursive getter pattern
  const failingPool = { query: jest.fn(() => Promise.reject(new Error('SELECT 1 failed: db down'))) };
  return { ...real, pool: failingPool, getPool: () => failingPool };
});

const app = require('../../../app');

describe('readiness db check', () => {
  test('returns db_unreachable issue when db query fails', async () => {
    const res = await request(app).get('/api/ready');
    expect(res.status).toBe(503);
    expect(res.body.issues).toContain('db_unreachable');
  });
});
