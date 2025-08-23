const { Pool } = require('pg');
const axios = require('axios');
const util = require('util');
const exec = util.promisify(require('child_process').exec);

const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'listflowhq',
    password: process.env.PG_PASSWORD || 'password',
    port: process.env.PG_PORT || 5432,
});

async function checkHealth() {
    let isDatabaseReady = false;
    let isApiReady = false;

    while (!isDatabaseReady || !isApiReady) {
        try {
            console.log('Checking database readiness...');
            const { stdout } = await exec("docker logs postgres_db");
            if (stdout.includes('LOG:  database system is ready to accept connections')) {
                console.log('Database is ready.');
                isDatabaseReady = true;
            } else {
                console.log('Database is not ready yet.');
            }

            if (isDatabaseReady) {
                console.log('Checking API readiness...');
                const response = await axios.get('http://localhost:5000/api/health');
                if (response.status === 200 && response.data.status === 'ok') {
                    console.log('API is ready.');
                    isApiReady = true;
                } else {
                    console.log('API is not ready yet. Response:', response.data);
                }
            }
        } catch (error) {
            console.error('Health check error:', error.message);
        }

        if (!isDatabaseReady || !isApiReady) {
            console.log('Waiting for database and API to be ready...');
            await new Promise(resolve => setTimeout(resolve, 5000));
        }
    }

    console.log('Database and API are ready. Waiting 5 seconds for stability...');
    await new Promise(resolve => setTimeout(resolve, 5000));
    console.log('Health check passed.');
    process.exit(0);
}

checkHealth();