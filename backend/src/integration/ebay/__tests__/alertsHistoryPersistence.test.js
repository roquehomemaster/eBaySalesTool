const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_ALERT_HISTORY_PERSIST='1';

// Lightweight mocks to satisfy dependencies
jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

jest.mock('../../../models/ebayIntegrationModels', () => ({
  EbayChangeQueue: {},
  EbayListing: { findOne: jest.fn(() => Promise.resolve({ internal_listing_id:1, last_publish_hash:null, update: jest.fn(), lifecycle_state:'pending', external_item_id:null })) },
  EbaySyncLog: { create: jest.fn(()=>Promise.resolve()) },
  EbayFailedEvent: { create: jest.fn(()=>Promise.resolve()) }
}));

const { sequelize } = require('../../../utils/database');
const app = require('../../../app');

describe('alert history persistence (DB)', () => {
  beforeAll(async () => {
    await sequelize.authenticate();
  });
  afterAll(async () => {
    await sequelize.close();
  });

  test('persists alert to DB table when persistence enabled', async () => {
    // Inject synthetic alert via test endpoint
    const payload = { extra:'value' };
    const resp = await request(app).post('/api/admin/ebay/metrics/_test/record-alert').set('X-Admin-Auth','k').send({ key:'synthetic_test_alert', severity:'warn', payload });
    expect(resp.status).toBe(200);
    // Force evaluation to ensure any async insert finished (simple delay)
    await new Promise(r=>setTimeout(r,50));
    // Query DB directly
    const [rows] = await sequelize.query("SELECT key, severity, payload FROM ebay_alert_history WHERE key='synthetic_test_alert' ORDER BY id DESC LIMIT 1");
    expect(rows.length).toBe(1);
    expect(rows[0].key).toBe('synthetic_test_alert');
    expect(rows[0].severity).toBe('warn');
    expect(rows[0].payload.extra).toBe('value');
  });
});
