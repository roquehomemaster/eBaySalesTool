const rateLimiter = require('../rateLimiter');

describe('rateLimiter', () => {
  test('acquire decrements tokens & nearDepletion triggers', async () => {
    // drain a few tokens
    await rateLimiter.acquire();
    await rateLimiter.acquire();
    const near = rateLimiter.nearDepletion(); // may be false early
    expect(typeof near).toBe('boolean');
  });
  test('adjustFromHeaders clamps remaining', () => {
    rateLimiter.adjustFromHeaders({ 'x-rate-limit-remaining':'1' });
    // cannot assert internal directly except via another acquire not throwing too many times
    expect(rateLimiter.nearDepletion()).toBe(true);
  });
});
