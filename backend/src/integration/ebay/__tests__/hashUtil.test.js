const { canonicalize, canonicalJSONString, hashObject } = require('../hashUtil');

describe('hashUtil', () => {
  test('canonicalization sorts object keys deterministically', () => {
    const a = { b: 1, a: 2 };
    const b = { a: 2, b: 1 };
    expect(canonicalJSONString(a)).toBe(canonicalJSONString(b));
  });

  test('hashObject stable across identical objects', () => {
    const obj = { z: 5, a: { y: 2, x: 1 } };
    const h1 = hashObject(obj);
    const h2 = hashObject({ a: { x: 1, y: 2 }, z: 5 });
    expect(h1).toBe(h2);
  });

  test('hashObject changes when meaningful field changes', () => {
    const obj = { a: 1 };
    const h1 = hashObject(obj);
    const h2 = hashObject({ a: 2 });
    expect(h1).not.toBe(h2);
  });
});
