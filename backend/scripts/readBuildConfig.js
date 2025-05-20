const fs = require('fs');
const path = require('path');

const configPath = path.join(__dirname, '../backend/build.json');

console.log('Attempting to read build.json from:', configPath);

// Add a check to handle the absence of build.json
if (!fs.existsSync(configPath)) {
    console.warn(`Warning: build.json not found at ${configPath}. Proceeding with default configuration.`);
    module.exports = {};
} else {
    try {
        const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));
        console.log('Loaded build.json:', config);
        module.exports = config;
    } catch (error) {
        console.error('Error reading or parsing build.json:', error.message);
        module.exports = {};
    }
}