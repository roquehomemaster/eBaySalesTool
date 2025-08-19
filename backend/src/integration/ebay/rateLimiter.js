/**
 * rateLimiter.js
 * Simple token bucket with periodic refill + adaptive reduction when server returns rate limit headers.
 */
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }

const MAX_TOKENS = parseInt(process.env.EBAY_RATE_LIMIT_BUCKET_MAX || process.env.EBAY_RATE_LIMIT_RPS || '5', 10);
const REFILL_MS = parseInt(process.env.EBAY_RATE_LIMIT_REFILL_MS || '1000', 10);
const SOFT_THRESHOLD = parseFloat(process.env.EBAY_RATE_LIMIT_SOFT_THRESHOLD || '0.2'); // fraction

let tokens = MAX_TOKENS;
let lastRefill = Date.now();

function refill(){
  const now = Date.now();
  if (now - lastRefill >= REFILL_MS) {
    tokens = MAX_TOKENS; lastRefill = now;
  }
}

async function acquire(){
  let waits = 0;
  // eslint-disable-next-line no-constant-condition
  while(true){
    refill();
    if (tokens > 0) { tokens -= 1; if (metrics) { metrics.setGauge('rate.remaining_quota', tokens); } return; }
    if (waits > 250) { throw new Error('rate_limit_wait_timeout'); }
    // eslint-disable-next-line no-await-in-loop
    await new Promise(r=>setTimeout(r,10)); waits += 1;
  }
}

function adjustFromHeaders(headers){
  if(!headers){ return; }
  // If header indicates remaining quota lower than current tokens, clamp.
  const remaining = parseInt(headers['x-rate-limit-remaining'] || headers['x-ebay-rate-limit-remaining'] || '', 10);
  if(!Number.isNaN(remaining)){
    tokens = Math.min(tokens, remaining);
    if (metrics) { metrics.setGauge('rate.remaining_quota', tokens); }
  }
}

function nearDepletion(){
  return tokens / MAX_TOKENS <= SOFT_THRESHOLD;
}

module.exports = { acquire, adjustFromHeaders, nearDepletion, _test:{ getTokens:()=>tokens, refill } };
