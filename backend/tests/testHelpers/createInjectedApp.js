const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
const path = require('path');
const fs = require('fs');

/**
 * createInjectedApp(options)
 * - options.database: database name to connect to (defaults to env PGDATABASE)
 * - returns { app, sequelize, pool }
 *
 * This helper creates a fresh Sequelize and pg Pool, overrides the exported
 * instances in `src/utils/database.js` and requires the app so models register
 * against the injected Sequelize instance.
 */
module.exports = async function createInjectedApp(options = {}) {
  const dbName = options.database || process.env.PGDATABASE || 'listflowhq_test';
  const user = process.env.PGUSER || 'postgres';
  const password = process.env.PGPASSWORD || 'password';
  const host = process.env.PGHOST || 'localhost';
  const port = process.env.PGPORT || 5432;

  const sequelize = new Sequelize(dbName, user, password, {
    host,
    port,
    dialect: 'postgres',
    logging: false
  });

  const pool = new Pool({ host, user, password, database: dbName, port, max: 5 });

  // Use the appFactory to create an app with injected DB instances
  const { createApp } = require('../../src/appFactory');
  const app = await createApp({ sequelize, pool });
  // Wait for DB to be ready
  await sequelize.authenticate();
  return { app, sequelize, pool };
};
