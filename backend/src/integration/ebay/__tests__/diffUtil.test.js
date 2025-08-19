const { diffObjects } = require('../diffUtil');

describe('diffUtil', () => {
  test('no changes identical object', () => {
    const obj = { a:1, b:{ c:2 } };
    const { changes } = diffObjects(obj, { a:1, b:{ c:2 } });
    expect(Object.keys(changes).length).toBe(0);
  });
  test('detects primitive field change', () => {
    const { changes } = diffObjects({ a:1 }, { a:2 });
    expect(changes['/a']).toEqual({ before:1, after:2 });
  });
  test('detects nested addition and removal', () => {
    const { changes } = diffObjects({ a:{ x:1, y:2 } }, { a:{ x:1, z:3 } });
    expect(changes['/a/y']).toBeDefined();
    expect(changes['/a/z']).toBeDefined();
  });
});
