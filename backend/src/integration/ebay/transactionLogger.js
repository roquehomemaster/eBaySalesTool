const { EbayTransactionLog } = require('../../../models/ebayIntegrationModels');

async function logTxn(rec){
  if(!EbayTransactionLog) { return; }
  try { await EbayTransactionLog.create(rec); } catch(_) { /* ignore */ }
}

module.exports = { logTxn };
