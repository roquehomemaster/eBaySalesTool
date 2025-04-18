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