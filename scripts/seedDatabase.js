const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const configPath = path.join(__dirname, '../../build.json');
const seedLogFilePath = path.join(__dirname, 'seedDatabase.log');

function log(message) {
    fs.appendFileSync(seedLogFilePath, `${new Date().toISOString()} - ${message}\n`);
    console.log(message);
}

let databaseConfig;

if (!fs.existsSync(configPath)) {
    console.warn(`Warning: build.json not found at ${configPath}. Proceeding with default configuration.`);
    databaseConfig = {
        host: 'localhost',
        user: 'default_user',
        password: 'default_password',
        database: 'default_db',
        port: 5432
    };
    log('Default database configuration applied.');
} else {
    databaseConfig = JSON.parse(fs.readFileSync(configPath, 'utf8')).database;
    log('Database configuration loaded successfully.');
}

databaseConfig = {
    host: process.env.PG_HOST || databaseConfig.host,
    user: process.env.PG_USER || databaseConfig.user,
    password: process.env.PG_PASSWORD || databaseConfig.password,
    database: process.env.PG_DATABASE || databaseConfig.database,
    port: process.env.PG_PORT || 5432
};

databaseConfig.host = databaseConfig.host.trim();

const pool = new Pool({
    host: databaseConfig.host,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    port: databaseConfig.port
});

const seedFilePath = path.join(__dirname, '../../../database/seeds/sampleData.sql');

async function seedDatabase() {
    try {
        if (!fs.existsSync(seedFilePath)) {
            throw new Error(`Seed file not found at ${seedFilePath}`);
        }
        const seedSQL = fs.readFileSync(seedFilePath, 'utf-8');
        await pool.query(seedSQL);
        log('Database seeding completed successfully.');
    } catch (error) {
        log(`Error seeding database: ${error.message}`);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

(async () => {
    await seedDatabase();
})();

module.exports = { seedDatabase };
