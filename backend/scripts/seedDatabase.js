const fs = require('fs');
const path = require('path');
const { Pool } = require('pg');

const configPath = path.join(__dirname, '../build.json');
const seedLogFilePath = path.join(__dirname, 'seedDatabase.log');

function log(message) {
    fs.appendFileSync(seedLogFilePath, `${new Date().toISOString()} - ${message}\n`);
    console.log(message);
}

let databaseConfig;

// Add a check to handle the absence of build.json
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

// Prioritize environment variables over configuration file
databaseConfig = {
    host: process.env.PG_HOST || databaseConfig.host,
    user: process.env.PG_USER || databaseConfig.user,
    password: process.env.PG_PASSWORD || databaseConfig.password,
    database: process.env.PG_DATABASE || databaseConfig.database,
    port: process.env.PG_PORT || 5432
};

// Trim environment variables to remove any trailing spaces
databaseConfig.host = databaseConfig.host.trim();

// Log environment variables to confirm their application
console.log('Environment Variables:', {
    PG_HOST: process.env.PG_HOST,
    PG_PORT: process.env.PG_PORT,
    PG_USER: process.env.PG_USER,
    PG_DATABASE: process.env.PG_DATABASE
});

console.log('Database configuration:', {
    host: databaseConfig.host,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    port: databaseConfig.port
});

const pool = new Pool({
    host: databaseConfig.host,
    user: databaseConfig.user,
    password: databaseConfig.password,
    database: databaseConfig.database,
    port: databaseConfig.port // Default PostgreSQL port
});

const seedFilePath = path.join(__dirname, '../../database/seeds/sampleData.sql');

async function waitForDatabaseConnection(retries = 10, delay = 5000) {
    for (let i = 0; i < retries; i++) {
        try {
            const client = new Pool({
                host: databaseConfig.host,
                user: databaseConfig.user,
                password: databaseConfig.password,
                database: databaseConfig.database,
                port: databaseConfig.port
            });
            await client.query('SELECT 1');
            client.end();
            log('Database connection established successfully.');
            return;
        } catch (error) {
            log(`Database connection attempt ${i + 1} failed: ${error.message}`);
            if (i === retries - 1) {
                log('Database is not ready after maximum retries. Exiting...');
                process.exit(1);
            }
            log(`Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function waitForDatabaseReadiness(retries = 10, delay = 5000) {
    for (let attempt = 1; attempt <= retries; attempt++) {
        try {
            await pool.query('SELECT 1');
            log('Database is ready.');
            return;
        } catch (error) {
            log(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === retries) {
                log('Database is not ready after maximum retries. Exiting...');
                process.exit(1);
            }
            log(`Retrying in ${delay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, delay));
        }
    }
}

async function seedDatabase() {
    try {
        console.log('Starting database seeding process...');
        console.log('Seeding process started. Verifying database readiness...');
        await waitForDatabaseReadiness();
        log('Seeding database with test data...');

        if (!fs.existsSync(seedFilePath)) {
            throw new Error(`Seed file not found at ${seedFilePath}`);
        }

        const seedSQL = fs.readFileSync(seedFilePath, 'utf-8');
        await pool.query(seedSQL);

        log('Database seeding completed successfully.');
        console.log('Database seeding process completed successfully.');
    } catch (error) {
        log(`Error seeding database: ${error.message}`);
        process.exit(1);
    } finally {
        await pool.end();
    }
}

async function checkTestDataFlag() {
    // Always return true to force seeding, regardless of AppConfig state
    return true;
}

(async () => {
    console.log('Testing database connectivity...');
    await waitForDatabaseConnection();

    const testDataFlag = await checkTestDataFlag();
    if (!testDataFlag) {
        log('Test data flag is false. Skipping database seeding.');
        return;
    }

    await seedDatabase();
})();

module.exports = { seedDatabase };