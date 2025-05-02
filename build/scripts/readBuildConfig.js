const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../build.json');

try {
    console.log('Attempting to read build.json from:', configPath);

    if (!fs.existsSync(configPath)) {
        throw new Error(`build.json not found at ${configPath}`);
    }

    const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

    console.log('Loaded build.json:', config);

    console.log(`SET BUILD_ENVIRONMENT=${config.environment}`);
    console.log(`SET BUILD_TESTDATA=${config.testdata}`);
    console.log(`SET BUILD_BACKEND=${config.backend.build}`);
    console.log(`SET BUILD_FRONTEND=${config.frontend.build}`);
    console.log(`SET DOCKER_USE_COMPOSE=${config.docker.use_compose}`);
    console.log(`SET DOCKER_COMPOSE_FILE=${config.docker.compose_file}`);
} catch (error) {
    console.error('Error reading or parsing build.json:', error.message);
    console.error('Stack trace:', error.stack);
    process.exit(1);
}