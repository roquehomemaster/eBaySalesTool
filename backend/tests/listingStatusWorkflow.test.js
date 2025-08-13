/**
 * listingStatusWorkflow.test.js
 * Tests branching status workflow transitions.
 */
const request = require('supertest');
const app = require('../src/app');

describe('Listing Status Workflow', () => {
  let listingId; let itemId; let defaultGraph;
  beforeAll(async () => {
    // Ensure default (rich) graph is applied in case another test mutated it
    const descriptor = await request(app).get('/api/listings/status/workflow');
    defaultGraph = descriptor.body.graph;
    // If essential nodes like 'sold' missing, post a canonical default
    if (!defaultGraph.sold || !defaultGraph.listing_ended || !defaultGraph.listing_removed) {
      const canonical = {
        draft: ['ready_to_list'],
        ready_to_list: ['listed','draft'],
        listed: ['sold','listing_ended','listing_removed'],
        sold: ['complete','return_initiated'],
        listing_ended: ['relist','complete'],
        listing_removed: ['relist','complete'],
        relist: ['listed','draft'],
        return_initiated: ['return_received','return_denied'],
        return_received: ['complete'],
        return_denied: ['complete'],
        complete: []
      };
      await request(app).post('/api/listings/status/workflow').send({ graph: canonical });
    }
    const catalogRes = await request(app).post('/api/catalog').send({ description: 'WF Cat', manufacturer: 'M', model: 'X', serial_number: 'SNWF', sku_barcode: `SKU-WF-${Date.now()}` });
    itemId = catalogRes.body.item_id;
    const createRes = await request(app).post('/api/listings').send({ title: 'WF Listing', listing_price: 10.0, item_id: itemId });
    listingId = createRes.body.listing_id;
    expect(createRes.body.status).toBe('draft');
  });

  test('valid forward transitions draft->ready_to_list->listed->sold', async () => {
    await request(app).put(`/api/listings/${listingId}`).send({ status: 'ready_to_list' }).expect(200);
    await request(app).put(`/api/listings/${listingId}`).send({ status: 'listed' }).expect(200);
    await request(app).put(`/api/listings/${listingId}`).send({ status: 'sold' }).expect(200);
  });

  test('invalid backward transition sold->draft rejected', async () => {
    const res = await request(app).put(`/api/listings/${listingId}`).send({ status: 'draft' });
    expect(res.status).toBe(400);
    expect(res.body.message).toBe('Invalid status transition');
  });

  test('listed can branch to listing_ended', async () => {
    // Create another listing that we keep at listed
    const c2 = await request(app).post('/api/listings').send({ title: 'WF Listing 2', listing_price: 5, item_id: itemId });
    const l2 = c2.body.listing_id;
    await request(app).put(`/api/listings/${l2}`).send({ status: 'ready_to_list' });
    await request(app).put(`/api/listings/${l2}`).send({ status: 'listed' });
    const endRes = await request(app).put(`/api/listings/${l2}`).send({ status: 'listing_ended' });
    expect(endRes.status).toBe(200);
  });
});
