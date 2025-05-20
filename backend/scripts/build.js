const fs = require('fs');
const path = require('path');
const { execSync, spawnSync } = require('child_process');
const { Client } = require('pg');
const { seedDatabase } = require('./seedDatabase');

const logFilePath = path.join(__dirname, 'build.log');
const configPath = path.join(__dirname, '../build.json');

function log(message) {
    fs.appendFileSync(logFilePath, `${new Date().toISOString()} - ${message}\n`);
    console.log(message);
}

process.on('uncaughtException', (error) => {
    log(`Unhandled error: ${error.message}`);
    log(`Stack trace: ${error.stack}`);
    process.exit(1);
});

function readConfig() {
    try {
        log('Reading build.json configuration...');
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        log('Configuration loaded successfully.');
        return config;
    } catch (error) {
        log(`Error reading build.json: ${error.message}`);
        process.exit(1);
    }
}

// Load configuration at the start of the script
const config = readConfig();
log('Debugging full config object:', JSON.stringify(config, null, 2)); // Add debug log

function setEnvironmentVariablesFromConfig(config) {
    process.env.PG_HOST = 'postgres_db'; // Ensure PG_HOST is set to the correct value
    process.env.PG_PORT = config.database.port;
    process.env.PG_USER = config.database.user;
    process.env.PG_PASSWORD = config.database.password;
    process.env.PG_DATABASE = config.database.database;
    process.env.SUBNET = config.subnet; // Ensure the subnet is set
    process.env.NETWORK_SUBNET = config.network.subnet; // Restore networking information
    process.env.POSTGRES_DB_IP = config.network.postgresDbIp;
    process.env.BACKEND_IP = config.network.backendIp;
    process.env.FRONTEND_IP = config.network.frontendIp;
}

const { maxRetries, retryDelay, healthCheckRetries, healthCheckDelay } = config.constants;

function runCommand(command, args, options = {}) {
    if (process.platform === 'win32') {
        if (command === 'npm') {
            command = 'npm.cmd';
        }
    }

    const result = spawnSync(command, args, { ...options, encoding: 'utf-8' });
    if (result.stdout) {
        log(result.stdout);
    }
    if (result.stderr) {
        log(result.stderr);
    }
    if (result.error || result.status !== 0) {
        throw new Error(result.error || result.stderr || `Command failed with exit code ${result.status}`);
    }
}

function verifyDependencies(directory) {
    log(`Verifying dependencies in ${directory}...`);
    try {
        const result = spawnSync('npm', ['ls', '--depth=0'], { cwd: directory, encoding: 'utf-8' });
        if (result.stderr) {
            log(`Dependency verification failed: ${result.stderr}`);
            process.exit(1);
        }
        log(`Dependencies verified successfully in ${directory}.`);
    } catch (error) {
        log(`Error verifying dependencies in ${directory}: ${error.message}`);
        process.exit(1);
    }
}

function buildBackend(config) {
    log('Debugging config.build.backend:', JSON.stringify(config.build.backend, null, 2)); // Update debug log

    if (config.build.backend.build) { // Corrected path to access the build property
        log('Building backend...');

        const backendPath = config.paths.backend;
        const backendBuildOptions = {
            cwd: backendPath,
            stdio: 'inherit',
            env: { ...process.env, PATH: process.env.PATH },
        };

        try {
            log(`Running npm install in backend path: ${backendPath}`);
            log(`Environment Variables: ${JSON.stringify(backendBuildOptions.env)}`);

            // Fallback to execSync for debugging
            const installCommand = `npm.cmd install --no-update-notifier --no-audit`;
            execSync(installCommand, backendBuildOptions);

            verifyDependencies(backendPath);

            const buildCommand = `npm.cmd run build`;
            execSync(buildCommand, backendBuildOptions);

            log('Backend build completed successfully.');
        } catch (error) {
            log(`Error building backend: ${error.message}`);
            process.exit(1);
        }
    } else {
        log('Skipping backend build.');
    }
}

function buildFrontend(config) {
    log('Debugging config.build.frontend:', JSON.stringify(config.build.frontend, null, 2)); // Update debug log

    if (config.build.frontend.build) { // Corrected path to access the build property
        log('Building frontend...');

        const frontendPath = config.paths.frontend;
        const frontendBuildOptions = {
            cwd: frontendPath,
            stdio: 'inherit',
            env: { ...process.env, PATH: process.env.PATH },
        };

        try {
            log(`Running npm install in frontend path: ${frontendPath}`);
            log(`Environment Variables: ${JSON.stringify(frontendBuildOptions.env)}`);

            // Fallback to execSync for debugging
            const installCommand = `npm.cmd install --no-update-notifier --no-audit`;
            execSync(installCommand, frontendBuildOptions);

            verifyDependencies(frontendPath);

            const buildCommand = `npm.cmd run build`;
            execSync(buildCommand, frontendBuildOptions);

            log('Frontend build completed successfully.');
        } catch (error) {
            log(`Error building frontend: ${error.message}`);
            process.exit(1);
        }
    } else {
        log('Skipping frontend build.');
    }
}

async function ensureContainersStopped() {
    log('Ensuring all containers are stopped...');
    try {
        const runningContainers = execSync('docker ps -q', { encoding: 'utf-8' }).trim().split('\n');
        if (runningContainers.length > 0) {
            if (runningContainers[0] !== '') {
                log('Stopping running Docker containers...');
                runningContainers.forEach((containerId) => {
                    runCommand('docker', ['stop', containerId]);
                });
                log('All running Docker containers have been stopped.');
            }
        } else {
            log('No running Docker containers found.');
        }
    } catch (error) {
        log(`Error ensuring containers are stopped: ${error.message}`);
        process.exit(1);
    }
}

async function startDockerContainers(config) {
    log('Debugging config.build.docker:', JSON.stringify(config.build.docker, null, 2)); // Update debug log

    await ensureContainersStopped();

    if (config.build.docker.use_compose) { // Corrected path to access the docker property
        log('Starting Docker containers...');
        try {
            const composeFilePath = config.paths.dockerComposeFile;
            runCommand('docker-compose', ['-f', composeFilePath, 'up', '--build', '-d']);
            log('Docker containers started successfully.');
        } catch (error) {
            log(`Error starting Docker containers: ${error.message}`);
            process.exit(1);
        }
    } else {
        log('Skipping Docker container startup.');
    }
}

async function waitForDatabaseReadiness(config) {
    log('Waiting for the database to be ready...');

    for (let attempt = 1; attempt <= 10; attempt++) {
        try {
            // Defensive: ensure password is always a string and not undefined/null
            const password = config.database.password != null ? String(config.database.password) : '';
            const client = new Client({
                host: config.database.host,
                port: config.database.port,
                user: config.database.user,
                password,
                database: config.database.database
            });

            await client.connect();
            await client.end();

            log('Database is ready.');
            return;
        } catch (error) {
            log(`Attempt ${attempt} failed: ${error.message}`);
            if (attempt === 10) {
                log('Database is not ready after maximum retries. Exiting...');
                process.exit(1);
            }
            log(`Retrying in ${retryDelay / 1000} seconds...`);
            await new Promise(resolve => setTimeout(resolve, retryDelay));
        }
    }
}

function waitForAllContainers(config) {
    log('Waiting for all containers to be fully operational...');
    const delay = retryDelay; // Use retryDelay from build.json for consistency

    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = execSync('docker ps --filter "status=running" --format "{{.Names}}"', { encoding: 'utf-8' }).trim();
            const expectedContainers = ['postgres_db', 'ebaysalestool-backend-1']; // Only check DB and backend
            const runningContainers = result.split('\n');

            if (expectedContainers.every((container) => runningContainers.includes(container))) {
                log('All containers are fully operational.');
                return;
            }

            log(`Attempt ${attempt}: Not all containers are running. Retrying in ${delay / 1000} seconds...`);
        } catch (error) {
            log(`Attempt ${attempt} failed: ${error.message}`);
        }

        if (attempt === maxRetries) {
            log('Containers are not fully operational after maximum retries. Exiting...');
            process.exit(1);
        }

        execSync(`timeout ${delay / 1000}`, { stdio: 'inherit' });
    }
}

// --- Add robust seeding: TRUNCATE tables before seeding via API ---
async function robustApiSeed() {
    const axios = require('axios');
    // Remove '"users"' from the list, and add a comment for later development
    const tablesToTruncate = [
        '"eBayInfo"', '"SalesHistory"', '"HistoryLogs"', '"OwnershipAgreements"', '"Ownership"',
        '"SellingItem"', '"sales"', '"ItemMaster"', '"CustomerDetails"', '"FinancialTracking"',
        '"CommunicationLogs"', '"PerformanceMetrics"', '"AppConfig"' // '"users"' removed, add back when user table is reintroduced
    ];
    try {
        log('Truncating all relevant tables before seeding...');
        const { Client } = require('pg');
        const client = new Client({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
        });
        await client.connect();
        await client.query('SET session_replication_role = replica;'); // Disable FK checks
        for (const table of tablesToTruncate) {
            await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
        }
        await client.query('SET session_replication_role = DEFAULT;'); // Restore FK checks
        await client.end();
        log('All tables truncated successfully.');
    } catch (err) {
        log('Error truncating tables before seeding: ' + err.message);
        process.exit(1);
    }
    try {
        const apiUrl = 'http://localhost:5000/api/populate-database';
        const response = await axios.post(apiUrl);
        log('API-based database seeding response: ' + response.data);
    } catch (err) {
        log('Error: Failed to populate the database via API. ' + (err.response ? err.response.data : err.message));
        process.exit(1);
    }
}

async function waitForContainerHealth(containerName) {
    log(`Waiting for container ${containerName} to be healthy...`);
    for (let attempt = 1; attempt <= healthCheckRetries; attempt++) {
        try {
            const inspect = JSON.parse(execSync(`docker inspect ${containerName}`, { encoding: 'utf-8' }))[0];
            if (inspect.State && inspect.State.Health) {
                const result = inspect.State.Health.Status;
                if (result === 'healthy') {
                    log(`Container ${containerName} is healthy.`);
                    return;
                } else {
                    log(`Attempt ${attempt}: Container ${containerName} is not healthy yet. Status: ${result}`);
                }
            } else if (inspect.State && inspect.State.Status === 'running') {
                log(`Container ${containerName} is running (no healthcheck defined).`);
                return;
            } else {
                log(`Attempt ${attempt}: Container ${containerName} is not running. Status: ${inspect.State ? inspect.State.Status : 'unknown'}`);
            }
        } catch (error) {
            log(`Attempt ${attempt} failed: ${error.message}`);
        }

        if (attempt === healthCheckRetries) {
            log(`Container ${containerName} did not become healthy/running after ${healthCheckRetries} attempts. Exiting...`);
            process.exit(1);
        }

        log(`Retrying in ${healthCheckDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, healthCheckDelay));
    }
}

async function waitForAllContainersHealth() {
    const containers = ['postgres_db', 'ebaysalestool-backend-1']; // Only check DB and backend for now
    for (const container of containers) {
        await waitForContainerHealth(container);
    }
}

async function verifyContainerHealth(containerName) {
    log(`Verifying health of container: ${containerName}`);
    for (let attempt = 1; attempt <= healthCheckRetries; attempt++) {
        try {
            const inspect = JSON.parse(execSync(`docker inspect ${containerName}`, { encoding: 'utf-8' }))[0];
            if (inspect.State && inspect.State.Health) {
                const healthStatus = inspect.State.Health.Status;
                if (healthStatus === 'healthy') {
                    log(`Container ${containerName} is healthy.`);
                    return;
                } else {
                    log(`Attempt ${attempt}: Container ${containerName} is not healthy. Status: ${healthStatus}`);
                }
            } else if (inspect.State && inspect.State.Status === 'running') {
                log(`Container ${containerName} is running (no healthcheck defined).`);
                return;
            } else {
                log(`Attempt ${attempt}: Container ${containerName} is not running. Status: ${inspect.State ? inspect.State.Status : 'unknown'}`);
            }
        } catch (error) {
            log(`Attempt ${attempt} failed: ${error.message}`);
        }

        if (attempt === healthCheckRetries) {
            log(`Container ${containerName} did not become healthy/running after ${healthCheckRetries} attempts. Exiting...`);
            process.exit(1);
        }

        log(`Retrying in ${healthCheckDelay / 1000} seconds...`);
        await new Promise(resolve => setTimeout(resolve, healthCheckDelay));
    }
}

async function verifyAllContainersHealth() {
    const containers = ['postgres_db', 'ebaysalestool-backend-1']; // Only check DB and backend for now
    for (const container of containers) {
        await verifyContainerHealth(container);
    }
}

function ensureNpmInPath() {
    try {
        const npmPath = execSync('where npm', { encoding: 'utf-8' }).trim();
        const npmDir = path.dirname(npmPath);
        process.env.PATH = `${npmDir};${process.env.PATH}`;
        log(`Ensured npm is in PATH: ${npmDir}`);
    } catch (error) {
        log(`Error ensuring npm in PATH: ${error.message}`);
        log('Attempting to manually set npm path based on Node.js installation...');

        // Fallback: Manually set npm path based on common Node.js installation locations
        const fallbackNpmPath = 'D:\\Program Files\\nodejs\\npm.cmd';
        if (fs.existsSync(fallbackNpmPath)) {
            const fallbackNpmDir = path.dirname(fallbackNpmPath);
            process.env.PATH = `${fallbackNpmDir};${process.env.PATH}`;
            log(`Manually set npm path to: ${fallbackNpmDir}`);
        } else {
            log('Fallback npm path does not exist. Exiting...');
            process.exit(1);
        }
    }
}

function testNpmExecution() {
    log('Testing npm execution with execSync...');
    try {
        const npmVersion = execSync('npm.cmd --version', { encoding: 'utf-8' }).trim();
        log(`npm version: ${npmVersion}`);
        log('npm execution test passed successfully.');
    } catch (error) {
        log(`Error testing npm execution with execSync: ${error.message}`);
        log('Falling back to logging environment variables for debugging...');

        // Log environment variables for debugging
        log('Environment Variables:');
        Object.keys(process.env).forEach((key) => {
            log(`${key}: ${process.env[key]}`);
        });

        process.exit(1);
    }
}

function logConstantsAndVariables() {
    log('Logging constants and variables:');
    log(`Max Retries: ${maxRetries}`);
    log(`Retry Delay: ${retryDelay}`);
    log(`Health Check Retries: ${healthCheckRetries}`);
    log(`Health Check Delay: ${healthCheckDelay}`);
    log(`Network Subnet: ${process.env.NETWORK_SUBNET}`);
    log(`Postgres DB IP: ${process.env.POSTGRES_DB_IP}`);
    log(`Backend IP: ${process.env.BACKEND_IP}`);
    log(`Frontend IP: ${process.env.FRONTEND_IP}`);
    log(`Database Host: ${config.database.host}`);
    log(`Database User: ${config.database.user}`);
    log(`Database Name: ${config.database.database}`);
    log(`Docker Compose File: ${config.paths.dockerComposeFile}`);
    log(`Backend Path: ${config.paths.backend}`);
    log(`Frontend Path: ${config.paths.frontend}`);
    log(`Build Scripts Path: ${config.paths.buildScripts}`);
    log(`Test Data Flag: ${config.testdata}`);
}

async function main() {
    log('Starting build process...');

    // Step 1: Clear the log file
    fs.writeFileSync(logFilePath, '');
    log('Cleared previous log.');

    // Step 2: Ensure npm is in PATH
    ensureNpmInPath();

    // Step 3: Test npm execution
    testNpmExecution();

    // Step 4: Set environment variables and log them
    setEnvironmentVariablesFromConfig(config);
    log('Environment variables set successfully.');

    // Step 5: Log constants and variables
    logConstantsAndVariables();

    // Step 6: Check if Docker containers are running and stop them
    await ensureContainersStopped();

    // Step 7: Build the backend and frontend environments
    buildBackend(config);
    buildFrontend(config);

    // Step 8: Start Docker containers
    await startDockerContainers(config);

    // Step 9: Verify container health
    await verifyAllContainersHealth();

    // Step 10: Wait for the database to be ready
    await waitForDatabaseReadiness(config);

    // Step 11: Seed the database if the testdata flag is true
    if (config.testdata === true) {
        log('testdata flag is true: truncating tables and seeding database via API endpoint...');
        await robustApiSeed();
    } else {
        log('testdata flag is not true: skipping API-based database seeding.');
    }

    // Step 12: Log completion of the build process
    log('Build process completed successfully.');
}

main();