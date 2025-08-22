const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_ALERT_HISTORY_PERSIST='1';

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

const { sequelize } = require('../../../utils/database');
const app = require('../../../app');

describe('alert history DB pagination', () => {
  beforeAll(async () => { await sequelize.authenticate(); });
  afterAll(async () => { await sequelize.close(); });

  test('returns DB-sourced history when source=db', async () => {
    // Insert a couple alerts via test helper
    for (let i=0;i<3;i++) {
      await request(app).post('/api/admin/ebay/metrics/_test/record-alert').set('X-Admin-Auth','k').send({ key:`db_alert_${i}`, severity:'warn', payload:{ idx:i } });
    }
    await new Promise(r=>setTimeout(r,30));
    const resDb = await request(app).get('/api/admin/ebay/metrics/alert-history?source=db&limit=2').set('X-Admin-Auth','k');
    expect(resDb.status).toBe(200);
    expect(resDb.body.items.length).toBe(2);
    const offsetRes = await request(app).get('/api/admin/ebay/metrics/alert-history?source=db&limit=2&offset=2').set('X-Admin-Auth','k');
    expect(offsetRes.status).toBe(200);
    // NDJSON export
    const nd = await request(app).get('/api/admin/ebay/metrics/alert-history.ndjson').set('X-Admin-Auth','k');
    expect(nd.status).toBe(200);
    const lines = nd.text.trim().split('\n');
    expect(lines.some(l=>l.includes('db_alert_0'))).toBe(true);
  });
});
