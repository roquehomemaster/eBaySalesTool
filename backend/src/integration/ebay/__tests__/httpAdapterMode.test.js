process.env.EBAY_ADAPTER_MODE = 'http';

jest.mock('../ebayHttpClient', () => ({
  getListing: jest.fn(async (id) => ({ ok:true, body:{ sku:'S-'+id, product:{ title:'Real Item '+id, description:'Desc '+id } } }))
}));

jest.mock('../metrics', () => ({ inc: jest.fn(), observe: jest.fn(), setGauge: jest.fn() }));

const adapter = require('../ebayAdapter');

describe('http adapter mode', () => {
  test('normalizes http response', async () => {
    const data = await adapter.fetchWithRetry('5555', { maxRetries:0 });
    expect(data.ItemID).toBe('5555');
    expect(data.Title).toContain('Real Item');
  });
});
