/**
 * historyController.js
 * Endpoint(s) for querying audit history from historylogs.
 */
const { pool } = require('../utils/database');
const { ENTITY } = require('../constants/entities');

// Build a Set for quick validation of allowed entities
const ALLOWED = new Set(Object.values(ENTITY));

/**
 * GET /api/history/:entity/:id
 * Query params: page (default 1), limit (default 25), fields=comma,separated (optional filter where changed_fields @> array)
 */
exports.getEntityHistory = async (req, res) => {
  try {
    const { entity, id } = req.params;
    if (!ALLOWED.has(entity)) {
      return res.status(400).json({ message: 'Unknown entity' });
    }
    const entityId = parseInt(id, 10);
    if (Number.isNaN(entityId)) {
      return res.status(400).json({ message: 'Invalid id' });
    }
    const page = parseInt(req.query.page, 10) || 1;
    const limit = Math.min(parseInt(req.query.limit, 10) || 25, 100);
    const offset = (page - 1) * limit;
    let fieldFilter = null;
    let fieldSQL = '';
    if (req.query.fields) {
      const fields = req.query.fields.split(',').map(f => f.trim()).filter(Boolean);
      if (fields.length) {
        fieldFilter = fields;
        fieldSQL = ' AND changed_fields @> $4';
      }
    }
    let rowsParams;
    let countParams;
    let rowsQuery;
    let countQuery;
    if (fieldFilter) {
      rowsParams = [entity, entityId, fieldFilter, limit, offset];
      countParams = [entity, entityId, fieldFilter];
      rowsQuery = `SELECT id, entity, entity_id, action, change_details, changed_fields, before_data, after_data, user_account_id, created_at
                   FROM historylogs
                   WHERE entity = $1 AND entity_id = $2 AND changed_fields @> $3
                   ORDER BY created_at DESC, id DESC
                   LIMIT $4 OFFSET $5`;
      countQuery = `SELECT COUNT(*) AS total FROM historylogs WHERE entity = $1 AND entity_id = $2 AND changed_fields @> $3`;
    } else {
      rowsParams = [entity, entityId, limit, offset];
      countParams = [entity, entityId];
      rowsQuery = `SELECT id, entity, entity_id, action, change_details, changed_fields, before_data, after_data, user_account_id, created_at
                   FROM historylogs
                   WHERE entity = $1 AND entity_id = $2
                   ORDER BY created_at DESC, id DESC
                   LIMIT $3 OFFSET $4`;
      countQuery = `SELECT COUNT(*) AS total FROM historylogs WHERE entity = $1 AND entity_id = $2`;
    }

    const [rowsRes, countRes] = await Promise.all([
      pool.query(rowsQuery, rowsParams),
      pool.query(countQuery, countParams)
    ]);

    const total = parseInt(countRes.rows[0].total, 10);
    res.json({
      entity,
      entity_id: entityId,
      page,
      pageSize: limit,
      total,
      results: rowsRes.rows
    });
  } catch (e) {
    console.error('Error fetching entity history:', e?.message || e);
    res.status(500).json({ message: 'Error fetching history' });
  }
};
