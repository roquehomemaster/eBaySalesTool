const { ENTITY } = require('../src/constants/entities');

describe('Entity Constants', () => {
  test('all values unique', () => {
    const values = Object.values(ENTITY);
    const set = new Set(values);
    expect(set.size).toBe(values.length);
  });

  test('expected keys present', () => {
    const expected = [
      'LISTING','CATALOG','CUSTOMER','OWNERSHIP','SALES','APPCONFIG','SHIPPING_LOG','FINANCIAL_TRACKING','COMMUNICATION_LOGS','RETURN_HISTORY','PERFORMANCE_METRICS','ORDER_DETAILS','DATABASE_CONFIGURATION'
    ];
    for (const key of expected) {
      expect(ENTITY).toHaveProperty(key);
      expect(typeof ENTITY[key]).toBe('string');
    }
  });
});
