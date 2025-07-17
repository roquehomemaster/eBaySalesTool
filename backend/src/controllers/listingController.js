/**
 * listingController.js
 * -----------------------------------------------------------------------------
 * Controller functions for Listing API endpoints (CRUD, search, etc).
 *
 * Author: eBay Sales Tool Team
 * Last updated: 2025-07-10
 * -----------------------------------------------------------------------------
 */

const { Op } = require('sequelize');
const Listing = require('../models/listingModel');

/**
 * Create a new listing
 */
exports.createListing = async (req, res) => {
    try {
        const requiredFields = ['title', 'listing_price', 'item_id'];
        for (const field of requiredFields) {
            if (req.body[field] === undefined || req.body[field] === null) {
                return res.status(400).json({ message: `Missing required field: ${field}` });
            }
        }
        // Check if itemId exists in Catalog table for FK integrity BEFORE creating the listing
        const Catalog = require('../models/catalogModel');
        const item_id = req.body.item_id;
        const catalogItem = await Catalog.findByPk(item_id);
        if (!catalogItem) {
            return res.status(400).json({ message: 'Invalid item_id: catalog item does not exist' });
        }
        // Prepare listing data only after validation
        const listingData = {
            title: req.body.title,
            listing_price: req.body.listing_price,
            item_id: item_id
        };
        const newListing = await Listing.create(listingData);
        // Map DB fields to snake_case in response
        const response = newListing.toJSON ? newListing.toJSON() : newListing;
        res.status(201).json({
            id: response.id,
            title: response.title,
            listing_price: response.listing_price,
            item_id: response.item_id,
            status: response.status,
            created_at: response.created_at,
            updated_at: response.updated_at
        });
    } catch (error) {
        // Print full error for diagnostics
        console.error('Error creating listing:', error, error?.message, error?.stack);
        res.status(500).json({ message: 'Error creating listing', error: error?.message || String(error) });
    }
};

/**
 * Get all listings (with optional filters and pagination)
 */
exports.getAllListings = async (req, res) => {
    try {
        const where = {};
        if (req.query.status) { where.status = req.query.status; }
        if (req.query.itemId) { where.itemId = req.query.itemId; }
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Listing.findAndCountAll({ where, offset, limit });
        res.json({
            listings: rows,
            total: count,
            page,
            pageSize: limit
        });
    } catch (error) {
        console.error('Error fetching listings:', error);
        res.status(500).json({ message: 'Error fetching listings', error: error.message });
    }
};

/**
 * Get listing by ID
 */
exports.getListingById = async (req, res) => {
    try {
        const listing = await Listing.findByPk(req.params.id);
        if (!listing) { return res.status(404).json({ message: 'Listing not found' }); }
        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Error fetching listing' });
    }
};

/**
 * Update listing by ID
 */
exports.updateListingById = async (req, res) => {
    try {
        const listing = await Listing.findByPk(req.params.id);
        if (!listing) { return res.status(404).json({ message: 'Listing not found' }); }
        await listing.update(req.body);
        res.json(listing);
    } catch (error) {
        res.status(500).json({ message: 'Error updating listing' });
    }
};

/**
 * Delete listing by ID
 */
exports.deleteListingById = async (req, res) => {
    try {
        const listing = await Listing.findByPk(req.params.id);
        if (!listing) { return res.status(404).json({ message: 'Listing not found' }); }
        await listing.destroy();
        res.json({ message: 'Listing deleted successfully.' });
    } catch (error) {
        res.status(500).json({ message: 'Error deleting listing' });
    }
};

/**
 * Search/filter listings
 */
exports.searchListings = async (req, res) => {
    try {
        const { title, minPrice, maxPrice, status } = req.query;
        const where = {};
        if (title) { where.title = { [Op.iLike]: `%${title}%` }; }
        if (status) { where.status = status; }
        if (minPrice || maxPrice) { where.price = {}; }
        if (minPrice) { where.price[Op.gte] = parseFloat(minPrice); }
        if (maxPrice) { where.price[Op.lte] = parseFloat(maxPrice); }
        const listings = await Listing.findAll({ where });
        res.json(listings);
    } catch (error) {
        res.status(500).json({ message: 'Error searching listings' });
    }
};
