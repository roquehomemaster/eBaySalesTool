const express = require('express');
const router = express.Router();
const listingController = require('../controllers/listingController');

// Listing API routes

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
router.get('/', listingController.getAllListings);

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
router.get('/search', listingController.searchListings);

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
router.post('/', listingController.createListing);

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
router.get('/:id', listingController.getListingById);
router.get('/:id/details', listingController.getListingDetails);
router.put('/:id', listingController.updateListingById);
router.delete('/:id', listingController.deleteListingById);

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

// Retain generate-listing under this router without api prefix
router.post('/generate-listing', (req, res) => {
    // ...existing code...
});

// Listing status workflow descriptor
router.get('/status/workflow', async (req, res) => {
    try {
        const controller = require('../utils/statusWorkflow');
        const data = await controller.getWorkflowDescriptor();
        // also include default status (configurable) for UI consumption
        const { pool } = require('../utils/database');
        let defaultStatus = 'draft';
        try {
            const r = await pool.query("SELECT config_value FROM appconfig WHERE config_key = 'listing_default_status'");
            if (r.rowCount > 0 && r.rows[0].config_value && r.rows[0].config_value.trim() !== '') {
                defaultStatus = r.rows[0].config_value.trim();
            }
        } catch (_) { /* ignore, fall back */ }
        res.json({ ...data, default_status: defaultStatus });
    } catch (e) {
        res.status(500).json({ message: 'Error loading status workflow' });
    }
});

// Update status workflow graph (admin). Expects JSON body { graph: { state: [next,...], ... } }
router.post('/status/workflow', async (req, res) => {
    try {
    const { graph } = req.body;
        if (!graph || typeof graph !== 'object' || Array.isArray(graph)) {
            return res.status(400).json({ message: 'Invalid graph: must be an object mapping status -> array of next statuses' });
        }
        // Basic validation: ensure all values are arrays of strings, and referenced nodes exist (closure)
        const nodes = Object.keys(graph);
        for (const [k, v] of Object.entries(graph)) {
            if (!Array.isArray(v) || v.some(n => typeof n !== 'string')) {
                return res.status(400).json({ message: `Invalid transitions for '${k}'` });
            }
        }
        // Insert implicit nodes referenced only as targets
        const referenced = new Set();
        for (const arr of Object.values(graph)) arr.forEach(n => referenced.add(n));
    referenced.forEach(r => { if (!graph[r]) { graph[r] = []; } });
        const { pool } = require('../utils/database');
        await pool.query("INSERT INTO appconfig (config_key, config_value, data_type) VALUES ('listing_status_graph', $1, 'json') ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value, data_type='json'", [JSON.stringify(graph)]);
        const controller = require('../utils/statusWorkflow');
        const data = await controller.getWorkflowDescriptor();
        res.status(200).json({ message: 'Workflow graph updated', ...data });
    } catch (e) {
        console.error('Failed to update status workflow graph:', e?.message || e);
        res.status(500).json({ message: 'Error updating status workflow' });
    }
});

module.exports = router;