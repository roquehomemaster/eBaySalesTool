/**
 * globalSetup.js
 * Centralized test environment setup: seeds database once via API and prepares baseline.
 */
const request = require('supertest');
process.env.NODE_ENV = 'test';

// Load test environment variables early so DB client and app use the test database
try {
  const path = require('path');
  require('dotenv').config({ path: path.resolve(__dirname, '..', '..', '.env.test') });
} catch (e) {
  // non-fatal; proceed and let missing vars surface in errors
}

module.exports = async () => {
  // Drop and recreate the test database, then apply schema and seed
  const { Pool } = require('pg');
  const adminPool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'password',
    database: 'postgres',
    port: process.env.PG_PORT ? parseInt(process.env.PG_PORT, 10) : 5432,
  });
  try {
    await adminPool.query('DROP DATABASE IF EXISTS listflowhq_test');
    await adminPool.query('CREATE DATABASE listflowhq_test');
  } catch (e) {
    // Ignore errors if database is in use; tests will fail and show error
  }
  await adminPool.end();
  // Apply schema using Docker exec to ensure schema is applied inside the container
  const { execSync } = require('child_process');
  try {
    execSync(`docker exec -i listflowhq-db psql -U postgres -d listflowhq_test -f /docker-entrypoint-initdb.d/recreate_schema.sql`, { stdio: 'inherit' });
  } catch (e) {
    throw new Error('Failed to apply schema using docker exec: ' + e.message);
  }
  // Now seed database via API
  const app = require('../src/app');
  const res = await request(app).post('/api/populate-database');
  if (res.statusCode !== 200) {
    throw new Error(`Global seed failed: ${res.statusCode} ${res.text}`);
  }
};
