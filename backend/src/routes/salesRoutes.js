const express = require('express');
const router = express.Router();

// Define your routes here
router.get('/sales', (req, res) => {
    res.send('Sales data');
});

const setSalesRoutes = (app) => {
    app.use('/api', router);
};

module.exports = setSalesRoutes;