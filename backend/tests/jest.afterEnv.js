/**
 * jest.afterEnv.js
 * Adds a global afterAll to ensure all DB connections & any server listeners are closed.
 */
const { sequelize, pool } = require('../src/utils/database');

afterAll(async () => {
  // Close Sequelize if still active
  try {
    if (sequelize && sequelize.close) {
      await sequelize.close();
    }
  } catch (_) {}
  // Close pg pool
  try {
    if (pool && pool.end) {
      await pool.end();
    }
  } catch (_) {}
  // Close Express server if stored globally
  try {
    if (global.__EBAY_SERVER__ && global.__EBAY_SERVER__.close) {
      await new Promise(res => global.__EBAY_SERVER__.close(res));
      global.__EBAY_SERVER__ = null;
    }
  } catch (_) {}
});
