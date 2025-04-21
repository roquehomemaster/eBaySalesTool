const express = require('express');
const fs = require('fs');
const path = require('path');
const router = express.Router();

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