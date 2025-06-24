const express = require('express');
const { Pool } = require('pg');
const listingRoutes = require('./routes/listingRoutes');
const itemRoutes = require('./routes/itemRoutes');
const ownershipRoutes = require('./routes/ownershipRoutes');
const salesRoutes = require('./routes/salesRoutes');
const customerRoutes = require('./routes/customerRoutes');
const ebayInfoRoutes = require('./routes/ebayInfoRoutes');
const authRoutes = require('./routes/authRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const { sequelize } = require('./utils/database');
const Item = require('./models/itemModel');
const Ownership = require('./models/ownershipModel');
const Sales = require('./models/salesModel');
const fs = require('fs');
const path = require('path');
const winston = require('winston');
// Auth models (roles, users, pages, access matrix)
const { User, Role, Page, RolePageAccess } = require('./models/authModels');

// Ensure the logs directory exists BEFORE logger is created
const logDir = '/usr/src/app/logs';
if (!fs.existsSync(logDir)) {
    fs.mkdirSync(logDir, { recursive: true });
    console.log(`Created logs directory at ${logDir}`);
} else {
    console.log(`Logs directory already exists at ${logDir}`);
}

// Now configure winston logger for structured logging
const logger = winston.createLogger({
    level: 'debug',
    format: winston.format.combine(
        winston.format.timestamp(),
        winston.format.printf(({ timestamp, level, message }) => {
            return `${timestamp} [${level.toUpperCase()}]: ${message}`;
        })
    ),
    transports: [
        new winston.transports.Console({ level: 'debug' })
    ],
});

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(listingRoutes);
app.use('/api', itemRoutes);
app.use('/api/ownership', ownershipRoutes);
app.use('/api', salesRoutes);
app.use('/api', customerRoutes);
app.use('/api/ebay', ebayInfoRoutes);
app.use('/api/auth', authRoutes);

// Swagger configuration (merged)
const mergedSwagger = require('./swagger/mergedSwagger');
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(mergedSwagger));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});

// Use unified logic for Postgres host
const pgHost = process.env.PG_HOST || (process.env.NODE_ENV === 'docker' ? 'database' : 'localhost');
// Database connection
const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: pgHost,
    database: process.env.PG_DATABASE || 'ebay_sales_tool',
    password: process.env.PG_PASSWORD || 'password',
    port: process.env.PG_PORT || 5432,
});

// Replace console.log and console.error with logger for structured logs
console.log = (...args) => process.stdout.write(args.map(arg => (typeof arg === 'object' ? JSON.stringify(arg, null, 2) : String(arg))).join(' ') + '\n');
console.error = (...args) => process.stderr.write(args.map(arg => {
    if (arg instanceof Error) {
        return arg.stack || arg.toString();
    }
    if (typeof arg === 'object') {
        try {
            return JSON.stringify(arg, null, 2);
        } catch (e) {
            return String(arg);
        }
    }
    return String(arg);
}).join(' ') + '\n');

// Only connect to DB and sync models if not in test mode
if (process.env.NODE_ENV !== 'test') {
    pool.connect()
        .then(() => console.log('PostgreSQL connected'))
        .catch(err => console.error('PostgreSQL connection error:', err));

    sequelize.sync({ alter: true })
        .then(() => console.log('Database synchronized'))
        .catch(err => console.error('Database synchronization error:', err));
}

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
        res.status(200).send('Database populated successfully.');
    } catch (error) {
        console.error('Error populating the database:', error);
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
        console.log(`Server is running on port ${PORT}`);
    });
}

module.exports = app;