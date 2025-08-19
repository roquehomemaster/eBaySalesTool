/**
 * policyService.js
 * Fetch & cache eBay business policies (shipping/return/payment) into ebay_policy_cache.
 * Feature flag: EBAY_POLICY_ENABLED=true
 * Env:
 *  - EBAY_API_BASE_URL
 *  - EBAY_API_OAUTH_TOKEN / refresh config (adapter handles refresh if reused)
 *  - EBAY_POLICY_TYPES=shipping,return,payment (comma list)
 *  - EBAY_POLICY_TTL_SEC=3600
 */
const axios = require('axios');
const { Op } = require('sequelize');
const { EbayPolicyCache } = require('../../../models/ebayIntegrationModels');
const { hashObject } = require('./hashUtil');
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let txn; try { txn = require('./transactionLogger'); } catch(_) { /* optional */ }
let { redactObject } = require('./redactUtil');

function featureEnabled(){ return process.env.EBAY_POLICY_ENABLED === 'true'; }
function ttlSeconds(){ return parseInt(process.env.EBAY_POLICY_TTL_SEC || '3600', 10); }
function policyTypes(){ const raw = process.env.EBAY_POLICY_TYPES || 'shipping,return,payment'; return raw.split(',').map(s=>s.trim()).filter(Boolean); }

function authHeader(){ return process.env.EBAY_API_OAUTH_TOKEN ? { Authorization: `Bearer ${process.env.EBAY_API_OAUTH_TOKEN}` } : {}; }

async function fetchPolicyList(type){
  if (!process.env.EBAY_API_BASE_URL) { return []; }
  const url = `/business_policies/${type}`; // placeholder path; adjust to real eBay endpoint
  try {
    const resp = await axios.get(process.env.EBAY_API_BASE_URL + url, { headers: { 'Content-Type':'application/json', ...authHeader() }, timeout: 8000 });
  return resp.data && (resp.data.policies || resp.data[type + 'Policies']) || [];
  } catch (e) {
    return [];
  }
}

async function upsertPolicies(type, items){
  const now = new Date();
  const expires = new Date(Date.now() + ttlSeconds()*1000);
  const changed = [];
  for (const it of items){ // eslint-disable-line no-restricted-syntax
    const external_id = it.id || it.policyId || it.policy_id || JSON.stringify(it).length.toString();
    const content_hash = hashObject(it);
    // eslint-disable-next-line no-await-in-loop
    const existing = await EbayPolicyCache.findOne({ where:{ policy_type:type, external_id } });
    if (existing && existing.content_hash === content_hash) { continue; }
    // eslint-disable-next-line no-await-in-loop
    await EbayPolicyCache.create({ policy_type:type, external_id, name: it.name || it.profileName, raw_json: it, fetched_at: now, expires_at: expires, content_hash });
    changed.push({ policy_type: type, external_id, content_hash });
  }
  return changed;
}

async function refreshPolicies(){
  if(!featureEnabled()) { return { skipped:true, reason:'feature_flag_disabled' }; }
  const types = policyTypes();
  let total = 0; let changed = 0; const changedPolicies = [];
  for(const t of types){ // eslint-disable-line no-restricted-syntax
    // eslint-disable-next-line no-await-in-loop
    const items = await fetchPolicyList(t);
  if (txn) { txn.logTxn({ direction:'outbound', channel:'policy', operation:'refresh', request_url:`/business_policies/${t}`, request_method:'GET', status:'success', response_body:redactObject({ count: items.length }) }); }
    total += items.length;
    // capture count before
    // eslint-disable-next-line no-await-in-loop
    const before = await EbayPolicyCache.count({ where:{ policy_type:t } });
    // eslint-disable-next-line no-await-in-loop
    const newlyChanged = await upsertPolicies(t, items);
    // eslint-disable-next-line no-await-in-loop
    const after = await EbayPolicyCache.count({ where:{ policy_type:t } });
    changed += Math.max(0, after - before);
    changedPolicies.push(...newlyChanged);
  }
  let impact = null;
  if (changedPolicies.length && process.env.EBAY_POLICY_IMPACT_ENABLED === 'true') {
    try {
      // Lazy load to avoid circular import if any
      // eslint-disable-next-line global-require
      const { handlePolicyChanges } = require('./policyImpactHandler');
      // eslint-disable-next-line no-await-in-loop
      impact = await handlePolicyChanges(changedPolicies);
    } catch(e){ impact = { error: e.message }; }
  }
  if (metrics) { metrics.inc('policy.refreshes'); metrics.inc('policy.policies_fetched', total); metrics.inc('policy.policies_changed', changedPolicies.length); }
  return { skipped:false, totalFetched: total, newOrChanged: changed, changedPolicies: changedPolicies.length, impact };
}

async function purgeExpired(){
  const now = new Date();
  const deleted = await EbayPolicyCache.destroy({ where:{ expires_at: { [Op.lt]: now } } });
  return { deleted };
}

module.exports = { refreshPolicies, purgeExpired, _test:{ featureEnabled, policyTypes, upsertPolicies } }; 
