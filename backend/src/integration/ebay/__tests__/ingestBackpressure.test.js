const { ingestRawListings } = require('../rawIngestionService');

jest.mock('../../../models/ebayListingImportRawModel', () => ({
  findOne: jest.fn(async () => null),
  create: jest.fn(async () => ({}))
}));

jest.mock('../ebayAdapter', () => ({
  fetchWithRetry: jest.fn(async (id) => ({ ItemID: id, SKU: 'SKU-'+id, Title: 'T'+id }))
}));

jest.mock('../rateLimiter', () => ({
  nearDepletion: jest.fn(() => true)
}));

jest.mock('../metrics', () => ({
  inc: jest.fn(), mark: jest.fn(), observe: jest.fn(), setGauge: jest.fn()
}));

describe('ingest backpressure', () => {
  test('increments backpressureDelays when near depletion', async () => {
    const res = await ingestRawListings({ itemIds: ['101','102'], dryRun: true });
    expect(res.backpressureDelays).toBeGreaterThan(0);
  });
});
