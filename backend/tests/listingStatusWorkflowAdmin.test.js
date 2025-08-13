/**
 * listingStatusWorkflowAdmin.test.js
 * Tests admin update of listing status workflow graph.
 */
const request = require('supertest');
const app = require('../src/app');

describe('Listing Status Workflow Admin Update', () => {
  test('GET descriptor returns graph and nodes', async () => {
    const res = await request(app).get('/api/listings/status/workflow');
    expect(res.status).toBe(200);
    expect(res.body).toHaveProperty('graph');
    expect(res.body).toHaveProperty('nodes');
  });

  test('POST valid new graph accepted', async () => {
    const newGraph = { draft: ['ready_to_list'], ready_to_list: ['listed'], listed: ['complete'], complete: [] };
    const res = await request(app).post('/api/listings/status/workflow').send({ graph: newGraph });
    expect([200,201]).toContain(res.status);
    expect(res.body).toHaveProperty('message');
    // Fetch descriptor and ensure new terminal node present
    const desc = await request(app).get('/api/listings/status/workflow');
    expect(desc.status).toBe(200);
    expect(desc.body.graph).toHaveProperty('complete');
  });

  test('POST invalid graph (non-array transitions) rejected', async () => {
    const badGraph = { draft: 'listed' }; // invalid type
    const res = await request(app).post('/api/listings/status/workflow').send({ graph: badGraph });
    expect(res.status).toBe(400);
  });
});
