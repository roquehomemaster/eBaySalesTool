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
router.post('/', ownershipController.createOwnership);

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
router.get('/', ownershipController.getAllOwnerships);

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
router.get('/search', ownershipController.searchOwnerships);

/**
 * @swagger
 * /api/ownership/{id}:
 *   get:
 *     summary: Get an ownership record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       200:
 *         description: Ownership record details
 *         content:
 *           application/json:
 *             schema:
 *               $ref: '#/components/schemas/Ownership'
 *       404:
 *         description: Ownership record not found
 *       500:
 *         description: Error fetching ownership record
 */
router.get('/:id', ownershipController.getOwnershipById);

/**
 * @swagger
 * /api/ownership/{id}:
 *   put:
 *     summary: Update an ownership record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
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
 *       200:
 *         description: Ownership record updated successfully
 *       400:
 *         description: Invalid input data
 *       404:
 *         description: Ownership record not found
 *       500:
 *         description: Error updating ownership record
 */
router.put('/:id', ownershipController.updateOwnershipById);

/**
 * @swagger
 * /api/ownership/{id}:
 *   delete:
 *     summary: Delete an ownership record by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: string
 *     responses:
 *       204:
 *         description: Ownership record deleted successfully
 *       404:
 *         description: Ownership record not found
 *       500:
 *         description: Error deleting ownership record
 */
router.delete('/:id', ownershipController.deleteOwnershipById);

module.exports = router;