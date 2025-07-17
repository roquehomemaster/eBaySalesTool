const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const EbayInfo = require('../src/models/ebayInfoModel');

describe('eBay Info API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await EbayInfo.create({
      accountId: 'acc123',
      store_name: 'Test Store',
      feedback_score: 100,
      positive_feedback_percent: 99.5,
      selling_limits: {},
      last_sync: new Date().toISOString(),
      seller_level: 'Top Rated',
      defect_rate: 0.1,
      late_shipment_rate: 0.05,
      transaction_defect_rate: 0.02,
      policy_compliance_status: 'Compliant',
      api_status: 'Healthy'
    });
  });

  it('should get eBay account info', async () => {
    const res = await request(app).get('/api/ebay/info');
    expect(res.statusCode).toBe(200);
    expect(res.body.accountId).toBe('acc123');
  });

  it('should search eBay info', async () => {
    const res = await request(app).get('/api/ebay/info/search?storeName=Test');
    expect(res.statusCode).toBe(200);
    expect(Array.isArray(res.body)).toBe(true);
    expect(res.body[0].storeName).toBe('Test Store');
  });

  it('should get eBay performance', async () => {
    const res = await request(app).get('/api/ebay/performance');
    expect(res.statusCode).toBe(200);
    expect(res.body.sellerLevel).toBe('Top Rated');
  });

  it('should get eBay API status', async () => {
    const res = await request(app).get('/api/ebay/status');
    expect(res.statusCode).toBe(200);
    expect(res.body.apiStatus).toBe('Healthy');
  });
});
