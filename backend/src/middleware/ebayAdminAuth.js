/**
 * ebayAdminAuth.js
 * Optional header-based auth for eBay admin endpoints.
 * Enable by setting EBAY_ADMIN_API_KEY. Clients must send X-Admin-Auth header with matching value.
 */
module.exports = function ebayAdminAuth(req, res, next){
  const required = process.env.EBAY_ADMIN_API_KEY;
  if (!required) { return next(); }
  const provided = req.header('X-Admin-Auth');
  if (provided && provided === required) { return next(); }
  return res.status(401).json({ error: 'unauthorized' });
};
