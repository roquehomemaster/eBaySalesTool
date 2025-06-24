const { execSync } = require('child_process');

const healthCheckRetries = 20; // Number of attempts
const healthCheckDelay = 10000; // Delay in ms between attempts

function getContainerHealth(containerName) {
    try {
        const inspectOutput = execSync(`docker inspect ${containerName}`, { encoding: 'utf-8' });
        const inspectData = JSON.parse(inspectOutput);
        const containerState = inspectData[0]?.State;
        if (containerState?.Health) {
            return containerState.Health.Status;
        } else if (containerState?.Status === 'running') {
            return 'no-healthcheck';
        } else {
            return containerState?.Status || 'unknown';
        }
    } catch (error) {
        return 'error';
    }
}

async function waitForContainerHealth(containerName) {
    for (let attempt = 1; attempt <= healthCheckRetries; attempt++) {
        const status = getContainerHealth(containerName);
        if (status === 'healthy') {
            console.log(`${containerName} is healthy.`);
            return true;
        } else if (status === 'no-healthcheck') {
            console.log(`${containerName} is running but has no health check defined.`);
            return true;
        } else if (status === 'error') {
            console.error(`Error inspecting ${containerName}. Attempt ${attempt} of ${healthCheckRetries}.`);
        } else {
            console.log(`${containerName} health status: ${status} (Attempt ${attempt}/${healthCheckRetries})`);
        }
        if (attempt < healthCheckRetries) {
            await new Promise(resolve => setTimeout(resolve, healthCheckDelay));
        }
    }
    console.error(`${containerName} did not become healthy after ${healthCheckRetries} attempts.`);
    return false;
}

async function main() {
    const containers = ['postgres_db', 'ebaysalestool-backend', 'frontend'];
    let allHealthy = true;
    for (const container of containers) {
        const healthy = await waitForContainerHealth(container);
        if (!healthy) {
            allHealthy = false;
            console.error(`${container} is not healthy.`);
        }
    }
    if (!allHealthy) {
        process.exit(1);
    } else {
        console.log('All containers are healthy.');
    }
}

main();
