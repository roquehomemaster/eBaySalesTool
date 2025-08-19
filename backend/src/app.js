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
// Use shared Pool instance from utils/database to avoid duplicate open handles in tests
const listingRoutes = require('./routes/listingRoutes');
const catalogRoutes = require('./routes/itemRoutes');
const ownershipRoutes = require('./routes/ownershipRoutes');
const ebayQueueAdminRoutes = require('./routes/ebayQueueAdminRoutes');
const ebaySnapshotAdminRoutes = require('./routes/ebaySnapshotAdminRoutes');
const ebaySyncLogAdminRoutes = require('./routes/ebaySyncLogAdminRoutes');
const ebayPolicyAdminRoutes = require('./routes/ebayPolicyAdminRoutes');
const ebayMetricsAdminRoutes = require('./routes/ebayMetricsAdminRoutes');
const ebayHealthAdminRoutes = require('./routes/ebayHealthAdminRoutes');
const ebayTransactionAdminRoutes = require('./routes/ebayTransactionAdminRoutes');
const ebayDriftAdminRoutes = require('./routes/ebayDriftAdminRoutes');
const ebayAdminAuth = require('./middleware/ebayAdminAuth');
const salesRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ebayInfoRoutes = require('./routes/ebayInfoRoutes');
const authRoutes = require('./routes/authRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { sequelize, pool } = require('./utils/database');
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
const historyRoutes = require('./routes/historyRoutes');
const { startSchedulers } = require('./integration/ebay/scheduler');

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
app.use('/api/admin/ebay', ebayAdminAuth, ebayQueueAdminRoutes);
app.use('/api/admin/ebay', ebayAdminAuth, ebaySnapshotAdminRoutes);
app.use('/api/admin/ebay', ebayAdminAuth, ebaySyncLogAdminRoutes);
app.use('/api/admin/ebay', ebayAdminAuth, ebayPolicyAdminRoutes);
app.use('/api/admin/ebay', ebayAdminAuth, ebayMetricsAdminRoutes);
app.use('/api/admin/ebay', ebayAdminAuth, ebayHealthAdminRoutes);
app.use('/api/admin/ebay', ebayAdminAuth, ebayTransactionAdminRoutes);
app.use('/api/admin/ebay', ebayAdminAuth, ebayDriftAdminRoutes);
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
app.use('/api/history', historyRoutes);

// Temporary explicit route to ensure details endpoint is available even if router file misses it
app.get('/api/listings/:id/details', listingController.getListingDetails);

// Swagger configuration (merged). We expose the raw JSON at /swagger.json so the UI can fetch it
// instead of embedding the (potentially large) object directly. This also avoids stale caching
// issues where the HTML is served but the inlined spec is not refreshed.
const mergedSwagger = require('./swagger/mergedSwagger');

// Log the resolved swagger spec metadata once at startup to aid debugging in container
try {
    const specSummary = {
        openapi: mergedSwagger && (mergedSwagger.openapi || mergedSwagger.swagger),
        pathCount: mergedSwagger && mergedSwagger.paths ? Object.keys(mergedSwagger.paths).length : 0
    };
    logger.info(`Swagger spec loaded (openapi=${specSummary.openapi}, paths=${specSummary.pathCount})`);
} catch(e) {
    logger.warn('Unable to log swagger spec summary', e);
}

// Raw spec endpoint (no caching) so external tools and Swagger UI (configUrl) can load it
const serveSwaggerSpec = (req, res) => {
    try {
        // Always re-read from disk to reflect any regeneration done while container running (dev mode)
        // In container prod builds the file is static, so this is inexpensive.
        const pathLib = require('path');
        const fsLib = require('fs');
        // Check multiple possible locations (dev vs Docker layer)
        const candidatePaths = [
            pathLib.resolve(__dirname, '../swagger.json'), // typical when generated under backend root during dev (../ from src)
            pathLib.resolve(__dirname, '../../swagger.json'), // fallback (if generation happened two levels up)
            pathLib.resolve('/usr/src/app/swagger.json') // explicit container working dir
        ];
        let specPath = candidatePaths.find(p => fsLib.existsSync(p));
        if (!specPath) {
            logger.warn('swagger.json not found on disk in expected locations; falling back to in-memory mergedSwagger');
        }
        let spec;
        if (specPath) {
            spec = JSON.parse(fsLib.readFileSync(specPath, 'utf8'));
        } else {
            // Fallback to already required mergedSwagger object
            spec = mergedSwagger;
        }
        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
        res.setHeader('Pragma', 'no-cache');
        res.setHeader('Expires', '0');
        res.json(spec);
    } catch (e) {
        logger.error('Failed to serve swagger.json', e);
        res.status(500).json({ error: 'Failed to load swagger spec' });
    }
};
app.get('/swagger.json', serveSwaggerSpec);
app.get('/api-docs/swagger.json', serveSwaggerSpec); // allow relative fetch when UI mounted

// Swagger UI using configUrl so the browser explicitly fetches /swagger.json (helps with blank page issues)
// Provide a robust fallback if swagger-ui-express "serve" export is missing (observed TypeError in container)
try {
    const hasServe = swaggerUi && typeof swaggerUi.serve === 'function';
        if (!hasServe || process.env.SWAGGER_FORCE_FALLBACK === 'true') {
                logger.warn('Using manual swagger-ui-dist fallback (reason: ' + (!hasServe ? 'serve() missing' : 'env override') + ')');
                const swaggerUiDist = require('swagger-ui-dist');
                const distPath = swaggerUiDist.getAbsoluteFSPath ? swaggerUiDist.getAbsoluteFSPath() : swaggerUiDist.absolutePath();
                // Custom responder first to override default Petstore index for /api-docs and /api-docs/
                const customSwaggerHtml = `<!DOCTYPE html><html><head><title>eBay Sales Tool API Docs</title>
<link rel="stylesheet" type="text/css" href="./swagger-ui.css" />
<style>body { margin:0; }</style></head>
<body><div id="swagger-ui"></div>
<script src="./swagger-ui-bundle.js"></script>
<script src="./swagger-ui-standalone-preset.js"></script>
<script>
window.onload = function() {
    window.ui = SwaggerUIBundle({
        url: '/api-docs/swagger.json',
        dom_id: '#swagger-ui',
        presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
        layout: 'BaseLayout',
        docExpansion: 'none',
        displayRequestDuration: true
    });
};
</script></body></html>`;
                const sendCustom = (req, res) => {
                        res.setHeader('Cache-Control', 'no-store, no-cache, must-revalidate, proxy-revalidate');
                        res.setHeader('Pragma', 'no-cache');
                        res.setHeader('Expires', '0');
                        res.send(customSwaggerHtml);
                };
                // Provide lightweight ETag for cache-busting while keeping no-store semantics (hash based on spec path count + time slice)
                const etagBase = (mergedSwagger && mergedSwagger.paths) ? Object.keys(mergedSwagger.paths).length : 0;
                const makeEtag = () => 'W/"spec-' + etagBase + '-' + Math.floor(Date.now()/60000) + '"';
                const withEtag = (handler) => (req,res)=>{ res.setHeader('ETag', makeEtag()); handler(req,res); };
                app.get('/api-docs', withEtag(sendCustom));
                app.get('/api-docs/', withEtag(sendCustom));
                app.get('/api-docs/index.html', withEtag(sendCustom));
                // Static assets AFTER custom HTML so Petstore default never served
                app.use('/api-docs', express.static(distPath));
    } else {
        // swaggerUi.serve is an array of middleware; Express 5 requires explicit spread or individual use
        const serveMiddlewares = Array.isArray(swaggerUi.serve) ? swaggerUi.serve : [swaggerUi.serve];
        app.use('/api-docs', ...serveMiddlewares, swaggerUi.setup(mergedSwagger, {
            explorer: true,
            customSiteTitle: 'eBay Sales Tool API Docs',
            swaggerOptions: {
                docExpansion: 'none',
                persistAuthorization: true,
                displayRequestDuration: true,
                validatorUrl: null
            }
        }));
    }
} catch (e) {
    logger.error('Failed to initialize Swagger UI', e);
}

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});

// Expose shared pool for test teardown (globalTeardown) to close connections
if (process.env.NODE_ENV === 'test') {
    app.locals.pgPool = pool;
}

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

// Capture startup time for uptime calculations
const startedAt = new Date();
// Health check endpoint for Docker and custom health checks
app.get('/api/health', (req, res) => {
    // Lightweight build metadata derived at runtime (avoid FS reads each hit)
    const buildInfo = {
        version: process.env.APP_VERSION || '1.0.0',
        commit: process.env.GIT_COMMIT || process.env.SOURCE_VERSION || 'e085606',
        node: process.version,
    };
    res.status(200).json({ status: 'ok', uptimeSeconds: Math.round((Date.now()-startedAt.getTime())/1000), build: buildInfo });
});

// Graceful shutdown support
let server; let shuttingDown = false;
function gracefulShutdown(signal){
    if (shuttingDown) { return; }
    shuttingDown = true;
    logger.info(`Received ${signal}. Beginning graceful shutdown.`);
    const { stopSchedulers } = require('./integration/ebay/scheduler');
    try { stopSchedulers(); logger.debug('Schedulers stopped'); } catch(e){ logger.warn('Error stopping schedulers', e); }
    // Stop accepting new connections
    if (server) {
        server.close(() => {
            logger.info('HTTP server closed');
            if (pool) {
                pool.end().then(()=>{ logger.info('PostgreSQL pool closed'); process.exit(0); })
                    .catch(err => { logger.error('Error closing pool', err); process.exit(1); });
            } else {
                process.exit(0);
            }
        });
        // Force timeout
        setTimeout(()=>{ logger.error('Forced shutdown after timeout'); process.exit(1); }, 15000).unref();
    } else {
        process.exit(0);
    }
}
['SIGINT','SIGTERM'].forEach(sig => { process.on(sig, () => gracefulShutdown(sig)); });
process.on('unhandledRejection', (reason) => { logger.error('Unhandled promise rejection', { reason }); });

// Only start the server if not in test mode
if (process.env.NODE_ENV !== 'test') {
    server = app.listen(PORT, () => {
        logger.info(`Server is running on port ${PORT}`);
        try { startSchedulers(); } catch(e){ logger.error('Failed to start schedulers', e); }
    });
}

module.exports = app;