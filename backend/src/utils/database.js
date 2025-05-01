const { Sequelize } = require('sequelize');
const { Pool } = require('pg');
const fs = require('fs');
const path = require('path');

const sequelize = new Sequelize(
    process.env.PG_DATABASE || 'ebay_sales_tool',
    process.env.PG_USER || 'postgres',
    process.env.PG_PASSWORD || 'password',
    {
        host: process.env.PG_HOST || 'localhost',
        port: process.env.PG_PORT || 5432,
        dialect: 'postgres',
        logging: false // Disable logging for cleaner output
    }
);

const pool = new Pool();

async function seedDatabaseIfTestFlag() {
    try {
        const result = await pool.query("SELECT config_value FROM AppConfig WHERE config_key = 'testdata'");
        const testDataFlag = result.rows[0]?.config_value === 'true';

        if (testDataFlag) {
            console.log('Seeding database with test data...');
            const seedFilePath = path.join(__dirname, '../../database/seeds/sampleData.sql');
            const seedSQL = fs.readFileSync(seedFilePath, 'utf-8');
            await pool.query(seedSQL);
            console.log('Database seeded successfully.');
        } else {
            console.log('Test data flag is false. Skipping database seeding.');
        }
    } catch (error) {
        console.error('Error checking test data flag or seeding database:', error);
    }
}

module.exports = {
    sequelize,
    pool,
    seedDatabaseIfTestFlag
};