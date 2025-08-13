/**
 * auditLogger.js
 * ----------------------------------------------------------------------------
 * Unified audit logging utility for structured change history across entities.
 *
 * Responsibilities:
 *  - Compute shallow diffs between before/after objects (excluding volatile fields).
 *  - Insert audit rows into historylogs with JSONB before/after snapshots.
 *  - Skip no-op updates (no changed fields).
 *  - Produce human-readable summary (change_details) for quick glance.
 *
 * Notes:
 *  - Designed to be called from controllers or Sequelize hooks.
 *  - Uses pg pool directly to avoid recursive ORM side effects.
 *  - Future: enrich with user context (pass userId) or correlation IDs.
 * ----------------------------------------------------------------------------
 */

const { pool } = require('./database');

// Fields we never diff/log (timestamps auto-managed, internal bookkeeping)
const EXCLUDE_FIELDS = new Set(['created_at', 'updated_at']);

/**
 * Compute a shallow diff between two plain objects.
 * - Treat numeric-like strings and numbers with the same numeric value as equal (prevents "42.5" vs 42.5 false positives).
 * - Ignores functions and excluded fields.
 * @param {object|null} beforeObj - Previous state (null for create).
 * @param {object|null} afterObj - New state (null for delete).
 * @returns {{changed:string[], beforeData:Object|null, afterData:Object|null}}
 */
function computeDiff(beforeObj, afterObj) {
  if (!beforeObj && afterObj) {
    // Creation: record all non-excluded fields that are not undefined/null
    const afterData = {};
    const changed = [];
    for (const [k, v] of Object.entries(afterObj)) {
      if (EXCLUDE_FIELDS.has(k) || typeof v === 'function') {
        continue;
      }
      changed.push(k);
      afterData[k] = v;
    }
    return { changed, beforeData: null, afterData };
  }
  if (beforeObj && !afterObj) {
    // Deletion: record entire previous snapshot
    const beforeData = {};
    const changed = [];
    for (const [k, v] of Object.entries(beforeObj)) {
      if (EXCLUDE_FIELDS.has(k) || typeof v === 'function') {
        continue;
      }
      changed.push(k);
      beforeData[k] = v;
    }
    return { changed, beforeData, afterData: null };
  }
  // Update
  const beforeData = {};
  const afterData = {};
  const changed = [];
  for (const key of new Set([...Object.keys(beforeObj || {}), ...Object.keys(afterObj || {})])) {
    if (EXCLUDE_FIELDS.has(key)) {
      continue;
    }
    const prev = beforeObj ? beforeObj[key] : undefined;
    const next = afterObj ? afterObj[key] : undefined;
    // Treat NaN vs NaN as equal; functions ignored.
    if (typeof prev === 'function' || typeof next === 'function') {
      continue;
    }
    const bothNaN = Number.isNaN(prev) && Number.isNaN(next);
    // Numeric-like string vs number normalization ("42.5" vs 42.5)
    let numericallyEqual = false;
    if (prev != null && next != null) {
      const prevIsNumLike = typeof prev === 'string' && /^[-+]?\d+(?:\.\d+)?$/.test(prev);
      const nextIsNumLike = typeof next === 'string' && /^[-+]?\d+(?:\.\d+)?$/.test(next);
      if ((prevIsNumLike || typeof prev === 'number') && (nextIsNumLike || typeof next === 'number')) {
        const prevNum = prevIsNumLike ? Number(prev) : prev;
        const nextNum = nextIsNumLike ? Number(next) : next;
        if (typeof prevNum === 'number' && typeof nextNum === 'number' && !Number.isNaN(prevNum) && !Number.isNaN(nextNum)) {
          numericallyEqual = prevNum === nextNum;
        }
      }
    }
    if (prev === next || bothNaN || numericallyEqual) {
      continue;
    }
    changed.push(key);
    if (prev !== undefined) {
      beforeData[key] = prev;
    }
    if (next !== undefined) {
      afterData[key] = next;
    }
  }
  return { changed, beforeData: Object.keys(beforeData).length ? beforeData : null, afterData: Object.keys(afterData).length ? afterData : null };
}

/**
 * Insert a row into historylogs.
 * Skips if action==='update' and no changed fields.
 */
async function insertAudit({ entity, entityId, action, changed, beforeData, afterData, userId }) {
  if (action === 'update' && (!changed || changed.length === 0)) {
    return; // no-op
  }
  const summary = buildSummary(action, entity, changed);
  if (process.env.AUDIT_DEBUG === '1') {
    // Lightweight debug (avoid heavy logging in production unless enabled)
    // eslint-disable-next-line no-console
    console.debug('[AUDIT]', { entity, entityId, action, changed, beforeData, afterData });
  }
  const query = `INSERT INTO historylogs (entity, entity_id, action, change_details, changed_fields, before_data, after_data, user_account_id)
                 VALUES ($1,$2,$3,$4,$5,$6,$7,$8)`;
  const params = [
    entity,
    entityId,
    action,
    summary,
    changed && changed.length ? changed : null,
    beforeData ? JSON.stringify(beforeData) : null,
    afterData ? JSON.stringify(afterData) : null,
    userId || null
  ];
  await pool.query(query, params);
}

function buildSummary(action, entity, changed) {
  if (action === 'create') {
    return `Created ${entity}`;
  }
  if (action === 'delete') {
    return `Deleted ${entity}`;
  }
  if (action === 'update') {
    return changed && changed.length ? `Updated ${entity}: ${changed.join(', ')}` : `Updated ${entity}`;
  }
  return `${action} ${entity}`;
}

/** Public API **/
async function logCreate(entity, entityId, afterObj, userId) {
  const { changed, afterData } = computeDiff(null, afterObj || {});
  await insertAudit({ entity, entityId, action: 'create', changed, beforeData: null, afterData, userId });
}

async function logUpdate(entity, entityId, beforeObj, afterObj, userId) {
  const { changed, beforeData, afterData } = computeDiff(beforeObj || {}, afterObj || {});
  await insertAudit({ entity, entityId, action: 'update', changed, beforeData, afterData, userId });
}

async function logDelete(entity, entityId, beforeObj, userId) {
  const { changed, beforeData } = computeDiff(beforeObj || {}, null);
  await insertAudit({ entity, entityId, action: 'delete', changed, beforeData, afterData: null, userId });
}

module.exports = {
  computeDiff,
  logCreate,
  logUpdate,
  logDelete
};
