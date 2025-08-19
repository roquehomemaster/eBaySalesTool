const { redactObject } = require('../redactUtil');

describe('redactUtil', () => {
  test('redacts sensitive keys recursively', () => {
    const input = { token:'abcdef123456', nested:{ refresh_token:'zzzz1111yyyy2222', keep:'ok' }, normal:'value' };
    const out = redactObject(input);
    expect(out.token).toMatch(/\*\*\*/);
    expect(out.nested.refresh_token).toMatch(/\*\*\*/);
    expect(out.nested.keep).toBe('ok');
  });
});
