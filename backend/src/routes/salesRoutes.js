const express = require('express');
const salesController = require('../controllers/salesController');

const router = express.Router();

/**
 * @swagger
 * /api/sales:
 *   post:
 *     summary: Create a new sale
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               item:
 *                 type: string
 *               price:
 *                 type: number
 *               sold_date:
 *                 type: string
 *                 format: date-time
 *               owner:
 *                 type: string
 *               negotiatedTerms:
 *                 type: string
 *     responses:
 *       201:
 *         description: Sale created successfully
 *       500:
 *         description: Error creating sale
 */
router.post('/sales', salesController.createSale);

/**
 * @swagger
 * /api/sales:
 *   get:
 *     summary: Get all sales (with optional filters)
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by sale status
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: integer
 *         description: Filter by item ID
 *       - in: query
 *         name: customerId
 *         schema:
 *           type: integer
 *         description: Filter by customer ID
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of sales
 *       500:
 *         description: Error fetching sales
 */
router.get('/sales', salesController.getAllSales);

/**
 * @swagger
 * /api/sales/{id}:
 *   get:
 *     summary: Get sale by ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale found
 *       404:
 *         description: Sale not found
 *       500:
 *         description: Error fetching sale
 */
router.get('/sales/:id', salesController.getSaleById);

/**
 * @swagger
 * /api/sales/{id}:
 *   put:
 *     summary: Update sale by ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sale ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *     responses:
 *       200:
 *         description: Sale updated
 *       400:
 *         description: Validation error
 *       404:
 *         description: Sale not found
 *       500:
 *         description: Error updating sale
 */
router.put('/sales/:id', salesController.updateSaleById);

/**
 * @swagger
 * /api/sales/{id}:
 *   delete:
 *     summary: Delete sale by ID
 *     tags: [Sales]
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Sale ID
 *     responses:
 *       200:
 *         description: Sale deleted successfully
 *       404:
 *         description: Sale not found
 *       500:
 *         description: Error deleting sale
 */
router.delete('/sales/:id', salesController.deleteSaleById);

/**
 * @swagger
 * /api/sales/bulk:
 *   put:
 *     summary: Bulk update sales
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *               status:
 *                 type: string
 *     responses:
 *       200:
 *         description: Number of sales updated
 *       400:
 *         description: No IDs provided
 *       500:
 *         description: Error bulk updating sales
 *   delete:
 *     summary: Bulk delete sales
 *     tags: [Sales]
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ids:
 *                 type: array
 *                 items:
 *                   type: integer
 *     responses:
 *       200:
 *         description: Number of sales deleted
 *       400:
 *         description: No IDs provided
 *       500:
 *         description: Error bulk deleting sales
 */
router.put('/sales/bulk', salesController.bulkUpdateSales);
router.delete('/sales/bulk', salesController.bulkDeleteSales);

/**
 * @swagger
 * /api/sales/search:
 *   get:
 *     summary: Search/filter sales
 *     tags: [Sales]
 *     parameters:
 *       - in: query
 *         name: item
 *         schema:
 *           type: string
 *         description: Search by item name
 *       - in: query
 *         name: owner
 *         schema:
 *           type: string
 *         description: Search by owner
 *       - in: query
 *         name: minPrice
 *         schema:
 *           type: number
 *         description: Minimum price
 *       - in: query
 *         name: maxPrice
 *         schema:
 *           type: number
 *         description: Maximum price
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: startDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by start date
 *       - in: query
 *         name: endDate
 *         schema:
 *           type: string
 *           format: date
 *         description: Filter by end date
 *     responses:
 *       200:
 *         description: List of sales matching search
 *       400:
 *         description: Bad request
 *       500:
 *         description: Error searching sales
 */
router.get('/sales/search', salesController.searchSales);

module.exports = router;