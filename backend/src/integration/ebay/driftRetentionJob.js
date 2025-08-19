/**
 * driftRetentionJob.js
 * Deletes old ebay_drift_event rows beyond retention window.
 * Env:
 *   EBAY_DRIFT_RETENTION_DAYS (default 30)
 */
const { EbayDriftEvent } = require('../../../models/ebayIntegrationModels');
const { Op } = require('sequelize');
let metrics; try { metrics = require('./metrics'); } catch(_) { /* optional */ }

async function runDriftRetention({ now = Date.now(), retentionDays = process.env.EBAY_DRIFT_RETENTION_DAYS ? parseInt(process.env.EBAY_DRIFT_RETENTION_DAYS,10) : 30 } = {}){
  if (!EbayDriftEvent) { return { skipped:true, reason:'model_unavailable' }; }
  if (!retentionDays || retentionDays <= 0){ return { skipped:true, reason:'invalid_retention' }; }
  const cutoff = new Date(now - retentionDays*24*60*60*1000);
  // NOTE: Sequelize v6 uses Op.lt; using raw where with literal for simplicity to avoid importing Op again.
  try {
    const deleted = await EbayDriftEvent.destroy({ where: { created_at: { [Op.lt]: cutoff } } });
    if (metrics && deleted){ metrics.inc('drift.retention_deleted', deleted); }
    return { skipped:false, deleted, cutoff: cutoff.toISOString(), retentionDays };
  } catch(e){
    return { skipped:true, reason:'destroy_failed', error: e.message };
  }
}

if(require.main === module){
  runDriftRetention().then(r=>{ console.log('[driftRetention]', r); process.exit(0); }) // eslint-disable-line no-console
    .catch(e=>{ console.error('[driftRetention] failed', e); process.exit(1); }); // eslint-disable-line no-console
}

module.exports = { runDriftRetention };
