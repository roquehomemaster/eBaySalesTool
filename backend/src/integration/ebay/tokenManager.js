/**
 * tokenManager.js
 * Lightweight OAuth access token manager with auto-refresh and metrics.
 * Supports either a static token (EBAY_OAUTH_TOKEN) or dynamic refresh using client credentials / refresh token.
 * Environment variables:
 *  EBAY_OAUTH_TOKEN                Static token (bypasses refresh logic if set and no refresh vars)
 *  EBAY_OAUTH_CLIENT_ID            OAuth client id
 *  EBAY_OAUTH_CLIENT_SECRET        OAuth client secret
 *  EBAY_OAUTH_REFRESH_TOKEN        Optional long-lived refresh token (if using refresh_token grant)
 *  EBAY_OAUTH_SCOPE                Optional space-delimited scopes (for client_credentials)
 *  EBAY_OAUTH_TOKEN_URL            Token endpoint URL (default https://api.ebay.com/identity/v1/oauth2/token)
 *  EBAY_OAUTH_REFRESH_SAFETY_MS    Milliseconds before expiry to proactively refresh (default 60000)
 *  EBAY_OAUTH_FORCE_REFRESH_EACH   If set to 'true', forces refresh on each call (testing)
 */
const axios = require('axios');
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }
let logger; try { logger = require('../../utils/logger'); } catch(_) { logger = console; }

const DEFAULT_TOKEN_URL = 'https://api.ebay.com/identity/v1/oauth2/token';

let state = {
  accessToken: null,
  expiresAt: 0,
  refreshing: false,
  lastRefreshSuccess: null,
  lastRefreshError: null,
  lastErrorMessage: null,
  consecutiveFailures: 0,
  lastDegradedAt: null,
  lastRecoveredAt: null
};

function snapshot(){
  return { ...state, degraded: isDegraded() };
}

function now(){ return Date.now(); }

function tokenAgeMs(){ return state.accessToken ? (now() - (state.lastRefreshSuccess || now())) : null; }
function expiresInMs(){ return state.expiresAt ? (state.expiresAt - now()) : null; }

function shouldUseStatic(){
  return !!process.env.EBAY_OAUTH_TOKEN && !process.env.EBAY_OAUTH_CLIENT_ID && !process.env.EBAY_OAUTH_REFRESH_TOKEN;
}

function safetyWindow(){
  return parseInt(process.env.EBAY_OAUTH_REFRESH_SAFETY_MS || '60000', 10);
}

function needsRefresh(){
  if (!state.accessToken) { return true; }
  if (process.env.EBAY_OAUTH_FORCE_REFRESH_EACH === 'true') { return true; }
  return expiresInMs() !== null && expiresInMs() < safetyWindow();
}

function failureThreshold(){
  return parseInt(process.env.EBAY_OAUTH_MAX_CONSECUTIVE_FAILURES || '5', 10);
}

function isDegraded(){
  return state.consecutiveFailures >= failureThreshold();
}

let lastDegradedFlag = false; // for edge transition tracking
let lastDegradedEnterLogTs = 0; // debounce degraded enter logs

async function refresh(){
  if (state.refreshing){
    // wait for in-flight refresh
    while(state.refreshing){ // simple spin with delay
      await new Promise(r => setTimeout(r, 25));
    }
    return;
  }
  state.refreshing = true;
  metrics && metrics.inc('adapter.oauth.refresh_attempt');
  try {
    const maxRetries = parseInt(process.env.EBAY_OAUTH_REFRESH_MAX_RETRIES || '3', 10);
    let attempt = 0; let lastErr;
    while (attempt <= maxRetries) {
      try {
  if (shouldUseStatic()) {
          state.accessToken = process.env.EBAY_OAUTH_TOKEN;
          state.expiresAt = now() + 3600*1000; // assume 1h
          state.lastRefreshSuccess = now();
          metrics && metrics.inc('adapter.oauth.refresh_static');
        } else {
          const tokenUrl = process.env.EBAY_OAUTH_TOKEN_URL || DEFAULT_TOKEN_URL;
          const clientId = process.env.EBAY_OAUTH_CLIENT_ID;
          const clientSecret = process.env.EBAY_OAUTH_CLIENT_SECRET;
          const refreshToken = process.env.EBAY_OAUTH_REFRESH_TOKEN;
          const scope = process.env.EBAY_OAUTH_SCOPE;

          if (!clientId || !clientSecret){ throw new Error('missing_client_credentials'); }

          let payload; let headers;
          if (refreshToken){
            payload = new URLSearchParams({ grant_type:'refresh_token', refresh_token: refreshToken, scope: scope || '' });
            headers = { 'Content-Type':'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(clientId+':'+clientSecret).toString('base64') };
          } else {
            payload = new URLSearchParams({ grant_type:'client_credentials', scope: scope || '' });
            headers = { 'Content-Type':'application/x-www-form-urlencoded', Authorization: 'Basic ' + Buffer.from(clientId+':'+clientSecret).toString('base64') };
          }
          const start = now();
          let resp;
          try {
            resp = await axios.post(tokenUrl, payload, { headers });
          } catch(err){
            throw new Error('token_endpoint_error:' + (err.response && err.response.status));
          }
          const body = resp.data || {};
          state.accessToken = body.access_token;
          const expiresInSec = body.expires_in || 3600; // seconds
          state.expiresAt = now() + expiresInSec*1000;
          state.lastRefreshSuccess = now();
          metrics && metrics.observe('adapter.oauth.refresh_latency_ms', now()-start);
          metrics && metrics.inc('adapter.oauth.refresh_success');
        }
    state.lastErrorMessage = null;
    state.consecutiveFailures = 0; // reset on success
        lastErr = null;
        break; // success
      } catch (err) {
        lastErr = err;
        state.lastRefreshError = now();
        state.lastErrorMessage = err.message;
        metrics && metrics.inc('adapter.oauth.refresh_failure');
    state.consecutiveFailures += 1;
    const degradedNow = isDegraded();
    if (degradedNow && !lastDegradedFlag) {
      state.lastDegradedAt = now();
      metrics && metrics.inc('adapter.oauth.degraded_enter');
      const cooldown = parseInt(process.env.EBAY_OAUTH_DEGRADED_LOG_COOLDOWN_MS || '60000', 10);
      if (now() - lastDegradedEnterLogTs > cooldown) {
        try {
          logger.warn(JSON.stringify({ event: 'oauth_degraded_enter', consecutiveFailures: state.consecutiveFailures, failureThreshold: failureThreshold(), lastError: state.lastErrorMessage, ts: state.lastDegradedAt, cooldownMs: cooldown }));
        } catch(_) { /* ignore logging errors */ }
        lastDegradedEnterLogTs = now();
      }
    }
  metrics && metrics.setGauge('adapter.oauth.consecutive_failures', state.consecutiveFailures);
  metrics && metrics.setGauge('adapter.oauth.degraded', degradedNow ? 1 : 0);
  if (metrics) { metrics.setGauge('adapter.oauth.degraded_duration_ms', degradedNow && state.lastDegradedAt ? (now() - state.lastDegradedAt) : 0); }
    lastDegradedFlag = degradedNow;
        if (attempt === maxRetries) { throw err; }
        attempt++;
        metrics && metrics.inc('adapter.oauth.refresh_retry');
        const backoff = Math.min(1000 * Math.pow(2, attempt-1), 8000) + Math.floor(Math.random()*200);
        await new Promise(r => setTimeout(r, backoff));
      }
    }
  } finally {
    state.refreshing = false;
    // update gauges
    metrics && metrics.setGauge('adapter.oauth.token_age_ms', tokenAgeMs() || 0);
    metrics && metrics.setGauge('adapter.oauth.expires_in_ms', expiresInMs() || 0);
  const degradedNowFinal = isDegraded();
  if (!degradedNowFinal && lastDegradedFlag) {
    state.lastRecoveredAt = now();
    metrics && metrics.inc('adapter.oauth.degraded_exit');
    try {
      logger.info(JSON.stringify({ event: 'oauth_degraded_exit', consecutiveFailures: state.consecutiveFailures, failureThreshold: failureThreshold(), degradedDurationMs: state.lastRecoveredAt - (state.lastDegradedAt || state.lastRecoveredAt), ts: state.lastRecoveredAt }));
    } catch(_) { /* ignore logging errors */ }
  }
  metrics && metrics.setGauge('adapter.oauth.consecutive_failures', state.consecutiveFailures);
  metrics && metrics.setGauge('adapter.oauth.degraded', degradedNowFinal ? 1 : 0);
  if (metrics) { metrics.setGauge('adapter.oauth.degraded_duration_ms', degradedNowFinal && state.lastDegradedAt ? (now() - state.lastDegradedAt) : 0); }
  lastDegradedFlag = degradedNowFinal;
  }
}

async function getAccessToken(){
  if (needsRefresh()) {
    await refresh();
  }
  return state.accessToken;
}

module.exports = { getAccessToken, snapshot, _internal: { needsRefresh, refresh, state } };
module.exports._internal.reset = function(){
  state = { accessToken:null, expiresAt:0, refreshing:false, lastRefreshSuccess:null, lastRefreshError:null, lastErrorMessage:null, consecutiveFailures:0, lastDegradedAt:null, lastRecoveredAt:null };
  lastDegradedFlag = false;
  lastDegradedEnterLogTs = 0;
};
