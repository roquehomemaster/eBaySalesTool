const express = require('express');
const { Pool } = require('pg');
const setSalesRoutes = require('./routes/salesRoutes');
const listingRoutes = require('./routes/listingRoutes');
const itemRoutes = require('./routes/itemRoutes');
const ownershipRoutes = require('./routes/ownershipRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const sequelize = require('./utils/database');
const Item = require('./models/itemModel');
const Ownership = require('./models/ownershipModel');
const Sales = require('./models/salesModel');

const app = express();
const PORT = process.env.PORT || 5000;

// Removed MongoDB-specific environment variable
// Updated environment variables for PostgreSQL
process.env.PG_USER = process.env.PG_USER || 'postgres';
process.env.PG_PASSWORD = process.env.PG_PASSWORD || 'password';
process.env.PG_DATABASE = process.env.PG_DATABASE || 'ebay_sales_tool';
process.env.PG_HOST = process.env.PG_HOST || 'database';
process.env.PG_PORT = process.env.PG_PORT || 5432;

// Middleware
app.use(express.json());
app.use(listingRoutes);
app.use('/api', itemRoutes);
app.use('/api', ownershipRoutes);

// Swagger configuration
const swaggerOptions = {
    definition: {
        openapi: '3.0.0',
        info: {
            title: 'eBay Sales Tool API',
            version: '1.0.0',
            description: 'API documentation for the eBay Sales Tool',
        },
        servers: [
            {
                url: 'http://localhost:5000',
                description: 'Local server',
            },
        ],
    },
    apis: ['./src/routes/*.js'], // Path to the API docs
};

const swaggerDocs = swaggerJsdoc(swaggerOptions);
app.use('/api-docs', swaggerUi.serve, swaggerUi.setup(swaggerDocs));

// Serve the index.html file for the root URL
app.get('/', (req, res) => {
    res.sendFile(__dirname + '/templates/index.html');
});

// Database connection
const pool = new Pool({
    user: process.env.PG_USER || 'postgres',
    host: process.env.PG_HOST || 'localhost',
    database: process.env.PG_DATABASE || 'ebay_sales_tool',
    password: process.env.PG_PASSWORD || 'password',
    port: process.env.PG_PORT || 5432,
});

pool.connect()
    .then(() => console.log('PostgreSQL connected'))
    .catch(err => console.error('PostgreSQL connection error:', err));

// Sync models with the database
sequelize.sync({ alter: true })
    .then(() => console.log('Database synchronized'))
    .catch(err => console.error('Database synchronization error:', err));

// Set up routes
setSalesRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});