// backend/scripts/runApiTests.js
// Runs all backend API tests using Jest and writes results to logs/test-results.txt

const { exec } = require('child_process');
const path = require('path');
const fs = require('fs');

const backendRoot = path.resolve(__dirname, '../');
const resultsPath = path.resolve(__dirname, '../../logs/test-results.txt');

const jestCmd = `npx jest --runInBand --testPathPattern=tests`;

console.log('Running API tests with Jest...');

const proc = exec(jestCmd, { cwd: backendRoot, shell: true }, (error, stdout, stderr) => {
    // Write both stdout and stderr to the results file
    fs.writeFileSync(resultsPath, stdout + '\n' + stderr);
    if (error) {
        console.error('API tests failed. See logs/test-results.txt for details.');
        process.exit(error.code || 1);
    } else {
        console.log('API tests passed. See logs/test-results.txt for details.');
        process.exit(0);
    }
});

// Also stream output to console for live feedback
proc.stdout.pipe(process.stdout);
proc.stderr.pipe(process.stderr);
