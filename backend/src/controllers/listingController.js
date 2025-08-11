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
        const Catalog = require('../models/itemModel'); // Use itemModel.js for catalog lookups
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
            listing_id: response.listing_id,
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
        if (req.query.item_id) { where.item_id = req.query.item_id; }
        // Pagination
        const page = parseInt(req.query.page, 10) || 1;
        const limit = parseInt(req.query.limit, 10) || 10;
        const offset = (page - 1) * limit;
        const { count, rows } = await Listing.findAndCountAll({ where, offset, limit });
        // Map all listings to snake_case PK
        res.json({
            listings: rows.map(l => {
                const obj = l.toJSON ? l.toJSON() : l;
                delete obj.id;
                return obj;
            }),
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
        const obj = listing.toJSON ? listing.toJSON() : listing;
        delete obj.id;
        res.json(obj);
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
        const obj = listing.toJSON ? listing.toJSON() : listing;
        delete obj.id;
        res.json(obj);
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
        const { title, min_listing_price, max_listing_price, status } = req.query;
        const where = {};
        if (title) { where.title = { [Op.iLike]: `%${title}%` }; }
        if (status) { where.status = status; }
        if (min_listing_price || max_listing_price) { where.listing_price = {}; }
        if (min_listing_price) { where.listing_price[Op.gte] = parseFloat(min_listing_price); }
        if (max_listing_price) { where.listing_price[Op.lte] = parseFloat(max_listing_price); }
        const listings = await Listing.findAll({ where });
        // Map all listings to snake_case PK
        res.json(listings.map(l => {
            const obj = l.toJSON ? l.toJSON() : l;
            delete obj.id;
            return obj;
        }));
    } catch (error) {
        res.status(500).json({ message: 'Error searching listings' });
    }
};
