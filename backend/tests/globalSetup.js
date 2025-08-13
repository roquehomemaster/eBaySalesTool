/**
 * globalSetup.js
 * Centralized test environment setup: seeds database once via API and prepares baseline.
 */
const request = require('supertest');
process.env.NODE_ENV = 'test';

module.exports = async () => {
  const app = require('../src/app');
  // Seed database once
  const res = await request(app).post('/api/populate-database');
  if (res.statusCode !== 200) {
    throw new Error(`Global seed failed: ${res.statusCode} ${res.text}`);
  }
  // Runtime schema mutation removed: environment should be built from canonical 01_init.sql pre-test.
};
