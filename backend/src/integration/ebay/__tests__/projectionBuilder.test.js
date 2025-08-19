const { buildProjection } = require('../projectionBuilder');
const Listing = require('../../../models/listingModel');
const Catalog = require('../../../models/catalogModel');

jest.mock('../../../models/listingModel');
jest.mock('../../../models/catalogModel');

describe('projectionBuilder', () => {
  afterEach(() => jest.resetAllMocks());

  test('throws when listing not found', async () => {
    Listing.findOne.mockResolvedValue(null);
    await expect(buildProjection(123)).rejects.toThrow('Listing 123 not found');
  });

  test('builds minimal projection with catalog', async () => {
    Listing.findOne.mockResolvedValue({ listing_id: 1, title: 'Title', status: 'draft', listing_price: '10.00', serial_number: 'SN1', manufacture_date: '2025-01-01', item_id: 7 });
    Catalog.findOne.mockResolvedValue({ item_id: 7, sku: 'SKU7', barcode: 'BAR7', manufacturer: 'M', model: 'Model', description: 'Desc' });
    const { projection, projection_hash } = await buildProjection(1);
    expect(projection.listing.id).toBe(1);
    expect(projection.catalog.sku).toBe('SKU7');
    expect(typeof projection_hash).toBe('string');
  });

  test('builds minimal projection without catalog', async () => {
    Listing.findOne.mockResolvedValue({ listing_id: 2, title: 'NoCat', status: 'draft', listing_price: null, serial_number: null, manufacture_date: null, item_id: null });
    const { projection } = await buildProjection(2);
    expect(projection.catalog).toBeNull();
  });
});
