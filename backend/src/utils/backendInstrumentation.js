// backendInstrumentation.js
// Helper for backend and database instrumentation and diagnostics

const { Sequelize } = require('sequelize');
const { Client } = require('pg');

// Test direct PostgreSQL connection
async function testPostgresConnection(config) {
    const client = new Client(config);
    try {
        await client.connect();
        console.log('Connection to PostgreSQL successful!');
    } catch (err) {
        console.error('Error connecting to PostgreSQL:', err);
    } finally {
        await client.end();
    }
}

// Test Sequelize connection and model sync
async function testSequelizeConnection(sequelizeConfig) {
    const sequelize = new Sequelize(sequelizeConfig);
    try {
        await sequelize.authenticate();
        console.log('Sequelize connection established successfully.');
        // Optionally define and sync a test model here
    } catch (error) {
        console.error('Error during Sequelize test:', error);
    } finally {
        await sequelize.close();
        console.log('Sequelize connection closed.');
    }
}

// Backend startup config logging
function logBackendStartup(config) {
    console.log('Backend starting with config:', config);
}

module.exports = {
    testPostgresConnection,
    testSequelizeConnection,
    logBackendStartup
};
