/**
 * auditLoggerNumericNormalization.test.js
 * Verifies that numeric string vs number equality does NOT produce a diff.
 */
const { computeDiff } = require('../src/utils/auditLogger');

describe('auditLogger numeric normalization', () => {
  test('treats "42.5" and 42.5 as equal (no diff)', () => {
    const beforeObj = { listing_price: '42.5' };
    const afterObj = { listing_price: 42.5 };
    const { changed } = computeDiff(beforeObj, afterObj);
    expect(changed).toHaveLength(0);
  });

  test('treats number vs numeric string different when numeric values differ', () => {
    const beforeObj = { listing_price: '42.5' };
    const afterObj = { listing_price: 42.6 };
    const { changed, beforeData, afterData } = computeDiff(beforeObj, afterObj);
    expect(changed).toContain('listing_price');
    expect(beforeData.listing_price).toBe('42.5');
    expect(afterData.listing_price).toBe(42.6);
  });
});
