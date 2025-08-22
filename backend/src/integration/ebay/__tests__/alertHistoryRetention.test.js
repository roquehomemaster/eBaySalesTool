const request = require('supertest');
process.env.NODE_ENV='test';
process.env.EBAY_ADMIN_API_KEY='k';
process.env.EBAY_ALERT_HISTORY_PERSIST='1';
process.env.EBAY_ALERT_HISTORY_RETENTION_DAYS='1'; // 1 day cutoff

jest.mock('../projectionBuilder', () => ({ buildProjection: jest.fn(()=>Promise.resolve({ projection:{}, projection_hash:'h' })) }));
jest.mock('../adapter', () => ({ createListing: jest.fn(()=>Promise.resolve({ success:true })), updateListing: jest.fn(()=>Promise.resolve({ success:true })) }));

const { sequelize } = require('../../../utils/database');
const app = require('../../../app');

describe('alert history retention pruning', () => {
  beforeAll(async () => { await sequelize.authenticate(); });
  afterAll(async () => { await sequelize.close(); });

  test('prunes rows older than retention days', async () => {
    // Ensure table exists (trigger once via test helper call)
    await request(app).post('/api/admin/ebay/metrics/_test/record-alert').set('X-Admin-Auth','k').send({ key:'bootstrap', severity:'warn' });
    // Insert synthetic old rows manually (ts older than retention window)
    const oldTs = Date.now() - 2*24*60*60*1000; // 2 days ago
  await sequelize.query("INSERT INTO ebay_alert_history (ts, key, severity, payload) VALUES (:ts,'old_alert','warn', :payload::jsonb)", { replacements:{ ts: oldTs, payload: JSON.stringify({ test:true }) } });
  await sequelize.query("INSERT INTO ebay_alert_history (ts, key, severity, payload) VALUES (:ts,'old_alert2','warn', :payload::jsonb)", { replacements:{ ts: oldTs, payload: JSON.stringify({ test:true }) } });
    // Insert a recent alert via endpoint (should remain)
    await request(app).post('/api/admin/ebay/metrics/_test/record-alert').set('X-Admin-Auth','k').send({ key:'recent_alert', severity:'warn' });
    // Trigger prune
    const pruneResp = await request(app).post('/api/admin/ebay/metrics/alert-history/retention/run').set('X-Admin-Auth','k');
    expect(pruneResp.status).toBe(200);
    // Allow async prune completion
    await new Promise(r=>setTimeout(r,50));
    const [remaining] = await sequelize.query("SELECT key FROM ebay_alert_history");
    const keys = remaining.map(r=>r.key);
    expect(keys).toContain('recent_alert');
    expect(keys).not.toContain('old_alert');
    expect(keys).not.toContain('old_alert2');
    // Metric snapshot (if counter present) should reflect deletion, but absence is tolerated
    const metricsResp = await request(app).get('/api/admin/ebay/metrics').set('X-Admin-Auth','k');
    expect(metricsResp.status).toBe(200);
    const snap = metricsResp.body;
    const deletedCounter = snap.counters && snap.counters['alert_history.retention_deleted'];
    if (typeof deletedCounter === 'number') {
      expect(deletedCounter).toBeGreaterThan(0);
    }
  });
});
