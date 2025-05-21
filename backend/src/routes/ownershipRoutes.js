const express = require('express');
const Ownership = require('../models/ownershipModel');
const ownershipController = require('../controllers/ownershipController');

const router = express.Router();

/**
 * @swagger
 * /api/ownership:
 *   post:
 *     summary: Create a new ownership record
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               ownershipType:
 *                 type: string
 *                 enum: ["Self", "Company"]
 *                 description: The type of ownership
 *               contact:
 *                 type: object
 *                 properties:
 *                   firstName:
 *                     type: string
 *                   lastName:
 *                     type: string
 *                   address:
 *                     type: string
 *                   telephone:
 *                     type: string
 *                   email:
 *                     type: string
 *               companyDetails:
 *                 type: object
 *                 properties:
 *                   companyName:
 *                     type: string
 *                   companyAddress:
 *                     type: string
 *                   companyTelephone:
 *                     type: string
 *                   companyEmail:
 *                     type: string
 *                   assignedContact:
 *                     type: object
 *                     properties:
 *                       firstName:
 *                         type: string
 *                       lastName:
 *                         type: string
 *                       telephone:
 *                         type: string
 *                       email:
 *                         type: string
 *     responses:
 *       201:
 *         description: Ownership record created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the created ownership record
 *       500:
 *         description: Error creating ownership record
 */
router.post('/ownership', async (req, res) => {
    console.log('POST /ownership endpoint hit with body:', req.body);
    try {
        const newOwnership = new Ownership(req.body);
        const savedOwnership = await newOwnership.save();
        res.status(201).json(savedOwnership);
    } catch (error) {
        console.error('Error creating ownership record:', error);
        res.status(500).json({ message: 'Error creating ownership record', error });
    }
});

/**
 * @swagger
 * /api/ownership:
 *   get:
 *     summary: Get all ownerships/agreements (with optional filters and pagination)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: agreementType
 *         schema:
 *           type: string
 *         description: Filter by agreement type
 *       - in: query
 *         name: page
 *         schema:
 *           type: integer
 *         description: Page number for pagination
 *       - in: query
 *         name: limit
 *         schema:
 *           type: integer
 *         description: Page size for pagination
 *     responses:
 *       200:
 *         description: Paginated list of ownerships/agreements
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 ownerships:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Ownership'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       500:
 *         description: Error fetching ownerships/agreements
 */
router.get('/api/ownership', ownershipController.getAllOwnerships);

/**
 * @swagger
 * /api/ownership/search:
 *   get:
 *     summary: Search/filter ownerships/agreements
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by status
 *       - in: query
 *         name: agreementType
 *         schema:
 *           type: string
 *         description: Filter by agreement type
 *     responses:
 *       200:
 *         description: List of ownerships/agreements matching search
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Ownership'
 *       500:
 *         description: Error searching ownerships/agreements
 */
router.get('/api/ownership/search', ownershipController.searchOwnerships);

module.exports = router;