const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const pgHost = process.env.PG_HOST || (process.env.NODE_ENV === 'docker' ? 'database' : 'localhost');

const sequelize = new Sequelize(
    process.env.PG_DATABASE || 'ebay_sales_tool',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'password',
    {
        host: pgHost,
        port: process.env.PG_PORT || 5432,
        dialect: 'postgres',
        logging: false // Disable SQL logging for production
    }
);

const pool = new Pool({
    host: pgHost,
    max: 10,
    user: process.env.PG_USER || 'postgres',
    password: process.env.PG_PASSWORD || 'password',
    database: process.env.PG_DATABASE || 'ebay_sales_tool',
    port: process.env.PG_PORT || 5432
});

async function seedDatabaseIfTestFlag() {
    try {
        const result = await pool.query("SELECT config_value FROM AppConfig WHERE config_key = 'testdata'");
        const testDataFlag = result.rows[0]?.config_value === 'true';

        if (testDataFlag) {
            const seedFilePath = path.join(__dirname, '../../database/seeds/sampleData.sql');
            const seedSQL = fs.readFileSync(seedFilePath, 'utf-8');
            await pool.query(seedSQL);
        }
    } catch (error) {
        // Only log errors if needed for production
    }
}

module.exports = {
    sequelize,
    pool,
    seedDatabaseIfTestFlag
};