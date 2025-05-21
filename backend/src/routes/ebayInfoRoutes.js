// ebayInfoRoutes.js
// Routes for eBay Info & Performance

const express = require('express');
const router = express.Router();
const ebayInfoController = require('../controllers/ebayInfoController');

/**
 * @swagger
 * tags:
 *   name: eBayInfo
 *   description: eBay Info & Performance
 */

/**
 * @swagger
 * /api/ebay/info:
 *   get:
 *     summary: Get eBay account info
 *     tags: [eBayInfo]
 *     responses:
 *       200:
 *         description: eBay account info
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 accountId:
 *                   type: string
 *                 storeName:
 *                   type: string
 *                 feedbackScore:
 *                   type: integer
 *                 positiveFeedbackPercent:
 *                   type: number
 *                 sellingLimits:
 *                   type: object
 *                 lastSync:
 *                   type: string
 *                   format: date-time
 */
router.get('/info', ebayInfoController.getEbayInfo);

/**
 * @swagger
 * /api/ebay/info/search:
 *   get:
 *     summary: Search/filter eBay info
 *     tags: [eBayInfo]
 *     parameters:
 *       - in: query
 *         name: storeName
 *         schema:
 *           type: string
 *         description: Search by store name
 *       - in: query
 *         name: minFeedbackScore
 *         schema:
 *           type: integer
 *         description: Minimum feedback score
 *       - in: query
 *         name: maxFeedbackScore
 *         schema:
 *           type: integer
 *         description: Maximum feedback score
 *     responses:
 *       200:
 *         description: List of eBay info matching search
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/EbayInfo'
 *       500:
 *         description: Error searching eBay info
 */
router.get('/info/search', ebayInfoController.searchEbayInfo);

/**
 * @swagger
 * /api/ebay/performance:
 *   get:
 *     summary: Get seller performance metrics
 *     tags: [eBayInfo]
 *     responses:
 *       200:
 *         description: Seller performance metrics
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 sellerLevel:
 *                   type: string
 *                 defectRate:
 *                   type: number
 *                 lateShipmentRate:
 *                   type: number
 *                 transactionDefectRate:
 *                   type: number
 *                 policyComplianceStatus:
 *                   type: string
 *                 lastSync:
 *                   type: string
 *                   format: date-time
 */
router.get('/performance', ebayInfoController.getPerformance);

/**
 * @swagger
 * /api/ebay/status:
 *   get:
 *     summary: Get eBay API health/status
 *     tags: [eBayInfo]
 *     responses:
 *       200:
 *         description: eBay API status
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 apiStatus:
 *                   type: string
 *                 lastSync:
 *                   type: string
 *                   format: date-time
 */
router.get('/status', ebayInfoController.getApiStatus);

/**
 * @swagger
 * /api/ebay/sync:
 *   post:
 *     summary: Manually trigger eBay info & performance sync
 *     tags: [eBayInfo]
 *     responses:
 *       200:
 *         description: Sync started
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 message:
 *                   type: string
 *                 status:
 *                   type: string
 */
router.post('/sync', ebayInfoController.syncEbayInfo);

module.exports = router;
