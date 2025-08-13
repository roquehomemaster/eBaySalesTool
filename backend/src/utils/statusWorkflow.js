/**
 * statusWorkflow.js
 * Centralized loading & validation for listing status transitions.
 */
const { pool } = require('./database');

// Default branching status graph if not configured.
const DEFAULT_GRAPH = {
  draft: ['ready_to_list'],
  ready_to_list: ['listed'],
  listed: ['sold', 'listing_ended', 'listing_removed'],
  listing_ended: ['relist', 'listing_removed'],
  relist: ['ready_to_list'],
  sold: ['shipped'],
  shipped: ['in_warranty', 'ready_for_payment'],
  in_warranty: ['ready_for_payment'],
  ready_for_payment: ['complete'],
  listing_removed: [],
  complete: []
};

async function loadWorkflow() {
  const res = await pool.query("SELECT config_key, config_value FROM appconfig WHERE config_key IN ('listing_status_graph','listing_status_workflow')");
  const graphRow = res.rows.find(r => r.config_key === 'listing_status_graph');
  if (graphRow) {
    try { return JSON.parse(graphRow.config_value); } catch { /* fall through */ }
  }
  const linearRow = res.rows.find(r => r.config_key === 'listing_status_workflow');
  if (linearRow) {
    try {
      const arr = JSON.parse(linearRow.config_value);
      if (Array.isArray(arr)) {
        const g = {};
        arr.forEach((v, i) => { g[v] = i === arr.length - 1 ? [] : [arr[i + 1]]; });
        return g;
      }
    } catch { /* ignore */ }
  }
  return DEFAULT_GRAPH;
}

function normalizeStatus(status) {
  if (!status) return status;
  const s = String(status).trim().toLowerCase();
  if (s === 'active') return 'listed';
  return s;
}

async function validateTransition(current, next) {
  if (next == null || next === current) return { ok: true, normalizedNext: next };
  const graph = await loadWorkflow();
  const cur = normalizeStatus(current);
  const target = normalizeStatus(next);
  const allStatuses = new Set(Object.keys(graph));
  if (!allStatuses.has(target)) {
    return { ok: false, error: `Invalid status '${next}'`, normalizedNext: target };
  }
  if (cur == null || !allStatuses.has(cur)) {
    return { ok: true, normalizedNext: target };
  }
  const allowed = graph[cur] || [];
  if (allowed.includes(target)) {
    return { ok: true, normalizedNext: target };
  }
  return { ok: false, error: `Transition ${cur} -> ${target} not allowed`, normalizedNext: target, allowed };
}

async function getWorkflowDescriptor() {
  const graph = await loadWorkflow();
  const nodes = Object.keys(graph).map(k => ({ status: k, next: graph[k] }));
  return { graph, nodes };
}

module.exports = { loadWorkflow, validateTransition, getWorkflowDescriptor, normalizeStatus, DEFAULT_GRAPH };
