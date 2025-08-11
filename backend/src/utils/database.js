/**
 * database.js
 * -----------------------------------------------------------------------------
 * Database connection and utility functions for Sequelize and pg Pool.
 *
 * Author: eBay Sales Tool Team
 * Last updated: 2025-07-10
 * -----------------------------------------------------------------------------
 */

const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');
const logger = require('./logger');

// Use only environment variables or rely on Sequelize config loading
if ((process.env.LOG_LEVEL || 'info') === 'debug') {
    console.log('Sequelize config:', {
    database: process.env.PG_DATABASE || 'ebay_sales_tool',
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'password',
    host: process.env.PG_HOST || 'localhost',
    port: process.env.PG_PORT || 5432,
    dialect: 'postgres',
    NODE_ENV: process.env.NODE_ENV
    });
}

// Sequelize instance for ORM
const sequelize = new Sequelize(
    process.env.PG_DATABASE || 'ebay_sales_tool',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'password',
    {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        dialect: 'postgres',
        logging: false // Disable SQL logging for production
    }
);

// pg Pool instance for raw queries
const pool = new Pool({
    host: process.env.PG_HOST || 'localhost',
    max: 10,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'password',
    database: process.env.PG_DATABASE || 'ebay_sales_tool',
    port: process.env.PG_PORT || 5432
});

/**
 * Seed the database with test data if the test flag is set in AppConfig.
 */
async function seedDatabaseIfTestFlag() {
    try {
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

module.exports = {
    sequelize,
    pool,
    seedDatabaseIfTestFlag
};