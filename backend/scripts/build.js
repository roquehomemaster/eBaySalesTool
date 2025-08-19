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
// Set DB host for all uses immediately after loading config
let inDocker = false;
try {
    inDocker = fs.existsSync('/.dockerenv') ||
        (fs.existsSync('/proc/1/cgroup') && fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker'));
} catch (e) {}
config.database.host = inDocker ? 'postgres_db' : 'localhost';
log('Debugging full config object:', JSON.stringify(config, null, 2));

function setEnvironmentVariablesFromConfig(config) {
    // Detect if running inside Docker
    let inDocker = false;
    try {
        inDocker = fs.existsSync('/.dockerenv') ||
            (fs.existsSync('/proc/1/cgroup') && fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker'));
    } catch (e) {}
    // Use service name in Docker, static IP on host
    // Always use 'localhost' for PG_HOST unless running inside Docker
    process.env.PG_HOST = inDocker ? 'postgres_db' : 'localhost';
    process.env.PG_PORT = config.database.port;
    process.env.PG_USER = config.database.user;
    process.env.PG_PASSWORD = config.database.password;
    process.env.PG_DATABASE = config.database.database;
    process.env.SUBNET = config.network.subnet;
    process.env.NETWORK_SUBNET = config.network.subnet;
    process.env.POSTGRES_DB_IP = config.network.postgresDbIp;
    process.env.BACKEND_IP = config.network.backendIp;
    process.env.FRONTEND_IP = config.network.frontendIp;
    // Remove dbHost reference, already set above if needed
}

const { maxRetries, retryDelay, healthCheckRetries, healthCheckDelay } = config.constants;

function runCommand(command, args, options = {}) {
    if (process.platform === 'win32' && command === 'npm') {
        command = 'npm.cmd';
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
    log('Debugging config.build.backend:', JSON.stringify(config.build.backend, null, 2));
    if (config.build.backend.build) {
        log('Building backend...');
        const backendPath = config.paths.backend;
        const backendBuildOptions = {
            cwd: backendPath,
            stdio: 'inherit',
            env: { ...process.env, PATH: process.env.PATH },
        };
        try {
            if (process.env.SKIP_NPM_INSTALL === 'true') {
                log('SKIP_NPM_INSTALL=true -> skipping backend dependency install.');
            } else {
                log(`Installing backend dependencies in: ${backendPath}`);
                const lockExists = fs.existsSync(path.join(backendPath, 'package-lock.json'));
                const installCmd = lockExists ? 'npm.cmd ci --no-audit' : 'npm.cmd install --no-audit --no-update-notifier';
                log(`Using command: ${installCmd}`);
                execSync(installCmd, backendBuildOptions);
                // Forbidden dependency scan (prevent reintroduction of removed tech like MongoDB)
                const forbidden = ['mongoose', 'mongodb'];
                const pkg = JSON.parse(fs.readFileSync(path.join(backendPath, 'package.json'), 'utf-8'));
                const deps = { ...(pkg.dependencies||{}), ...(pkg.devDependencies||{}) };
                const found = Object.keys(deps).filter(d => forbidden.includes(d));
                if (found.length) {
                    log(`Forbidden dependencies detected: ${found.join(', ')}`);
                    throw new Error('Forbidden dependencies present');
                }
            }
            verifyDependencies(backendPath);
            execSync('npm.cmd run build', backendBuildOptions);
            log('Backend build completed successfully.');
            // Generate merged Swagger spec so runtime /api-docs is up-to-date
            try {
                log('Generating merged Swagger specification...');
                execSync('node scripts/generate_swagger.js', backendBuildOptions);
                log('Swagger specification generated successfully.');
                try {
                    log('Validating swagger.json...');
                    execSync('node scripts/validate_swagger.js', backendBuildOptions);
                    log('Swagger validation complete.');
                } catch (ve) {
                    log('Swagger validation failed: ' + ve.message);
                    process.exit(1);
                }
            } catch (e) {
                log('Error generating Swagger specification: ' + e.message);
                process.exit(1);
            }
        } catch (error) {
            log(`Error building backend: ${error.message}`);
            process.exit(1);
        }
    } else {
        log('Skipping backend build.');
    }
}

function buildFrontend(config) {
    log('Debugging config.build.frontend:', JSON.stringify(config.build.frontend, null, 2));
    if (config.build.frontend.build) {
        log('Building frontend...');
        const frontendPath = config.paths.frontend;
        const frontendBuildOptions = {
            cwd: frontendPath,
            stdio: 'inherit',
            env: { ...process.env, PATH: process.env.PATH },
        };
        try {
            if (process.env.SKIP_NPM_INSTALL === 'true') {
                log('SKIP_NPM_INSTALL=true -> skipping frontend dependency install.');
            } else {
                log(`Installing frontend dependencies in: ${frontendPath}`);
                const lockExists = fs.existsSync(path.join(frontendPath, 'package-lock.json'));
                const installCmd = lockExists ? 'npm.cmd ci --no-audit' : 'npm.cmd install --no-audit --no-update-notifier';
                log(`Using command: ${installCmd}`);
                execSync(installCmd, frontendBuildOptions);
            }
            verifyDependencies(frontendPath);
            execSync('npm.cmd run build', frontendBuildOptions);
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
    log('Debugging config.build.docker:', JSON.stringify(config.build.docker, null, 2));
    await ensureContainersStopped();
    if (config.build.docker.use_compose) {
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
            const password = config.database.password != null ? String(config.database.password) : '';
            log(`[waitForDatabaseReadiness] Attempt ${attempt}: Connecting to host=${config.database.host}, port=${config.database.port}`);
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
            log(`[waitForDatabaseReadiness] Attempt ${attempt} failed: ${error.message}`);
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
    const delay = retryDelay;
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
        try {
            const result = execSync('docker ps --filter "status=running" --format "{{.Names}}"', { encoding: 'utf-8' }).trim();
            const expectedContainers = ['postgres_db', 'ebaysalestool-backend'];
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
    // Only truncate tables that exist, to avoid errors if a table is missing (e.g., ebayinfo)
    const allPossibleTables = [
        // Core master tables first to clear potential PK/sequence conflicts
        'catalog', 'listing', 'roles', 'application_account', 'customer',
        // Domain tables
        'ownership', 'ownershipagreements', 'sales', 'saleshistory', 'order_details',
        'shippinglog', 'financialtracking', 'customerdetails', 'product_research',
        'communicationlogs', 'performancemetrics', 'returnhistory',
        // Config and auxiliary
        'appconfig', 'database_configuration',
        // eBay info snapshot table
        'ebayinfo', 'historylogs'
    ];
    let tablesToTruncate = [];
    try {
        const { Client } = require('pg');
        const client = new Client({
            host: config.database.host,
            port: config.database.port,
            user: config.database.user,
            password: config.database.password,
            database: config.database.database
        });
        await client.connect();
        for (const table of allPossibleTables) {
            const tableName = table.replace(/"/g, '');
            const res = await client.query(`SELECT to_regclass('public."${tableName}"') as exists`);
            if (res.rows[0].exists) {
                tablesToTruncate.push(table);
            }
        }
        await client.end();
    } catch (err) {
        log('Error checking table existence before truncation: ' + err.message);
        process.exit(1);
    }
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
        await client.query('SET session_replication_role = replica;');
        for (const table of tablesToTruncate) {
            await client.query(`TRUNCATE TABLE ${table} RESTART IDENTITY CASCADE;`);
        }
        await client.query('SET session_replication_role = DEFAULT;');
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
    const containers = ['postgres_db', 'ebaysalestool-backend'];
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
    const containers = ['postgres_db', 'ebaysalestool-backend'];
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
    fs.writeFileSync(logFilePath, '');
    log('Cleared previous log.');
    ensureNpmInPath();
    testNpmExecution();
    setEnvironmentVariablesFromConfig(config);
    log('Environment variables set successfully.');
    logConstantsAndVariables();
    await ensureContainersStopped();
    buildBackend(config);
    buildFrontend(config);
    await startDockerContainers(config);
    await verifyAllContainersHealth();
    await waitForDatabaseReadiness(config);
    // Runtime Swagger endpoint validation to catch blank UI issues early
    try {
        log('Validating runtime Swagger endpoints (HTTP)...');
        const axios = require('axios');
        // Try primary path first
        const spec1 = await axios.get('http://localhost:5000/swagger.json', { timeout: 5000 }).then(r=>r.data).catch(()=>null);
        const spec2 = await axios.get('http://localhost:5000/api-docs/swagger.json', { timeout: 5000 }).then(r=>r.data).catch(()=>null);
        if (!spec1 && !spec2) {
            throw new Error('Both /swagger.json and /api-docs/swagger.json are unreachable');
        }
        const spec = spec2 || spec1;
        if (!spec.openapi && !spec.swagger) {
            throw new Error('Swagger endpoint returned JSON without openapi/swagger field');
        }
        if (!spec.paths || Object.keys(spec.paths).length === 0) {
            throw new Error('Swagger spec has zero paths (unexpected)');
        }
        log(`Swagger runtime validation OK (paths=${Object.keys(spec.paths).length}).`);
    } catch (e) {
        log('Runtime Swagger validation FAILED: ' + e.message);
        process.exit(1);
    }
    // Always seed the database before tests to ensure a known state for testing
    if (config.testdata === true) {
        log('Seeding database before tests to ensure a known state for testing...');
        await robustApiSeed();
    } else {
        log('testdata flag is not true: skipping pre-test database seeding.');
    }
    if (config.runApiTests === true) {
        log('runApiTests flag is true: running API tests...');
        try {
            const testResultsPath = path.resolve(__dirname, '../../logs/API-Test-Results.txt');
            // Windows-compatible environment variable assignment
            // Use 'localhost' for PG_HOST on host, 'postgres_db' inside Docker
            let inDocker = false;
            try {
                inDocker = fs.existsSync('/.dockerenv') ||
                    (fs.existsSync('/proc/1/cgroup') && fs.readFileSync('/proc/1/cgroup', 'utf-8').includes('docker'));
            } catch (e) {}
            // Always set PG_HOST=localhost for Jest tests run on host
            const testEnv = {
                ...process.env,
                PG_HOST: 'localhost',
                PG_USER: 'postgres',
                PG_PASSWORD: 'password',
                PG_DATABASE: 'ebay_sales_tool',
                PG_PORT: '5432'
            };
            // Removed --forceExit now that open handles are resolved; rely on proper teardown to exit cleanly.
            // Explicitly set NODE_ENV=test to guard any environment-specific logic.
            testEnv.NODE_ENV = 'test';
            const testCommand = `npx jest --runInBand --detectOpenHandles --testPathPattern=tests > "${testResultsPath}" 2>&1`;
            log(`Running: ${testCommand}`);
            execSync(testCommand, { cwd: path.resolve(__dirname, '../'), stdio: 'inherit', shell: true, env: testEnv });
            log('API tests executed and results written to logs/API-Test-Results.txt');
            if (fs.existsSync(testResultsPath)) {
                const apiResults = fs.readFileSync(testResultsPath, 'utf-8');
                fs.appendFileSync(logFilePath, '\n===== API TEST RESULTS =====\n' + apiResults + '\n===========================\n');
                log('API test results appended to build.log');
            } else {
                log('API test results file not found, nothing to append.');
            }
        } catch (error) {
            log(`Error running API tests: ${error.message}`);
            process.exit(1);
        }
    } else {
        log('runApiTests flag is not true: skipping API tests.');
    }
    log('Build process completed successfully.');
}

main();