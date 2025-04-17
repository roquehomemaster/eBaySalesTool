const express = require('express');
const mongoose = require('mongoose');
const bodyParser = require('body-parser');
const salesRoutes = require('./routes/salesRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

// Database connection
mongoose.connect(process.env.MONGODB_URI || 'mongodb://localhost:27017/ebay-sales-tool', {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})
.then(() => console.log('MongoDB connected'))
.catch(err => console.error('MongoDB connection error:', err));

// Routes
app.use('/api/sales', salesRoutes());

// Start the server
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});