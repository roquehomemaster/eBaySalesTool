/**
 * projectionBuilder.js
 * Build deterministic internal projection for a listing destined for eBay.
 * Phase 1: minimal fields (extend later as needed).
 */
const { hashObject } = require('./hashUtil');
const Listing = require('../../models/listingModel');
const Catalog = require('../../models/catalogModel');

/**
 * Fetch minimal internal data required for projection.
 * @param {number} listingId
 * @returns {Promise<object>} projection
 */
async function buildProjection(listingId) {
  // Fetch listing & catalog row; assume simple sequential queries (optimize later with joins/raw if needed)
  const listing = await Listing.findOne({ where: { listing_id: listingId }, raw: true });
  if (!listing) {
    throw new Error(`Listing ${listingId} not found`);
  }
  let catalog = null;
  if (listing.item_id) {
    catalog = await Catalog.findOne({ where: { item_id: listing.item_id }, raw: true });
  }

  // Minimal projection shape (extendable)
  const projection = {
    listing: {
      id: listing.listing_id,
      title: listing.title,
      status: listing.status,
      price: listing.listing_price ? Number(listing.listing_price) : null,
      serialNumber: listing.serial_number || null,
      manufactureDate: listing.manufacture_date || null
    },
    catalog: catalog ? {
      id: catalog.item_id,
      sku: catalog.sku,
      barcode: catalog.barcode,
      manufacturer: catalog.manufacturer,
      model: catalog.model,
      description: catalog.description
    } : null
  };

  // Compute projection hash (omit nothing yet; volatile fields excluded by design)
  const projection_hash = hashObject(projection);
  return { projection, projection_hash };
}

module.exports = { buildProjection };
