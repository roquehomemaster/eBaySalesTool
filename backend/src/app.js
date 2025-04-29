const express = require('express');
const mongoose = require('mongoose');
const setSalesRoutes = require('./routes/salesRoutes');
const listingRoutes = require('./routes/listingRoutes');
const itemRoutes = require('./routes/itemRoutes');
const ownershipRoutes = require('./routes/ownershipRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');
const cors = require('cors');
const fs = require('fs');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(listingRoutes);
app.use('/api', itemRoutes);
app.use('/api', ownershipRoutes);

// Updated CORS configuration to dynamically allow requests from the frontend container in Docker
const allowedOrigins = ['http://localhost:3000', 'http://frontend:3000'];
app.use(cors({
    origin: function (origin, callback) {
        if (!origin || allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('Not allowed by CORS'));
        }
    }
}));

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://database:27017/ebay-sales-tool')
    .then(() => console.log('MongoDB connected'))
    .catch(err => console.error('MongoDB connection error:', err));

// Set up routes
setSalesRoutes(app);

// Add logic to load test data based on configuration

// Load configuration
const configPath = path.join(__dirname, '../../project-config.json');
if (!fs.existsSync(configPath)) {
    console.error(`Configuration file not found at ${configPath}`);
    process.exit(1);
}
const config = JSON.parse(fs.readFileSync(configPath, 'utf-8'));

if (config.testData && config.testData.enabled) {
    console.log('Test data loading is enabled.');

    const testDataPath = path.join(__dirname, '../../database/seeds/sampleData.json');

    if (fs.existsSync(testDataPath)) {
        const testData = JSON.parse(fs.readFileSync(testDataPath, 'utf-8'));
        console.log('Loading test data into the database...');

        // Example: Load test data into the database
        const Item = require('./models/itemModel');
        testData.items.forEach(async (item) => {
            try {
                await Item.create(item);
                console.log(`Item added: ${item.name}`);
            } catch (error) {
                console.error(`Error adding item: ${item.name}`, error);
            }
        });
    } else {
        console.log('Test data file not found. Generating sample test data...');

        // Generate sample test data
        const sampleTestData = {
            items: [
                { name: 'Sample Item 1', price: 10.99, description: 'A sample item for testing.' },
                { name: 'Sample Item 2', price: 20.99, description: 'Another sample item for testing.' }
            ]
        };

        fs.writeFileSync(testDataPath, JSON.stringify(sampleTestData, null, 2));
        console.log('Sample test data generated and saved.');
    }
} else {
    console.log('Test data loading is disabled.');
}

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});