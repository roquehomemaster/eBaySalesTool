const express = require('express');
const mongoose = require('mongoose');
const setSalesRoutes = require('./routes/salesRoutes');
const listingRoutes = require('./routes/listingRoutes');
const itemRoutes = require('./routes/itemRoutes');
const ownershipRoutes = require('./routes/ownershipRoutes');
const swaggerUi = require('swagger-ui-express');
const swaggerJsdoc = require('swagger-jsdoc');

const app = express();
const PORT = process.env.PORT || 5000;

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
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebay-sales-tool', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Set up routes
setSalesRoutes(app);

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});