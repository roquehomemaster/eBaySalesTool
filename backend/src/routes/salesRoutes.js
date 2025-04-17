const express = require('express');
const SalesController = require('../controllers/salesController');

const router = express.Router();
const salesController = new SalesController();

const setSalesRoutes = (app) => {
    router.post('/sales', salesController.createSale);
    router.get('/sales', salesController.getSales);
    router.put('/sales/:id', salesController.updateSale);

    app.use('/api', router);
};

module.exports = setSalesRoutes;