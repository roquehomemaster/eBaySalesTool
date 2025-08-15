const request = require('supertest');
const app = require('../src/app');
const { sequelize } = require('../src/utils/database');
const Catalog = require('../src/models/itemModel');
const Ownership = require('../src/models/ownershipModel');
const Listing = require('../src/models/listingModel');
const ListingOwnershipHistory = require('../src/models/listingOwnershipHistoryModel');

/**
 * Tests ownership history tracking when creating and updating listings.
 */
describe('Listing Ownership History', () => {
  let catalogItemId;
  let ownerAId;
  let ownerBId;
  let listingId;

  beforeAll(async () => {
    jest.setTimeout(60000);
    // Global seed executed; create isolated ownership + catalog entities for suite
    const ownerA = await Ownership.create({ ownership_type: 'Full', first_name: 'Alice', last_name: 'Owner', email: `alice.${Date.now()}@example.com` });
    const ownerB = await Ownership.create({ ownership_type: 'Full', first_name: 'Bob', last_name: 'Owner', email: `bob.${Date.now()}@example.com` });
    ownerAId = ownerA.ownership_id;
    ownerBId = ownerB.ownership_id;
    const uniqueSku = 'SKU-HIST-' + Date.now();
  const cat = await Catalog.create({ description: 'History Item', manufacturer: 'HistCo', model: 'H100', serial_number: 'HIST123', sku: uniqueSku, barcode: uniqueSku + 'B' });
    catalogItemId = cat.item_id;
  });

  // Connection cleanup centralized in globalTeardown

  it('creates listing with initial ownership history row when ownership supplied', async () => {
    const res = await request(app)
      .post('/api/listings')
      .send({ title: 'Hist Listing', listing_price: 42.5, item_id: catalogItemId, ownership_id: ownerAId });
    expect(res.statusCode).toBe(201);
    listingId = res.body.listing_id;
    // Query history table
    const rows = await ListingOwnershipHistory.findAll({ where: { listing_id: listingId } });
    expect(rows.length).toBe(1);
    expect(rows[0].ownership_id).toBe(ownerAId);
    expect(rows[0].ended_at).toBeNull();
  });

  it('updating listing ownership appends new history row and closes previous', async () => {
    const res = await request(app)
      .put(`/api/listings/${listingId}`)
      .send({ ownership_id: ownerBId });
    expect(res.statusCode).toBe(200);
    expect(res.body.ownership_id).toBe(ownerBId);

    const rows = await ListingOwnershipHistory.findAll({ where: { listing_id: listingId }, order: [['started_at','ASC']] });
    expect(rows.length).toBe(2);
    const first = rows[0];
    const second = rows[1];
    expect(first.ownership_id).toBe(ownerAId);
    expect(first.ended_at).not.toBeNull();
    expect(second.ownership_id).toBe(ownerBId);
    expect(second.ended_at).toBeNull();
  });
});
