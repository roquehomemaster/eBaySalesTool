const express = require('express');
const catalogController = require('../controllers/itemController');

const router = express.Router();

/**
 * @swagger
 * /api/catalog:
 *   post:
 *     summary: Create a new catalog entry
 *     requestBody:
 *       required: true
 *       content:
 *         application/json:
 *           schema:
 *             type: object
 *             properties:
 *               name:
 *                 type: string
 *                 description: The name of the item
 *               price:
 *                 type: number
 *                 description: The price of the item
 *               description:
 *                 type: string
 *                 description: A description of the item
 *               manufacturer_info:
 *                 type: string
 *                 description: Additional information about the manufacturer
 *               manufacturer:
 *                 type: string
 *                 description: The manufacturer of the item
 *               model:
 *                 type: string
 *                 description: The model of the item
 *               serial_number:
 *                 type: string
 *                 description: The serial number of the item
 *               product_page_link:
 *                 type: string
 *                 description: A link to the product page
 *               dimension:
 *                 type: object
 *                 properties:
 *                   x:
 *                     type: number
 *                     description: The length of the item
 *                   y:
 *                     type: number
 *                     description: The width of the item
 *                   z:
 *                     type: number
 *                     description: The height of the item
 *               weight:
 *                 type: number
 *                 description: The weight of the item
 *               condition:
 *                 type: string
 *                 description: The condition of the item
 *               category:
 *                 type: string
 *                 description: The category of the item
 *               sku_barcode:
 *                 type: string
 *                 description: The SKU or barcode of the item
 *               images:
 *                 type: array
 *                 items:
 *                   type: string
 *                 description: A list of image URLs for the item
 *               specifications:
 *                 type: string
 *                 description: Specifications of the item
 *     responses:
 *       201:
 *         description: Catalog entry created successfully
 *         content:
 *           application/json:
 *             schema:
 *               type: object
 *               properties:
 *                 _id:
 *                   type: string
 *                   description: The ID of the created catalog entry
 *                 name:
 *                   type: string
 *                   description: The name of the item
 *                 price:
 *                   type: number
 *                   description: The price of the item
 *                 description:
 *                   type: string
 *                   description: A description of the item
 *                 manufacturer:
 *                   type: string
 *                   description: The manufacturer of the item
 *                 model:
 *                   type: string
 *                   description: The model of the item
 *                 serial_number:
 *                   type: string
 *                   description: The serial number of the item
 *       500:
 *         description: Error creating catalog entry
 */


// Correct RESTful routes for /api/catalog
router.post('/', catalogController.createCatalog);
router.get('/', catalogController.getAllCatalog);
router.get('/:item_id', catalogController.getCatalogById);
router.put('/:item_id', catalogController.updateCatalogById);
router.delete('/:item_id', catalogController.deleteCatalogById);
// Bulk update catalog entries
router.put('/bulk', catalogController.bulkUpdateCatalog);
// Bulk delete catalog entries
router.delete('/bulk', catalogController.bulkDeleteCatalog);
// Search/filter catalog
router.get('/search', catalogController.searchCatalog);

module.exports = router;