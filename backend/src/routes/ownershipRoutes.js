const express = require('express');
const Ownership = require('../models/ownershipModel');

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

module.exports = router;