const express = require('express');
const router = express.Router();
let metrics; try { metrics = require('../integration/ebay/metrics'); } catch(_) { /* optional */ }
// Optional persistence
let sequelize; try { ({ sequelize } = require('../utils/database')); } catch(_) { /* optional */ }
// In-memory rolling alert history (process lifetime only)
function historyLimit(){ return parseInt(process.env.EBAY_ALERT_HISTORY_LIMIT || '500', 10); }
const alertHistory = [];
let alertHistoryTableEnsured = false;
// Track previously active (non-suppressed) alerts for clear detection across requests
const _previousActiveAlerts = new Map(); // key -> { severity, ts }
async function ensureAlertHistoryTable(){
  if (alertHistoryTableEnsured) { return; }
  if (!process.env.EBAY_ALERT_HISTORY_PERSIST || process.env.EBAY_ALERT_HISTORY_PERSIST !== '1') { return; }
  if (!sequelize) { return; }
  try {
    await sequelize.query(`CREATE TABLE IF NOT EXISTS ebay_alert_history (
      id BIGSERIAL PRIMARY KEY,
      ts BIGINT NOT NULL,
      key TEXT NOT NULL,
      severity TEXT NOT NULL,
      payload JSONB,
      created_at TIMESTAMPTZ DEFAULT now()
    );
    CREATE INDEX IF NOT EXISTS ix_ebay_alert_history_key_ts ON ebay_alert_history(key, ts DESC);`);
    alertHistoryTableEnsured = true;
  } catch (err) {
    // swallow (non-fatal); only log in debug
    if ((process.env.LOG_LEVEL || 'info') === 'debug') {
      console.error('ensureAlertHistoryTable error', err.message);
    }
  }
}
async function persistAlerts(list, ts){
  if (!process.env.EBAY_ALERT_HISTORY_PERSIST || process.env.EBAY_ALERT_HISTORY_PERSIST !== '1') { return; }
  if (!sequelize) { return; }
  try {
    await ensureAlertHistoryTable();
    for (const a of list) {
      // Insert individually for simplicity (low volume expected)
      await sequelize.query('INSERT INTO ebay_alert_history (ts, key, severity, payload) VALUES (:ts, :key, :severity, :payload)', {
        replacements: { ts, key: a.key, severity: a.severity, payload: JSON.stringify(a) }
      });
    }
  } catch (err) {
    if ((process.env.LOG_LEVEL || 'info') === 'debug') {
      console.error('persistAlerts error', err.message);
    }
  }
}
async function pruneAlertHistory(){
  if (!process.env.EBAY_ALERT_HISTORY_PERSIST || process.env.EBAY_ALERT_HISTORY_PERSIST !== '1') { return; }
  if (!sequelize) { return; }
  const daysStr = process.env.EBAY_ALERT_HISTORY_RETENTION_DAYS;
  if (!daysStr) { return; }
  const days = parseInt(daysStr, 10);
  if (!days || days <= 0) { return; }
  try {
    const cutoffTs = Date.now() - days * 24 * 60 * 60 * 1000;
    const [result] = await sequelize.query('DELETE FROM ebay_alert_history WHERE ts < :cutoff', { replacements: { cutoff: cutoffTs } });
    // result rowCount may differ by driver; attempt generic handling
    const deleted = (result && typeof result.rowCount === 'number') ? result.rowCount : (result?.affectedRows || 0);
    if (metrics) {
      try {
        if (deleted) { metrics.inc('alert_history.retention_deleted', deleted); }
        if (metrics.mark) { metrics.mark('alert_history.last_retention_run'); }
      } catch(_) { /* ignore */ }
    }
  } catch(err) {
    if ((process.env.LOG_LEVEL || 'info') === 'debug') { console.error('pruneAlertHistory error', err.message); }
  }
}
function recordAlerts(list){
  const ts = Date.now();
  const globalSuppressMs = parseInt(process.env.EBAY_ALERT_SUPPRESS_GLOBAL_MS || '0', 10);
  const final = [];
  for (const a of list) {
    // Per-key override: EBAY_ALERT_SUPPRESS_<KEY>_MS (KEY uppercased, non-alphanumerics to underscore)
    let suppressMs = globalSuppressMs;
    if (a.key) {
      const envKey = 'EBAY_ALERT_SUPPRESS_' + a.key.toUpperCase().replace(/[^A-Z0-9]+/g,'_') + '_MS';
      if (process.env[envKey]) {
        const v = parseInt(process.env[envKey],10); if (!Number.isNaN(v)) { suppressMs = v; }
      }
    }
    if (suppressMs > 0) {
      // Find most recent matching key
      for (let i = alertHistory.length - 1; i >= 0; i--) {
        const prev = alertHistory[i];
        if (prev.key === a.key) {
          const age = ts - prev.ts;
            // Suppress only if same severity and within window; allow escalation or change
          if (age <= suppressMs && prev.severity === a.severity) {
            if (metrics) { try { 
              metrics.inc('alerts.suppressed_total'); 
              metrics.inc(`alerts.${a.key}.suppressed_total`); 
              metrics.setGauge('alerts.last_suppressed_ts', ts); 
              metrics.setGauge(`alerts.${a.key}.last_suppressed_ts`, ts);
            } catch(_){} }
            a._suppressed = true; // internal tag (not persisted)
          }
          break; // stop after first matching previous record
        }
      }
    }
    if (!a._suppressed) { alertHistory.push({ ts, ...a }); final.push(a); }
  }
  const limit = historyLimit();
  if (alertHistory.length > limit) {
    alertHistory.splice(0, alertHistory.length - limit);
  }
  // fire and forget persistence
  if (final.length) { persistAlerts(final, ts); } // intentionally not awaited
  // opportunistic prune (fire & forget)
  pruneAlertHistory();
  // metrics counters per alert key + severity
  if (metrics) {
    try {
      final.forEach(a => {
        metrics.inc(`alerts.fired_total`);
        metrics.inc(`alerts.${a.key}.fired_total`);
        metrics.inc(`alerts.${a.key}.${a.severity}_total`);
        // track last fired timestamp gauges
        metrics.setGauge(`alerts.${a.key}.last_fired_ts`, ts);
        metrics.setGauge(`alerts.${a.key}.last_fired_severity`, a.severity === 'page' ? 2 : (a.severity === 'warn' ? 1 : 0));
      });
    } catch(_) { /* ignore */ }
  }
}

// Expose lightweight internal state metrics as gauges for Prometheus export
function enrichSnapshotWithInternalState(base){
  if (!base || !metrics || !metrics._internal_state) { return base; }
  try {
    const st = metrics._internal_state;
    if (Array.isArray(st.queue_item_wait_samples)) {
      base.gauges = base.gauges || {};
      base.gauges['queue.wait_samples_size'] = st.queue_item_wait_samples.length;
      if (st.queue_item_wait_samples.length) {
        const latest = st.queue_item_wait_samples[st.queue_item_wait_samples.length - 1];
        base.gauges['queue.wait_samples_last_wait_ms'] = latest.wait;
      }
    }
  } catch(_) { /* ignore */ }
  return base;
}

router.get('/metrics', (req,res) => {
  if(!metrics){ return res.status(503).json({ error:'metrics_unavailable' }); }
  const snap = metrics.snapshot();
  enrichSnapshotWithInternalState(snap);
  res.json(snap);
});

// Alerts preview: derive current firing conditions (best-effort heuristic, not a replacement for Prometheus rules)
router.get('/metrics/alerts', (req,res) => {
  if(!metrics){ return res.status(503).json({ error:'metrics_unavailable' }); }
  const snap = metrics.snapshot();
  const out = [];
  const now = Date.now();
  // OAuth degraded
  if (snap.gauges['adapter.oauth.degraded'] === 1) {
    out.push({ key: 'oauth_degraded', severity: 'page', sinceMs: snap.gauges['adapter.oauth.degraded_duration_ms'] || 0 });
  }
  // Auth failure ratio instantaneous
  const ratio = snap.gauges['adapter.http.auth_failure_ratio'];
  const ema = snap.gauges['adapter.http.auth_failure_ratio_ema'];
  const thr = parseFloat(process.env.EBAY_HTTP_AUTH_FAILURE_RATIO_ALERT || '0');
  if (thr > 0 && typeof ratio === 'number' && ratio > thr) {
    out.push({ key: 'auth_failure_ratio_threshold', severity: 'warn', ratio, threshold: thr, ema });
  }
  // Circuit open
  if (snap.gauges['adapter.circuit_state'] === 1) {
    out.push({ key: 'circuit_breaker_open', severity: 'warn' });
  }
  // DB unreachable (db.reachable gauge set by readiness probe logic)
  if (typeof snap.gauges['db.reachable'] === 'number' && snap.gauges['db.reachable'] === 0) {
    const lastUn = snap.timestamps['db.last_unreachable'];
    out.push({ key: 'db_unreachable', severity: 'page', sinceMs: lastUn ? (Date.now() - lastUn) : null });
  }
  // Queue backlog (use queue_pending_depth gauge vs threshold)
  const backlogThreshold = parseInt(process.env.EBAY_QUEUE_BACKLOG_READY_THRESHOLD || '0', 10);
  if (backlogThreshold > 0) {
    const depth = snap.gauges.queue_pending_depth || snap.gauges['queue.pending_depth'] || 0;
    if (depth >= backlogThreshold) {
      out.push({ key: 'queue_backlog', severity: depth >= backlogThreshold * 2 ? 'page' : 'warn', depth, threshold: backlogThreshold });
    }
  }
  // Queue oldest pending age alert (latency to begin processing) -- gauges set by worker
  const oldestAge = snap.gauges['queue.oldest_pending_age_ms'];
  const oldestWarn = parseInt(process.env.QUEUE_OLDEST_AGE_WARN_MS || '0', 10);
  const oldestPage = parseInt(process.env.QUEUE_OLDEST_AGE_PAGE_MS || '0', 10);
  if (typeof oldestAge === 'number' && oldestAge > 0) {
    if (oldestPage > 0 && oldestAge >= oldestPage) {
      out.push({ key: 'queue_oldest_age', severity: 'page', ageMs: oldestAge, warnThresholdMs: oldestWarn || null, pageThresholdMs: oldestPage });
    } else if (oldestWarn > 0 && oldestAge >= oldestWarn) {
      out.push({ key: 'queue_oldest_age', severity: 'warn', ageMs: oldestAge, warnThresholdMs: oldestWarn, pageThresholdMs: oldestPage || null });
    }
  }
  // Queue max item wait time (max observed wait before processing since start)
  const maxItemWait = snap.gauges['queue.max_item_wait_ms'];
  const maxWaitWarn = parseInt(process.env.QUEUE_ITEM_WAIT_MAX_WARN_MS || '0', 10);
  const maxWaitPage = parseInt(process.env.QUEUE_ITEM_WAIT_MAX_PAGE_MS || '0', 10);
  if (typeof maxItemWait === 'number' && maxItemWait > 0) {
    if (maxWaitPage > 0 && maxItemWait >= maxWaitPage) {
      out.push({ key: 'queue_max_item_wait', severity: 'page', waitMs: maxItemWait, warnThresholdMs: maxWaitWarn || null, pageThresholdMs: maxWaitPage });
    } else if (maxWaitWarn > 0 && maxItemWait >= maxWaitWarn) {
      out.push({ key: 'queue_max_item_wait', severity: 'warn', waitMs: maxItemWait, warnThresholdMs: maxWaitWarn, pageThresholdMs: maxWaitPage || null });
    }
  }
  // Queue item wait p99 latency alert (histogram percentile based)
  const waitHist = snap.histograms && snap.histograms['queue.item_wait_ms'];
  if (waitHist && waitHist.percentiles) {
  const { p99 } = waitHist.percentiles;
    const p99Warn = parseInt(process.env.QUEUE_ITEM_WAIT_P99_WARN_MS || '0', 10);
    const p99Page = parseInt(process.env.QUEUE_ITEM_WAIT_P99_PAGE_MS || '0', 10);
    if (typeof p99 === 'number' && p99 > 0) {
      if (p99Page > 0 && p99 >= p99Page) {
        out.push({ key: 'queue_item_wait_p99', severity: 'page', p99, warnThresholdMs: p99Warn || null, pageThresholdMs: p99Page });
      } else if (p99Warn > 0 && p99 >= p99Warn) {
        out.push({ key: 'queue_item_wait_p99', severity: 'warn', p99, warnThresholdMs: p99Warn, pageThresholdMs: p99Page || null });
      }
    }
  }
  // Composite "burn" alert: high tail latency + significant backlog (signals sustained saturation)
  if (waitHist && waitHist.percentiles) {
    const { p99 } = waitHist.percentiles;
    const burnP99 = parseInt(process.env.QUEUE_BURN_P99_MS || '0', 10);
    const burnBacklog = parseInt(process.env.QUEUE_BURN_BACKLOG_DEPTH || '0', 10);
    const burnPageP99 = parseInt(process.env.QUEUE_BURN_P99_PAGE_MS || '0', 10); // optional higher page threshold
    const depth = snap.gauges.queue_pending_depth || snap.gauges['queue.pending_depth'] || 0;
    if (burnP99 > 0 && burnBacklog > 0 && typeof p99 === 'number' && p99 >= burnP99 && depth >= burnBacklog) {
      const severity = (burnPageP99 > 0 && p99 >= burnPageP99) ? 'page' : 'warn';
      out.push({ key: 'queue_latency_backlog_burn', severity, p99, backlogDepth: depth, p99ThresholdMs: burnP99, backlogThreshold: burnBacklog, pageP99ThresholdMs: burnPageP99 || null });
    }
  }
  // Sliding window latency burn-rate style alert: proportion of samples exceeding threshold within window
  if (metrics && metrics._internal_state && metrics._internal_state.queue_item_wait_samples) {
    try {
      const burnWindowMs = parseInt(process.env.QUEUE_BURN_WINDOW_MS || '0', 10); // e.g. 300000 for 5m
      const burnHighMs = parseInt(process.env.QUEUE_BURN_HIGH_MS || '0', 10); // per-sample threshold
      const burnWarnRatio = parseFloat(process.env.QUEUE_BURN_WARN_RATIO || '0'); // e.g. 0.2
      const burnPageRatio = parseFloat(process.env.QUEUE_BURN_PAGE_RATIO || '0'); // e.g. 0.4
      if (burnWindowMs > 0 && burnHighMs > 0 && (burnWarnRatio > 0 || burnPageRatio > 0)) {
        const cutoff = Date.now() - burnWindowMs;
        const samples = metrics._internal_state.queue_item_wait_samples;
        // Filter in-place minimally (do not mutate original array excessively)
        const recent = samples.filter(s => s.ts >= cutoff);
        if (recent.length) {
          const high = recent.filter(s => s.wait >= burnHighMs).length;
          const ratio = high / recent.length;
          let severity = null;
          if (burnPageRatio > 0 && ratio >= burnPageRatio) { severity = 'page'; }
          else if (burnWarnRatio > 0 && ratio >= burnWarnRatio) { severity = 'warn'; }
          if (severity) {
            out.push({ key: 'queue_latency_burn_rate', severity, windowMs: burnWindowMs, highThresholdMs: burnHighMs, sampleCount: recent.length, highSamples: high, ratio: Number(ratio.toFixed(3)), warnRatio: burnWarnRatio || null, pageRatio: burnPageRatio || null });
          }
        }
      }
    } catch(_) { /* ignore */ }
  }
  // Readiness flapping detection
  const flapTransitions = snap.gauges['readiness.flap_window_transitions'];
  const flapWindowMs = snap.gauges['readiness.flap_window_ms'];
  const flapWarn = parseInt(process.env.READINESS_FLAP_TRANSITIONS_WARN || '6', 10); // default warn if >6 transitions / window
  const flapPage = parseInt(process.env.READINESS_FLAP_TRANSITIONS_PAGE || '12', 10);
  if (typeof flapTransitions === 'number' && typeof flapWindowMs === 'number' && flapTransitions > 0) {
    if (flapTransitions >= flapPage) {
      out.push({ key: 'readiness_flapping', severity: 'page', transitions: flapTransitions, windowMs: flapWindowMs });
    } else if (flapTransitions >= flapWarn) {
      out.push({ key: 'readiness_flapping', severity: 'warn', transitions: flapTransitions, windowMs: flapWindowMs });
    }
  }
  // Record and optionally prune history
  if (out.length) { recordAlerts(out); }
  // Filter out suppressed duplicates for active set representation
  const activeFiltered = out.filter(a => !a._suppressed);
  // Active counts gauges
  if (metrics) {
    try {
      const warnCount = activeFiltered.filter(a => a.severity === 'warn').length;
      const pageCount = activeFiltered.filter(a => a.severity === 'page').length;
      metrics.setGauge('alerts.active_total', activeFiltered.length);
      metrics.setGauge('alerts.active_warn', warnCount);
      metrics.setGauge('alerts.active_page', pageCount);
    } catch(_) { /* ignore */ }
  }
  // Clear detection: any key previously active but not now (or severity changed to lower / gone)
  try {
    const activeMap = new Map();
    activeFiltered.forEach(a => { activeMap.set(a.key, a); });
    const clearedTs = Date.now();
    for (const [k, prev] of _previousActiveAlerts.entries()) {
      const cur = activeMap.get(k);
      if (!cur) {
        // Fully cleared
        if (metrics) {
          try {
            metrics.inc('alerts.cleared_total');
            metrics.inc(`alerts.${k}.cleared_total`);
            metrics.setGauge('alerts.last_cleared_ts', clearedTs);
            metrics.setGauge(`alerts.${k}.last_cleared_ts`, clearedTs);
          } catch(_) { /* ignore */ }
        }
        _previousActiveAlerts.delete(k);
      } else {
        // Still active; if severity decreased (page->warn) treat as clear of page severity
        if (prev.severity === 'page' && cur.severity !== 'page') {
          if (metrics) {
            try {
              metrics.inc('alerts.cleared_total');
              metrics.inc(`alerts.${k}.cleared_total`);
              metrics.setGauge('alerts.last_cleared_ts', clearedTs);
              metrics.setGauge(`alerts.${k}.last_cleared_ts`, clearedTs);
            } catch(_) { /* ignore */ }
          }
        }
      }
    }
    // Update previous map with current active
    _previousActiveAlerts.clear();
    activeFiltered.forEach(a => _previousActiveAlerts.set(a.key, { severity: a.severity, ts: clearedTs }));
  } catch(_) { /* ignore */ }
  res.json({ ts: now, active: out, history: alertHistory.slice(-50) });
});

// Full alert history query (with filters)
router.get('/metrics/alert-history', async (req,res) => {
  const { key, sinceMs, limit, offset, source } = req.query;
  const useDb = source === 'db' && process.env.EBAY_ALERT_HISTORY_PERSIST === '1' && sequelize;
  const lim = Math.min(parseInt(limit || '100', 10), 1000);
  const off = parseInt(offset || '0', 10) || 0;
  const nowTs = Date.now();
  if (useDb) {
    try {
      await ensureAlertHistoryTable();
      const where = [];
      const repl = {};
      if (key) { where.push('key = :key'); repl.key = key; }
      if (sinceMs) { const since = parseInt(sinceMs,10); if(!Number.isNaN(since)){ where.push('ts >= :since'); repl.since = since; } }
      const whereSql = where.length ? 'WHERE ' + where.join(' AND ') : '';
      const countSql = `SELECT COUNT(*)::int as c FROM ebay_alert_history ${whereSql}`;
      const [[countRow]] = await sequelize.query(countSql, { replacements: repl });
      const rowsSql = `SELECT id, ts, key, severity, payload FROM ebay_alert_history ${whereSql} ORDER BY ts DESC, id DESC OFFSET :off LIMIT :lim`;
      const [rows] = await sequelize.query(rowsSql, { replacements: { ...repl, off, lim } });
      return res.json({ ts: nowTs, total: countRow.c, limit: lim, offset: off, items: rows.map(r => ({ ts: r.ts, key: r.key, severity: r.severity, ...r.payload })) });
    } catch (err) {
      return res.status(500).json({ error:'db_history_query_failed', message: err.message });
    }
  }
  // In-memory fallback
  let items = alertHistory.slice();
  if (key) { items = items.filter(a => a.key === key); }
  if (sinceMs) {
    const since = parseInt(sinceMs, 10);
    if (!Number.isNaN(since)) { items = items.filter(a => a.ts >= since); }
  }
  const total = items.length;
  const page = items.slice(off, off + lim);
  res.json({ ts: nowTs, total, limit: lim, offset: off, items: page });
});

// NDJSON export (DB preferred if persistence enabled)
router.get('/metrics/alert-history.ndjson', async (req,res) => {
  res.set('Content-Type','application/x-ndjson');
  const useDb = process.env.EBAY_ALERT_HISTORY_PERSIST === '1' && sequelize;
  if (useDb) {
    try {
      await ensureAlertHistoryTable();
      const streamSql = 'SELECT ts, key, severity, payload FROM ebay_alert_history ORDER BY ts ASC, id ASC';
      const [rows] = await sequelize.query(streamSql);
      rows.forEach(r => {
        res.write(JSON.stringify({ ts: r.ts, key: r.key, severity: r.severity, ...r.payload })+'\n');
      });
      return res.end();
    } catch (err) {
      res.write(JSON.stringify({ error:'db_history_export_failed', message: err.message })+'\n');
      return res.end();
    }
  } else {
    alertHistory.forEach(r => res.write(JSON.stringify(r)+'\n'));
    return res.end();
  }
});

// Manual retention prune trigger (idempotent, best-effort)
router.post('/metrics/alert-history/retention/run', async (req,res) => {
  try {
    await pruneAlertHistory();
    return res.json({ ok: true });
  } catch(e){ return res.status(500).json({ error:'retention_failed', message: e.message }); }
});

// Test-only helper to inject a synthetic alert for persistence verification
if (process.env.NODE_ENV === 'test') {
  router.post('/metrics/_test/record-alert', express.json(), async (req,res) => {
    const { key, severity, payload } = req.body || {};
  if (!key || !severity) { return res.status(400).json({ error:'missing_fields' }); }
    const entry = [{ key, severity, ...payload }];
    // Fire internal recording (which persists asynchronously in production).
    // In tests we need the DB table to exist synchronously, so ensure it here
    // before returning so callers can immediately perform DB queries.
    recordAlerts(entry);
    try {
      await ensureAlertHistoryTable();
    } catch(_) { /* best-effort */ }
    res.json({ ok: true });
  });
}

// Prometheus-style exposition (lightweight conversion of in-memory snapshot)
router.get('/metrics/prometheus', (req,res) => {
  if(!metrics){ return res.status(503).send('# metrics_unavailable'); }
  const snap = enrichSnapshotWithInternalState(metrics.snapshot());
  const lines = [];
  function sanitize(name){ return name.replace(/[^a-zA-Z0-9:_]/g,'_'); }
  // Counters
  Object.entries(snap.counters || {}).forEach(([k,v]) => {
    const name = sanitize(k);
    lines.push(`# TYPE ${name} counter`);
    lines.push(`${name} ${v}`);
  });
  // Gauges
  Object.entries(snap.gauges || {}).forEach(([k,v]) => {
    const name = sanitize(k);
    lines.push(`# TYPE ${name} gauge`);
    lines.push(`${name} ${v}`);
  });
  // Timestamps -> gauge of age & raw timestamp
  const now = Date.now();
  Object.entries(snap.timestamps || {}).forEach(([k,ts]) => {
    const base = sanitize(k);
    lines.push(`# TYPE ${base}_timestamp gauge`);
    lines.push(`${base}_timestamp ${ts}`);
    lines.push(`# TYPE ${base}_age_ms gauge`);
    lines.push(`${base}_age_ms ${now - ts}`);
  });
  // Histograms
  Object.entries(snap.histograms || {}).forEach(([k,h]) => {
    const base = sanitize(k);
    lines.push(`# TYPE ${base} histogram`);
    let cumulative = 0;
    for (let i=0;i<h.buckets.length;i++) {
      cumulative += h.counts[i];
      const le = h.buckets[i];
      lines.push(`${base}_bucket{le="${le}"} ${cumulative}`);
    }
    // +Inf bucket (includes terminal bucket count at counts[last])
    cumulative += h.counts[h.counts.length - 1];
    lines.push(`${base}_bucket{le="+Inf"} ${cumulative}`);
    lines.push(`${base}_count ${cumulative}`);
    lines.push(`${base}_sum ${h.sum}`);
    // Percentiles as gauges for convenience
    Object.entries(h.percentiles || {}).forEach(([pk,pv]) => {
      lines.push(`# TYPE ${base}_${pk} gauge`);
      lines.push(`${base}_${pk} ${pv}`);
    });
  });
  res.set('Content-Type','text/plain; version=0.0.4');
  res.send(lines.join('\n') + '\n');
});

module.exports = router;
module.exports._internal = { pruneAlertHistory };
module.exports.__getAlertHistory = () => alertHistory.slice();
