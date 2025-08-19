/**
 * adapter.js
 * Real eBay adapter scaffold: HTTP client + auth + rate limiting + graceful fallback to mock.
 * Environment Variables:
 *  - EBAY_PUBLISH_ENABLED=true            (feature flag)
 *  - EBAY_API_BASE_URL=https://...        (sandbox or prod base URL)
 *  - EBAY_API_OAUTH_TOKEN=...             (pre-fetched OAuth user token)
 *  - EBAY_API_REFRESH_URL=...             (OAuth refresh endpoint, optional)
 *  - EBAY_API_REFRESH_CLIENT=...          (Client id for refresh)
 *  - EBAY_API_REFRESH_SECRET=...          (Client secret for refresh)
 *  - EBAY_API_REFRESH_TOKEN=...           (Refresh token value)
 *  - EBAY_API_TIMEOUT_MS=8000             (optional request timeout)
 *  - EBAY_RATE_LIMIT_RPS=5                (local client-side throttle; protects us pre-server 429)
 */
const axios = require('axios');
let { EbayTransactionLog } = require('../../../models/ebayIntegrationModels');
let { redactObject } = require('./redactUtil');
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
const rateLimiter = require('./rateLimiter');

function adapterEnabled() { return process.env.EBAY_PUBLISH_ENABLED === 'true'; }
function hasRemoteConfig(){ return !!process.env.EBAY_API_BASE_URL; }

async function acquireSlot() { return rateLimiter.acquire(); }

function authHeader() {
  if (process.env.EBAY_API_OAUTH_TOKEN) {
    return { Authorization: `Bearer ${process.env.EBAY_API_OAUTH_TOKEN}` };
  }
  return {};
}

let refreshing = null;
async function refreshTokenIfConfigured(){
  if(!process.env.EBAY_API_REFRESH_URL || !process.env.EBAY_API_REFRESH_TOKEN){ return false; }
  if (refreshing) { return refreshing; }
  refreshing = (async () => {
    try {
      const basic = Buffer.from(`${process.env.EBAY_API_REFRESH_CLIENT || ''}:${process.env.EBAY_API_REFRESH_SECRET || ''}`).toString('base64');
      const resp = await axios.post(process.env.EBAY_API_REFRESH_URL, new URLSearchParams({
        grant_type: 'refresh_token',
        refresh_token: process.env.EBAY_API_REFRESH_TOKEN
      }), { headers:{ Authorization: `Basic ${basic}`, 'Content-Type':'application/x-www-form-urlencoded' } });
      if (resp.data && resp.data.access_token){
        process.env.EBAY_API_OAUTH_TOKEN = resp.data.access_token; // ephemeral
        return true;
      }
    } catch (_){ /* swallow */ }
    return false;
  })();
  try { return await refreshing; } finally { refreshing = null; }
}

function buildClient(){
  const timeout = parseInt(process.env.EBAY_API_TIMEOUT_MS || '8000', 10);
  return axios.create({ baseURL: process.env.EBAY_API_BASE_URL, timeout });
}

function parseRateLimitHeaders(headers){
  if(!headers) {
    return {};
  }
  const rl = {};
  ['x-ebay-c-marketplace-id','x-rate-limit-remaining','x-rate-limit-reset','retry-after'].forEach(k=>{
    if (headers[k]) {
      rl[k] = headers[k];
    }
  });
  return rl;
}

function mapSuccess(resp, externalIdField){
  const body = resp.data || {};
  return {
    success: true,
    external_item_id: body.id || body.itemId || body[externalIdField] || null,
    revision: body.revision || body.rev || null,
    statusCode: resp.status,
    body,
    rateLimit: parseRateLimitHeaders(resp.headers)
  };
}

function classify(status, body){
  if (status === 401) { return 'auth_error'; }
  if (status === 403) { return 'forbidden'; }
  if (status === 404) { return 'not_found'; }
  if (status === 409) { return 'conflict'; }
  if (status === 423) { return 'locked'; }
  if (status === 429) { return 'rate_limited'; }
  if (status >= 500) { return 'server_error'; }
  if (status >= 400) { return 'client_error'; }
  if (body === 'adapter_disabled') { return 'disabled'; }
  return 'unknown';
}

function mapFailure(err){
  if (err.response) {
    const code = err.response.status;
    const body = err.response.data;
    return {
      success: false,
      statusCode: code,
      body,
      classification: classify(code, body),
      rateLimit: parseRateLimitHeaders(err.response.headers)
    };
  }
  return { success: false, statusCode: 0, body: err.message || 'network_error', classification: 'network_error' };
}

async function getListing(external_item_id){
  if (!adapterEnabled()) { return { success:false, statusCode:503, body:'adapter_disabled' }; }
  await acquireSlot();
  if (!hasRemoteConfig()) { return { success:true, statusCode:200, body:{ id: external_item_id, mock:true, revision:'r0' } }; }
  const client = buildClient();
  const started = Date.now();
  try {
    const resp = await client.get(`/listings/${encodeURIComponent(external_item_id)}`, { headers: { ...authHeader() } });
    const mapped = mapSuccess(resp, 'itemId');
    if (EbayTransactionLog){
      try { await EbayTransactionLog.create({ direction:'outbound', channel:'adapter', operation:'get', request_url:`/listings/${encodeURIComponent(external_item_id)}`, request_method:'GET', request_headers:redactObject({}), request_body:null, response_code:mapped.statusCode, response_body:redactObject(mapped.body), status: mapped.success ? 'success':'failure', latency_ms: Date.now()-started, error_classification: mapped.classification }); } catch(_) { /* ignore */ }
    }
    return mapped;
  } catch (e) { return mapFailure(e); }
}

// Mock fallback implementation (used if no remote config present)
function mockCreate(){ return { success:true, external_item_id: 'MOCK-' + Date.now(), revision:'r1', statusCode:201, body:{ ok:true, mock:true } }; }
function mockUpdate(){ return { success:true, revision:'r'+Date.now(), statusCode:200, body:{ ok:true, mock:true } }; }

async function createListing(payload) {
  if (!adapterEnabled()) {
    return { success:false, statusCode:503, body:'adapter_disabled' };
  }
  await acquireSlot();
  if (!hasRemoteConfig()) {
    return mockCreate();
  }
  const client = buildClient();
  const started = Date.now();
  try {
    const resp = await client.post('/listings', payload, { headers: { 'Content-Type':'application/json', ...authHeader() } });
  const mapped = mapSuccess(resp, 'itemId');
  rateLimiter.adjustFromHeaders(resp.headers);
    if (EbayTransactionLog){
  try { await EbayTransactionLog.create({ direction:'outbound', channel:'adapter', operation:'create', request_url:'/listings', request_method:'POST', request_headers:redactObject({}), request_body:redactObject(payload), response_code:mapped.statusCode, response_body:redactObject(mapped.body), status: mapped.success ? 'success':'failure', latency_ms: Date.now()-started, error_classification: mapped.classification }); } catch(_) { /* ignore */ }
    }
    if (metrics) { metrics.inc('adapter.create.calls'); }
    return mapped;
  } catch (e) {
    // Attempt token refresh once on 401
    if (e.response && e.response.status === 401) {
      const refreshed = await refreshTokenIfConfigured();
      if (refreshed) {
        try {
          const resp2 = await client.post('/listings', payload, { headers: { 'Content-Type':'application/json', ...authHeader() } });
          const mapped2 = mapSuccess(resp2, 'itemId');
          if (EbayTransactionLog){
            try { await EbayTransactionLog.create({ direction:'outbound', channel:'adapter', operation:'create', request_url:'/listings', request_method:'POST', request_headers:redactObject({}), request_body:redactObject(payload), response_code:mapped2.statusCode, response_body:redactObject(mapped2.body), status: mapped2.success ? 'success':'failure', latency_ms: Date.now()-started }); } catch(_) { /* ignore */ }
          }
          if (metrics) { metrics.inc('adapter.create.calls'); }
          return mapped2;
        } catch (e2) { return mapFailure(e2); }
      }
    }
  const fail = mapFailure(e);
  rateLimiter.adjustFromHeaders(e.response && e.response.headers);
  return fail;
  }
}

async function updateListing(external_item_id, payload) {
  if (!adapterEnabled()) {
    return { success:false, statusCode:503, body:'adapter_disabled' };
  }
  await acquireSlot();
  if (!hasRemoteConfig()) {
    return mockUpdate();
  }
  const client = buildClient();
  const started = Date.now();
  try {
    const resp = await client.put(`/listings/${encodeURIComponent(external_item_id)}`, payload, { headers: { 'Content-Type':'application/json', ...authHeader() } });
  const mapped = mapSuccess(resp, 'itemId');
  rateLimiter.adjustFromHeaders(resp.headers);
    if (EbayTransactionLog){
  try { await EbayTransactionLog.create({ direction:'outbound', channel:'adapter', operation:'update', request_url:`/listings/${encodeURIComponent(external_item_id)}`, request_method:'PUT', request_headers:redactObject({}), request_body:redactObject(payload), response_code:mapped.statusCode, response_body:redactObject(mapped.body), status: mapped.success ? 'success':'failure', latency_ms: Date.now()-started, error_classification: mapped.classification }); } catch(_) { /* ignore */ }
    }
    if (metrics) { metrics.inc('adapter.update.calls'); }
    return mapped;
  } catch (e) {
    if (e.response && e.response.status === 401) {
      const refreshed = await refreshTokenIfConfigured();
      if (refreshed) {
        try {
          const resp2 = await client.put(`/listings/${encodeURIComponent(external_item_id)}`, payload, { headers: { 'Content-Type':'application/json', ...authHeader() } });
          const mapped2 = mapSuccess(resp2, 'itemId');
          if (EbayTransactionLog){
            try { await EbayTransactionLog.create({ direction:'outbound', channel:'adapter', operation:'update', request_url:`/listings/${encodeURIComponent(external_item_id)}`, request_method:'PUT', request_headers:redactObject({}), request_body:redactObject(payload), response_code:mapped2.statusCode, response_body:redactObject(mapped2.body), status: mapped2.success ? 'success':'failure', latency_ms: Date.now()-started }); } catch(_) { /* ignore */ }
          }
          if (metrics) { metrics.inc('adapter.update.calls'); }
          return mapped2;
        } catch (e2) { return mapFailure(e2); }
      }
    }
  const fail = mapFailure(e);
  rateLimiter.adjustFromHeaders(e.response && e.response.headers);
  return fail;
  }
}

module.exports = { createListing, updateListing, getListing, adapterEnabled };
