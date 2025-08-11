const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const EbayInfo = require('../src/models/ebayInfoModel'); // Use correct model import

describe('eBay Info API', () => {
  beforeAll(async () => {
    jest.setTimeout(60000);
    // Use API endpoint to seed and reset the database inside the container
    const res = await request(app).post('/api/populate-database');
    if (res.statusCode !== 200) {
      throw new Error(`Database seeding failed: ${res.statusCode} ${JSON.stringify(res.body)}`);
    }
    if (process.env.VERBOSE_TESTS === '1') {
      console.log('Registered models:', Object.keys(sequelize.models));
    }
  // Log all tables in public schema (robust via pg_tables)
  const [pgTables] = await sequelize.query("SELECT tablename FROM pg_tables WHERE schemaname = 'public'");
  const tableNames = pgTables.map(r => r.tablename);
  if (process.env.VERBOSE_TESTS === '1') {
    console.log('Tables in public schema (pg_tables):', tableNames);
  }
    // Check for required tables
    const requiredTables = ['ownership', 'listing', 'ebayinfo', 'application_account', 'roles', 'customer', 'catalog'];
    requiredTables.forEach(tbl => {
      if (!tableNames.includes(tbl)) {
        throw new Error(`Missing required table: ${tbl}`);
      }
    });
    await EbayInfo.create({
      account_id: 'acc123',
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
    await new Promise(resolve => setTimeout(resolve, 100)); // Wait for DB commit
  }, 60000);

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
