/**
 * scheduler.js
 * Simple in-process interval schedulers for eBay integration background tasks.
 * Currently supports:
 *  - Reconciliation job (Task 12) when EBAY_RECON_ENABLED=true
 *  - Integrity audit (Task 18) when EBAY_AUDIT_ENABLED=true
 */
const { runReconciliation } = require('./reconciliationJob');
let integrityAudit; try { integrityAudit = require('./integrityAuditJob'); } catch(_) { /* optional */ }

let reconTimer = null;
let auditTimer = null;
let driftRetentionTimer = null;
let alertHistoryRetentionTimer = null;
let reconRunning = false;
let auditRunning = false;

async function tickReconciliation(){
  if (reconRunning) { return; } // avoid overlap
  reconRunning = true;
  try {
    const res = await runReconciliation();
    // eslint-disable-next-line no-console
  if (!res.skipped) { console.log('[recon] run summary', res); }
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error('[recon] run failed', e.message || e);
  } finally {
    reconRunning = false;
  }
}

function startSchedulers(){
  if (process.env.NODE_ENV === 'test' && process.env.ALLOW_SCHEDULERS_UNDER_TEST !== 'true') { return; } // skip unless explicitly allowed
  if (process.env.EBAY_RECON_ENABLED === 'true') {
    const intervalMs = parseInt(process.env.EBAY_RECON_INTERVAL_MS || '300000', 10); // default 5m
    reconTimer = setInterval(tickReconciliation, intervalMs).unref();
    // Kick off a delayed initial run
    setTimeout(tickReconciliation, 10000).unref();
  }
  if (process.env.EBAY_AUDIT_ENABLED === 'true' && integrityAudit) {
    const intervalMs = parseInt(process.env.EBAY_AUDIT_INTERVAL_MS || '900000', 10); // default 15m
    auditTimer = setInterval(async () => {
      if (auditRunning) { return; }
      auditRunning = true;
      try {
        const res = await integrityAudit.runIntegrityAudit({ batchSize: 50, maxBatches: 10, verifyProjection: true });
        if (!res.skipped && res.issues.length) { console.warn('[audit] issues detected', res.issues.slice(0,3)); } // eslint-disable-line no-console
      } catch(e){ console.error('[audit] run failed', e.message || e); } // eslint-disable-line no-console
      finally { auditRunning = false; }
    }, intervalMs).unref();
    setTimeout(() => { if(!auditRunning){ auditRunning = true; integrityAudit.runIntegrityAudit({ batchSize:50, maxBatches:5 }).finally(()=>{ auditRunning=false; }); } }, 20000).unref();
  }
  // Drift retention daily
  if (process.env.EBAY_DRIFT_RETENTION_ENABLED === 'true') {
    try {
      const { runDriftRetention } = require('./driftRetentionJob');
      const intervalMs = process.env.EBAY_DRIFT_RETENTION_INTERVAL_MS ? parseInt(process.env.EBAY_DRIFT_RETENTION_INTERVAL_MS,10) : 24*60*60*1000; // 24h default
      driftRetentionTimer = setInterval(() => { runDriftRetention().catch(()=>{}); }, intervalMs).unref();
      const initialDelay = process.env.EBAY_DRIFT_RETENTION_INITIAL_DELAY_MS ? parseInt(process.env.EBAY_DRIFT_RETENTION_INITIAL_DELAY_MS,10) : 30000;
      setTimeout(()=>{ runDriftRetention().catch(()=>{}); }, initialDelay).unref();
    } catch(_) { /* ignore */ }
  }
  // Alert history retention daily (if persistence + retention days configured)
  if (process.env.EBAY_ALERT_HISTORY_RETENTION_ENABLED === 'true') {
    try {
      const { _internal: { pruneAlertHistory } } = require('../../routes/ebayMetricsAdminRoutes');
      const intervalMs = process.env.EBAY_ALERT_HISTORY_RETENTION_INTERVAL_MS ? parseInt(process.env.EBAY_ALERT_HISTORY_RETENTION_INTERVAL_MS,10) : 24*60*60*1000; // 24h default
      alertHistoryRetentionTimer = setInterval(() => { pruneAlertHistory().catch(()=>{}); }, intervalMs).unref();
      const initialDelay = process.env.EBAY_ALERT_HISTORY_RETENTION_INITIAL_DELAY_MS ? parseInt(process.env.EBAY_ALERT_HISTORY_RETENTION_INITIAL_DELAY_MS,10) : 45000;
      setTimeout(()=>{ pruneAlertHistory().catch(()=>{}); }, initialDelay).unref();
    } catch(_) { /* ignore */ }
  }
}

function stopSchedulers(){
  if (reconTimer) { clearInterval(reconTimer); reconTimer = null; }
  if (auditTimer) { clearInterval(auditTimer); auditTimer = null; }
  if (driftRetentionTimer) { clearInterval(driftRetentionTimer); driftRetentionTimer = null; }
  if (alertHistoryRetentionTimer) { clearInterval(alertHistoryRetentionTimer); alertHistoryRetentionTimer = null; }
}

module.exports = { startSchedulers, stopSchedulers };
