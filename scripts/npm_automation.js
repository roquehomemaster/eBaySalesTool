const { exec } = require('child_process');

function runCommand(command, cwd) {
    return new Promise((resolve, reject) => {
        const process = exec(command, { cwd }, (error, stdout, stderr) => {
            if (error) {
                console.error(`Error: ${stderr}`);
                reject(error);
            } else {
                console.log(stdout);
                resolve(stdout);
            }
        });

        process.stdout.on('data', (data) => console.log(data));
        process.stderr.on('data', (data) => console.error(data));
    });
}

async function automateNpmTasks() {
    try {
        console.log('Installing backend dependencies...');
        await runCommand('npm install', '../backend');

        console.log('Installing frontend dependencies...');
        await runCommand('npm install', '../frontend');

        console.log('Running npm audit fix for backend...');
        await runCommand('npm audit fix --force', '../backend');

        console.log('Running npm audit fix for frontend...');
        await runCommand('npm audit fix --force', '../frontend');

        console.log('All NPM tasks completed successfully.');
    } catch (error) {
        console.error('An error occurred during the NPM automation process:', error);
    }
}

const config = {
    apis: ['./src/routes/*.js'], // Path to your route files
};

automateNpmTasks();