const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const EbayInfo = require('../models/ebayInfoModel');

describe('eBay Info API', () => {
  beforeAll(async () => {
    await sequelize.sync({ force: true });
    await EbayInfo.create({
      accountId: 'acc123',
      storeName: 'Test Store',
      feedbackScore: 100,
      positiveFeedbackPercent: 99.5,
      sellingLimits: {},
      lastSync: new Date().toISOString(),
      sellerLevel: 'Top Rated',
      defectRate: 0.1,
      lateShipmentRate: 0.05,
      transactionDefectRate: 0.02,
      policyComplianceStatus: 'Compliant',
      apiStatus: 'Healthy'
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
