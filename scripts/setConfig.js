const { Pool } = require('pg');

const pool = new Pool();

async function setConfig(key, value) {
    try {
        await pool.query(
            `INSERT INTO AppConfig (config_key, config_value, data_type, scope, environment) 
             VALUES ($1, $2, 'boolean', 'global', 'all') 
             ON CONFLICT (config_key) DO UPDATE SET config_value = $2`,
            [key, value]
        );
        console.log(`Configuration updated: ${key} = ${value}`);
    } catch (error) {
        console.error('Error updating configuration:', error);
    } finally {
        await pool.end();
    }
}

const key = process.argv[2];
const value = process.argv[3];

if (!key || !value) {
    console.error('Usage: node setConfig.js <key> <value>');
    process.exit(1);
}

setConfig(key, value);