/**
 * appFactory.js
 * Lightweight DI factory: allows tests to inject Sequelize and pg Pool instances
 * before the main `app` module is required. This keeps the current `app.js`
 * implementation intact while enabling DI for tests.
 */
const db = require('./utils/database');

function clearAppRequireCache() {
  try {
    const p = require.resolve('./app');
    delete require.cache[p];
  } catch (e) { /* ignore if not resolvable */ }
}

async function createApp({ sequelize, pool } = {}) {
  if (sequelize) db.setSequelize(sequelize);
  if (pool) db.setPool(pool);
  // Initialize models on the provided sequelize before requiring the app
  try {
    const { initModels } = require('./models');
    initModels(db.sequelize);
  } catch (e) {
    // If models/index fails to load, proceed; the app will still attempt to require models
    // and they will use the overridden sequelize where applicable.
  }
  // Ensure app is required fresh so models pick up the overridden instances
  clearAppRequireCache();
  const app = require('./app');
  return app;
}

function createDefaultApp() {
  // Use existing default instances and require the app
  clearAppRequireCache();
  return require('./app');
}

module.exports = { createApp, createDefaultApp };
