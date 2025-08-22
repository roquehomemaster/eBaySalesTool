/**
 * circuitBreaker.js
 * Minimal in-process circuit breaker for adapter calls.
 * States: closed -> (open) -> half_open -> closed
 */
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }

const STATE = { CLOSED:'closed', OPEN:'open', HALF_OPEN:'half_open' };

let state = STATE.CLOSED;
let consecutiveFailures = 0;
let lastOpenedAt = 0;
let openUntil = 0;
let halfOpenProbeInFlight = false;

function now(){ return Date.now(); }

function config(){
  return {
    failThreshold: parseInt(process.env.EBAY_ADAPTER_CB_CONSECUTIVE_FAILS || '10', 10),
    cooldownMs: parseInt(process.env.EBAY_ADAPTER_CB_COOLDOWN_MS || '30000', 10)
  };
}

function allowRequest(){
  const { cooldownMs } = config();
  const ts = now();
  if (state === STATE.OPEN) {
    if (ts >= openUntil) {
      // move to half open
      state = STATE.HALF_OPEN;
      halfOpenProbeInFlight = false;
      if (metrics) { metrics.setGauge('adapter.circuit_state', 2); }
    } else {
      return false;
    }
  }
  if (state === STATE.HALF_OPEN) {
    if (halfOpenProbeInFlight) { return false; }
    halfOpenProbeInFlight = true; // allow single probe
    return true;
  }
  return true; // closed
}

function onSuccess(){
  consecutiveFailures = 0;
  if (state === STATE.HALF_OPEN) {
    // close breaker
    state = STATE.CLOSED; halfOpenProbeInFlight = false; if (metrics) { metrics.inc('adapter.circuit_half_open_probe_success'); metrics.setGauge('adapter.circuit_state', 0); }
  }
}

function openBreaker(){
  const { cooldownMs } = config();
  state = STATE.OPEN; lastOpenedAt = now(); openUntil = lastOpenedAt + cooldownMs; consecutiveFailures = 0; halfOpenProbeInFlight = false;
  if (metrics) { metrics.inc('adapter.circuit_opened'); metrics.setGauge('adapter.circuit_state', 1); }
}

function onFailure(){
  consecutiveFailures += 1;
  const { failThreshold } = config();
  if (state === STATE.HALF_OPEN) {
    if (metrics) { metrics.inc('adapter.circuit_half_open_probe_failure'); }
    openBreaker();
    return;
  }
  if (state === STATE.CLOSED && consecutiveFailures >= failThreshold) {
    openBreaker();
  }
}

function status(){
  return { state, consecutiveFailures, lastOpenedAt, openUntil, now: now() };
}

function reset(){
  state = STATE.CLOSED;
  consecutiveFailures = 0;
  lastOpenedAt = 0;
  openUntil = 0;
  halfOpenProbeInFlight = false;
  if (metrics) { metrics.setGauge('adapter.circuit_state', 0); }
}

module.exports = { allowRequest, onSuccess, onFailure, status, reset, STATE };
