const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();
const listingController = require('../controllers/listingController');

// Serve the landing page
router.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/index.html'));
});

router.get('/data-entry', (req, res) => {
    res.sendFile(path.join(__dirname, '../templates/dataEntry.html'));
});

/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: Retrieve all listings (with optional filters and pagination)
 *     parameters:
 *       - in: query
 *         name: status
 *         schema:
 *           type: string
 *         description: Filter by listing status
 *       - in: query
 *         name: itemId
 *         schema:
 *           type: integer
 *         description: Filter by item ID
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
 *         description: A paginated list of listings
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 listings:
 *                   type: array
 *                   items:
 *                     $ref: '#/components/schemas/Listing'
 *                 total:
 *                   type: integer
 *                 page:
 *                   type: integer
 *                 pageSize:
 *                   type: integer
 *       500:
 *         description: Error retrieving listings
 */
router.get('/api/listings', listingController.getAllListings);

/**
 * @swagger
 * /api/listings/search:
 *   get:
 *     summary: Search/filter listings
 *     parameters:
 *       - in: query
 *         name: title
 *         schema:
 *           type: string
 *         description: Search by title
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
 *     responses:
 *       200:
 *         description: List of listings matching search
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 $ref: '#/components/schemas/Listing'
 *       500:
 *         description: Error searching listings
 */
router.get('/api/listings/search', listingController.searchListings);

/**
 * @swagger
 * /api/listings:
 *   post:
 *     summary: Create a new listing
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Listing'
 *     responses:
 *       201:
 *         description: Listing created successfully
 *       400:
 *         description: Validation error
 *       500:
 *         description: Error creating listing
 */
router.post('/api/listings', listingController.createListing);

/**
 * @swagger
 * /api/listings/{id}:
 *   get:
 *     summary: Get listing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Listing found
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Error fetching listing
 *   put:
 *     summary: Update listing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listing ID
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             $ref: '#/components/schemas/Listing'
 *     responses:
 *       200:
 *         description: Listing updated
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Error updating listing
 *   delete:
 *     summary: Delete listing by ID
 *     parameters:
 *       - in: path
 *         name: id
 *         required: true
 *         schema:
 *           type: integer
 *         description: Listing ID
 *     responses:
 *       200:
 *         description: Listing deleted successfully
 *       404:
 *         description: Listing not found
 *       500:
 *         description: Error deleting listing
 */
router.get('/api/listings/:id', listingController.getListingById);
router.put('/api/listings/:id', listingController.updateListingById);
router.delete('/api/listings/:id', listingController.deleteListingById);

/**
 * @swagger
 * /api/listings:
 *   get:
 *     summary: Retrieve all listings
 *     responses:
 *       200:
 *         description: A list of all listings
 *         content:
 *           application/json:
 *             schema:
 *               type: array
 *               items:
 *                 type: object
 *                 properties:
 *                   id:
 *                     type: string
 *                     description: The listing ID
 *                   title:
 *                     type: string
 *                     description: The title of the listing
 *                   price:
 *                     type: number
 *                     description: The price of the listing
 *       500:
 *         description: Error retrieving listings
 */

router.post('/generate-listing', (req, res) => {
    const {
        productName,
        description,
        salesVerbiage,
        modelName,
        serialNumber,
        includes,
        sellerInformation,
        showFDAWarning,
        FDAWarning,
        warranty,
        otherInformation
    } = req.body;

    // Read the template file
    const templatePath = path.join(__dirname, '../templates/listingTemplate.html');
    let template = fs.readFileSync(templatePath, 'utf8');

    // Replace placeholders with form data
    template = template
        .replace(/{{productName}}/g, productName)
        .replace(/{{description}}/g, description)
        .replace(/{{salesVerbiage}}/g, salesVerbiage)
        .replace(/{{modelName}}/g, modelName)
        .replace(/{{serialNumber}}/g, serialNumber)
        .replace(/{{includes}}/g, includes)
        .replace(/{{sellerInformation}}/g, sellerInformation)
        .replace(/{{FDAWarning}}/g, FDAWarning)
        .replace(/{{warranty}}/g, warranty)
        .replace(/{{otherInformation}}/g, otherInformation);

    // Handle conditional FDA warning
    if (showFDAWarning === 'false') {
        template = template.replace(/{{#if showFDAWarning}}[\s\S]*?{{\/if}}/g, '');
    } else {
        template = template.replace(/{{#if showFDAWarning}}|{{\/if}}/g, '');
    }

    // Send the populated HTML as the response
    res.send(template);
});

module.exports = router;