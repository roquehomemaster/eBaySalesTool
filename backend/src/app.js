/**
 * app.js
 * -----------------------------------------------------------------------------
 * Main entry point for the eBay Sales Tool backend Express application.
 *
 * - Configures middleware, routes, logging, and database connections.
 * - Serves API endpoints and Swagger documentation.
 *
 * Author: eBay Sales Tool Team
 * Last updated: 2025-07-10
 * -----------------------------------------------------------------------------
 */

const express = require('express');
const cors = require('cors');
const { Pool } = require('pg');
const listingRoutes = require('./routes/listingRoutes');
const catalogRoutes = require('./routes/itemRoutes');
const ownershipRoutes = require('./routes/ownershipRoutes');
const salesRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ebayInfoRoutes = require('./routes/ebayInfoRoutes');
const authRoutes = require('./routes/authRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { sequelize } = require('./utils/database');
const listingController = require('./controllers/listingController');
const Catalog = require('./models/itemModel');
const Ownership = require('./models/ownershipModel');
const Sales = require('./models/salesModel');
const fs = require('fs');
const path = require('path');
const logger = require('./utils/logger');
// Auth models (roles, users, pages, access matrix)
const { User, Role, Page, RolePageAccess } = require('./models/authModels');
const returnhistoryRoutes = require('./routes/returnhistoryRoutes');
const orderdetailsRoutes = require('./routes/orderdetailsRoutes');
const financialtrackingRoutes = require('./routes/financialtrackingRoutes');
const communicationlogsRoutes = require('./routes/communicationlogsRoutes');
const performancemetricsRoutes = require('./routes/performancemetricsRoutes');
const appconfigRoutes = require('./routes/appconfigRoutes');
const database_configurationRoutes = require('./routes/database_configurationRoutes');
const shippinglogRoutes = require('./routes/shippinglogRoutes');
const ownershipagreementsRoutes = require('./routes/ownershipagreementsRoutes');

// Ensure the logs directory exists BEFORE logger is created
const logDir = '/usr/src/app/logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    if ((process.env.LOG_LEVEL || 'info') === 'debug') {
        console.log(`Created logs directory at ${logDir}`);
    }
} else {
    if ((process.env.LOG_LEVEL || 'info') === 'debug') {
        console.log(`Logs directory already exists at ${logDir}`);
    }
}

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors());
app.use(express.json());
app.use('/api/listings', listingRoutes);
app.use('/api/catalog', catalogRoutes); // Ensure /api/catalog is mounted for catalog API
// Mount ownershipRoutes at /api/ownership to match test expectations
app.use('/api/ownership', ownershipRoutes);
app.use('/api/sales', salesRoutes);
app.use('/api/customers', customerRoutes);
app.use('/api/ebay', ebayInfoRoutes);
app.use('/api/auth', authRoutes);
app.use('/api/returnhistory', returnhistoryRoutes);
app.use('/api/orderdetails', orderdetailsRoutes);
app.use('/api/financialtracking', financialtrackingRoutes);
app.use('/api/communicationlogs', communicationlogsRoutes);
app.use('/api/performancemetrics', performancemetricsRoutes);
app.use('/api/appconfig', appconfigRoutes);
app.use('/api/database_configuration', database_configurationRoutes);
app.use('/api/shippinglog', shippinglogRoutes);
app.use('/api/ownershipagreements', ownershipagreementsRoutes);

// Temporary explicit route to ensure details endpoint is available even if router file misses it
app.get('/api/listings/:id/details', listingController.getListingDetails);

// Swagger configuration (merged)
const mergedSwagger = require('./swagger/mergedSwagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(mergedSwagger));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});

// Use unified logic for Postgres host
// Use only environment variables or rely on Sequelize config loading
const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'ebay_sales_tool',
    password: process.env.PG_PASSWORD || 'password',
    port: process.env.PG_PORT || 5432,
});

// Keep console intact; rely on logger for structured logs

// Only connect to DB (no sync in test). Log registered models for debugging.
if (process.env.NODE_ENV !== 'test') {
    pool.connect()
    .then(() => logger.info('PostgreSQL connected'))
    .catch(err => logger.error('PostgreSQL connection error:', err));

    // Removed sequelize.sync({ alter: true }) to prevent Sequelize from auto-creating or altering tables. Use migrations only.
}
// Debug: log registered model names at startup
try {
    logger.debug(`Registered models: ${JSON.stringify(Object.keys(sequelize.models))}`);
} catch (_) {}

// Set up routes
/**
 * @swagger
 * /api/populate-database:
 *   post:
 *     summary: Populate the database with seed data
 *     description: Executes the SQL seed script to populate the database. Intended for development and testing environments only.
 *     responses:
 *       200:
 *         description: Database populated successfully
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Database populated successfully.
 *       500:
 *         description: Failed to populate the database
 *         content:
 *           text/plain:
 *             schema:
 *               type: string
 *               example: Failed to populate the database: <error message>
 */

// Add a new route to populate the database
app.post('/api/populate-database', async (req, res) => {
    try {
        const seedFilePath = path.join(__dirname, '../database/seeds/sampleData.sql');
        const seedSQL = fs.readFileSync(seedFilePath, 'utf-8');
        await pool.query(seedSQL);

        // After seeding, verify that required parent records exist before returning success
        const [ownershipRes, listingRes] = await Promise.all([
            pool.query('SELECT COUNT(*) AS count FROM ownership'),
            pool.query('SELECT COUNT(*) AS count FROM listing')
        ]);
        const ownershipCount = parseInt(ownershipRes.rows[0].count, 10);
        const listingCount = parseInt(listingRes.rows[0].count, 10);
        if (ownershipCount === 0 || listingCount === 0) {
            const msg = `Seeding failed: ownership count = ${ownershipCount}, listing count = ${listingCount}`;
            logger.error(msg);
            return res.status(500).send(msg);
        }

        // Optionally, check sales table for orphaned records
        const salesOrphans = await pool.query(`SELECT sale_id FROM sales WHERE ownership_id NOT IN (SELECT ownership_id FROM ownership)`);
        if (salesOrphans.rows.length > 0) {
            const msg = `Seeding failed: sales with missing ownership_id: ${salesOrphans.rows.map(r => r.sale_id).join(', ')}`;
            logger.error(msg);
            return res.status(500).send(msg);
        }

        res.status(200).send('Database populated successfully.');
    } catch (error) {
    logger.error('Error populating the database:', error);
        // Return the error message in the response for better diagnostics
        res.status(500).send(`Failed to populate the database: ${error.message}`);
    }
});

// Health check endpoint for Docker and custom health checks
app.get('/api/health', (req, res) => {
    res.status(200).json({ status: 'ok' });
});

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    app.listen(PORT, () => {
    logger.info(`Server is running on port ${PORT}`);
    });
}

module.exports = app;