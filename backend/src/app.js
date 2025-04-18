const express = require('express');
const mongoose = require('mongoose');
const setSalesRoutes = require('./routes/salesRoutes');
const listingRoutes = require('./routes/listingRoutes');

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(express.json());
app.use(listingRoutes);

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