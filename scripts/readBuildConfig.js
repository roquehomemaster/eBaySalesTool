const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../build.json');
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

console.log(`Setting build environment to ${config.environment}`);
process.env.BUILD_ENVIRONMENT = config.environment;
process.env.BUILD_TESTDATA = config.testdata;
process.env.BUILD_BACKEND = config.backend.build;
process.env.BUILD_FRONTEND = config.frontend.build;
process.env.DOCKER_USE_COMPOSE = config.docker.use_compose;
process.env.DOCKER_COMPOSE_FILE = config.docker.compose_file;