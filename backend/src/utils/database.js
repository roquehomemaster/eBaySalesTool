/**
 * database.js
 * -----------------------------------------------------------------------------
 * Database connection and utility functions for Sequelize and pg Pool.
 *
 * Author: ListFlowHQ Team (formerly eBay Sales Tool Team)
 * Last updated: 2025-07-10
 * -----------------------------------------------------------------------------
 */

const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Normalize environment variables to support both PGUSER/PG_USER and PGDATABASE/PG_DATABASE
const PG_DB = process.env.PGDATABASE || process.env.PG_DATABASE || process.env.PG_DB || process.env.PG_DATABASE_NAME;
const PG_USER = process.env.PGUSER || process.env.PG_USER || process.env.PG_USERNAME || 'postgres';
const PG_PASSWORD = process.env.PGPASSWORD || process.env.PG_PASSWORD || 'password';
const PG_HOST = process.env.PGHOST || process.env.PG_HOST || 'localhost';
const PG_PORT = process.env.PGPORT || process.env.PG_PORT || 5432;

// Use only environment variables or rely on Sequelize config loading
if ((process.env.LOG_LEVEL || 'info') === 'debug') {
    console.log('Sequelize config:', {
        database: PG_DB || 'ebay_sales_tool',
        user: PG_USER,
        password: PG_PASSWORD,
        host: PG_HOST,
        port: PG_PORT,
        dialect: 'postgres',
        NODE_ENV: process.env.NODE_ENV
    });
}


// Always create a fresh Sequelize and Pool instance based on current env vars
function getSequelize() {
    return new Sequelize(
        PG_DB || 'ebay_sales_tool',
        PG_USER,
        PG_PASSWORD,
        {
            host: PG_HOST,
            port: PG_PORT,
            dialect: 'postgres',
            logging: false
        }
    );
}

// Create a single shared Pool instance so callers (app/tests) operate on the same pool
function getPool() {
    return pool;
}

// For legacy code, export a default Sequelize instance and a single shared Pool
const sequelize = getSequelize();
const pool = new Pool({
    host: PG_HOST,
    max: 10,
    user: PG_USER,
    password: PG_PASSWORD,
    database: PG_DB || 'ebay_sales_tool',
    port: PG_PORT
});

/**
 * Seed the database with test data if the test flag is set in AppConfig.
 */
async function seedDatabaseIfTestFlag() {
    try {
    const pool = getPool();
    const result = await pool.query("SELECT config_value FROM appconfig WHERE config_key = 'testdata'");
        const testDataFlag = result.rows[0]?.config_value === 'true';

        if (testDataFlag) {
            const seedFilePath = path.join(__dirname, '../../database/seeds/sampleData.sql');
            const seedSQL = fs.readFileSync(seedFilePath, 'utf-8');
            await pool.query(seedSQL);
        }
    } catch (error) {
                // Log only when debug enabled
                if ((process.env.LOG_LEVEL || 'info') === 'debug') {
                    logger.debug(`seedDatabaseIfTestFlag error: ${error.message}`);
                }
    }
}

// Consolidated exports
module.exports = {
    sequelize,
    getSequelize,
    getPool,
    // For existing imports expecting 'pool', provide getter property
    pool,
    seedDatabaseIfTestFlag
};