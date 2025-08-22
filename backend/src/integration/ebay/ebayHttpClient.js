/**
 * ebayHttpClient.js
 * Thin wrapper around axios for real eBay API calls (Listing detail) with auth + error normalization.
 */
const axios = require('axios');
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let tokenManager; try { tokenManager = require('./tokenManager'); } catch(_) { /* optional */ }

const AUTH_ERROR_STATUSES = new Set([401,403]);

function buildClient(){
  const baseURL = process.env.EBAY_API_BASE_URL || 'https://api.ebay.com';
  const timeout = parseInt(process.env.EBAY_HTTP_TIMEOUT_MS || '8000', 10);
  return axios.create({ baseURL, timeout });
}

function authHeader(){
  // Prefer dynamic token manager if available
  if (tokenManager) {
    // tokenManager may refresh; we return a promise but caller awaits by using await authHeader() when building request
    return tokenManager.getAccessToken().then(t => t ? { Authorization: `Bearer ${t}` } : {});
  }
  const token = process.env.EBAY_OAUTH_TOKEN; // Fallback static token
  return token ? { Authorization: `Bearer ${token}` } : {};
}

function classifyError(err){
  if (err.response){
    const { status } = err.response;
    if (AUTH_ERROR_STATUSES.has(status)) { return { transient:false, code: status, auth:true }; }
    if (status >= 500 || status === 429) { return { transient:true, code: status }; }
    return { transient:false, code: status };
  }
  if (err.code === 'ECONNABORTED' || err.code === 'ENOTFOUND' || err.code === 'ETIMEDOUT'){ return { transient:true, code: err.code }; }
  return { transient:false, code: err.code };
}

async function getListing(itemId){
  const start = Date.now();
  try {
    const client = buildClient();
    // Placeholder endpoint path; real eBay API might differ and need marketplace/site params.
  const headers = await authHeader();
  const resp = await client.get(`/sell/inventory/v1/inventory_item/${encodeURIComponent(itemId)}`, { headers });
    const dur = Date.now() - start;
    if (metrics) { metrics.observe('adapter.http_get_item_detail_ms', dur); metrics.inc('adapter.http.calls'); }
    return { ok:true, body: resp.data, status: resp.status };
  } catch(err){
    const dur = Date.now() - start;
    if (metrics) { metrics.observe('adapter.http_get_item_detail_ms', dur); }
    const cls = classifyError(err);
    if (metrics) {
      if (cls.auth) { metrics.inc('adapter.http.auth_failures'); }
      metrics.inc(cls.transient ? 'adapter.http.transient_failures' : 'adapter.http.permanent_failures');
    }
    return { ok:false, error: err.message, transient: cls.transient, code: cls.code, auth: !!cls.auth };
  }
}

module.exports = { getListing };
