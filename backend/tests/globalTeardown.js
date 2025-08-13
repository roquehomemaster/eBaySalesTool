/**
 * globalTeardown.js
 * Close shared DB connections after all tests to avoid open handle warnings.
 */
module.exports = async () => {
  const { sequelize, pool } = require('../src/utils/database');
  try { await sequelize.close(); } catch(_) {}
  try { await pool.end(); } catch(_) {}
  try {
    const app = require('../src/app');
    if (app.locals && app.locals.pgPool) {
      await app.locals.pgPool.end();
    }
  } catch(_) {}
};
