const EbayListingImportRaw = require('../models/ebayListingImportRawModel');
const crypto = require('crypto');

function hashPayload(obj){
  const json = JSON.stringify(obj, Object.keys(obj).sort());
  return crypto.createHash('sha256').update(json).digest('hex');
}

describe('Raw import staging basics', () => {
  test('hash generation stable for key-sorted JSON', () => {
    const a = { z: 1, a: 2 };
    const b = { a: 2, z: 1 };
    expect(hashPayload(a)).toBe(hashPayload(b));
  });

  test('model has expected columns', () => {
    const attrs = Object.keys(EbayListingImportRaw.rawAttributes);
    ['import_id','item_id','raw_json','content_hash','process_status'].forEach(c => {
      expect(attrs).toContain(c);
    });
  });
});
