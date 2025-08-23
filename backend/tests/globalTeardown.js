/**
 * globalTeardown.js
 * Close shared DB connections after all tests to avoid open handle warnings.
 */
module.exports = async () => {
  const db = require('../src/utils/database');
  try { await db.closeAll(); } catch(_) {}
  try {
    const app = require('../src/app');
    if (app.locals && app.locals.pgPool && app.locals.pgPool.end) {
      await app.locals.pgPool.end();
    }
  } catch(_) {}
};
