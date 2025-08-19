/**
 * hashUtil.js
 * Canonical JSON serialization + SHA256 hashing utilities for projections/payloads.
 */
const crypto = require('crypto');

/**
 * Recursively sort object keys to produce a canonical representation.
 * Arrays preserve order. Primitive values returned as-is.
 */
function canonicalize(value) {
  if (value === null || value === undefined) {
    return value;
  }
  if (Array.isArray(value)) {
    return value.map(canonicalize);
  }
  if (typeof value === 'object' && Object.prototype.toString.call(value) === '[object Object]') {
    return Object.keys(value)
      .sort()
      .reduce((acc, k) => {
        acc[k] = canonicalize(value[k]);
        return acc;
      }, {});
  }
  return value; // primitive
}

/**
 * Serialize value with stable ordering (2-space for readability if needed) but without trailing spaces.
 */
function canonicalJSONString(value) {
  return JSON.stringify(canonicalize(value));
}

/**
 * Compute SHA256 hash of provided object/value after canonicalization.
 * Optionally omit specified top-level keys before hashing (e.g., volatile timestamps).
 */
function hashObject(obj, { omitKeys = [] } = {}) {
  let working = obj;
  if (omitKeys.length && working && typeof working === 'object' && !Array.isArray(working)) {
    working = { ...working };
    for (const k of omitKeys) delete working[k];
  }
  const json = canonicalJSONString(working);
  return crypto.createHash('sha256').update(json).digest('hex');
}

module.exports = {
  canonicalize,
  canonicalJSONString,
  hashObject
};
