const { _internal: { pruneAlertHistory } } = require('../../../routes/ebayMetricsAdminRoutes');
process.env.NODE_ENV='test';
process.env.ALLOW_SCHEDULERS_UNDER_TEST='true';
process.env.EBAY_ALERT_HISTORY_RETENTION_ENABLED='true';
process.env.EBAY_ALERT_HISTORY_RETENTION_INTERVAL_MS='50';
process.env.EBAY_ALERT_HISTORY_RETENTION_INITIAL_DELAY_MS='10';
process.env.EBAY_ALERT_HISTORY_RETENTION_DAYS='1'; // keep recent
process.env.EBAY_ALERT_HISTORY_PERSIST='0'; // in-memory only fine
process.env.EBAY_ADMIN_API_KEY='k';

const app = require('../../../app');
const request = require('supertest');
const { startSchedulers, stopSchedulers } = require('../scheduler');

// Helper to inject synthetic alerts with timestamps
async function inject(tsOffsetMs){
  const now = Date.now();
  const payload = { key:'test_old', severity:'warn', ts: now - tsOffsetMs };
  // Directly push into internal history via record endpoint (ts cannot be overridden externally, so push via internal API?)
  // Instead: mimic structure by calling private function through route (easier: use _test endpoint and then adjust last element's ts)
  await request(app).post('/api/admin/ebay/metrics/_test/record-alert').set('X-Admin-Auth','k').send({ key: payload.key, severity: payload.severity, payload: {} });
  // Mutate last entry timestamp
  const mod = require('../../../routes/ebayMetricsAdminRoutes');
  const hist = mod.__getAlertHistory ? mod.__getAlertHistory() : null; // not exposed; fallback hack: access closure impossible
  // Fallback: call prune directly not dependent on timestamp since we cannot mutate; skip
}

describe('alert history retention scheduler', () => {
  test('invokes pruneAlertHistory via scheduler (smoke)', async () => {
    const spy = jest.spyOn(require('../../../routes/ebayMetricsAdminRoutes')._internal, 'pruneAlertHistory');
    startSchedulers();
    await new Promise(r => setTimeout(r, 160));
    stopSchedulers();
    expect(spy).toHaveBeenCalled();
  });
});
