const express = require('express');
const adminAuth = require('../../../middleware/ebayAdminAuth');

const request = require('supertest');

function buildApp(){
  const app = express();
  app.get('/api/admin/ebay/ping', adminAuth, (req,res)=>res.json({ ok:true }));
  return app;
}

describe('ebayAdminAuth middleware', () => {
  test('allows when no key set', async () => {
    delete process.env.EBAY_ADMIN_API_KEY;
    const app = buildApp();
    const res = await request(app).get('/api/admin/ebay/ping');
    expect(res.status).toBe(200);
  });
  test('rejects when key set and header missing', async () => {
    process.env.EBAY_ADMIN_API_KEY = 'secret';
    const app = buildApp();
    const res = await request(app).get('/api/admin/ebay/ping');
    expect(res.status).toBe(401);
  });
  test('accepts with correct header', async () => {
    process.env.EBAY_ADMIN_API_KEY = 'secret';
    const app = buildApp();
    const res = await request(app).get('/api/admin/ebay/ping').set('X-Admin-Auth','secret');
    expect(res.status).toBe(200);
  });
});
