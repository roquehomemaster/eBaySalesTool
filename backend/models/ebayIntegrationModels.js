/**
 * ebayIntegrationModels.js
 * Consolidated Sequelize model definitions for eBay integration tables.
 * Keep business logic out; pure schema + associations only.
 */
const { DataTypes } = require('sequelize');
const { sequelize } = require('../src/utils/database');

// ebay_listing
const EbayListing = sequelize.define('ebay_listing', {
  ebay_listing_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  internal_listing_id: { type: DataTypes.INTEGER, allowNull: false },
  external_item_id: { type: DataTypes.TEXT },
  external_site: { type: DataTypes.TEXT, defaultValue: 'EBAY_US' },
  lifecycle_state: { type: DataTypes.TEXT, defaultValue: 'pending' },
  last_publish_hash: { type: DataTypes.TEXT },
  last_published_at: { type: DataTypes.DATE },
  last_known_external_revision: { type: DataTypes.TEXT }
}, {
  tableName: 'ebay_listing',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ebay_change_queue
const EbayChangeQueue = sequelize.define('ebay_change_queue', {
  queue_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ebay_listing_id: { type: DataTypes.INTEGER, allowNull: false },
  intent: { type: DataTypes.TEXT, allowNull: false },
  payload_hash: { type: DataTypes.TEXT, allowNull: false },
  status: { type: DataTypes.TEXT, allowNull: false, defaultValue: 'pending' },
  priority: { type: DataTypes.SMALLINT, allowNull: false, defaultValue: 5 },
  attempts: { type: DataTypes.INTEGER, allowNull: false, defaultValue: 0 },
  error_reason: { type: DataTypes.TEXT },
  next_earliest_run_at: { type: DataTypes.DATE },
  last_attempt_at: { type: DataTypes.DATE }
}, {
  tableName: 'ebay_change_queue',
  timestamps: true,
  createdAt: 'created_at',
  updatedAt: 'updated_at'
});

// ebay_sync_log (immutable; no updated_at)
const EbaySyncLog = sequelize.define('ebay_sync_log', {
  sync_log_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ebay_listing_id: { type: DataTypes.INTEGER, allowNull: false },
  operation: { type: DataTypes.TEXT, allowNull: false },
  request_payload: { type: DataTypes.JSONB },
  response_code: { type: DataTypes.INTEGER },
  response_body: { type: DataTypes.JSONB },
  result: { type: DataTypes.TEXT, allowNull: false },
  duration_ms: { type: DataTypes.INTEGER },
  attempt_hash: { type: DataTypes.TEXT },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ebay_sync_log',
  timestamps: false
});

// ebay_policy_cache (immutable updates; no updated_at)
const EbayPolicyCache = sequelize.define('ebay_policy_cache', {
  policy_cache_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  policy_type: { type: DataTypes.TEXT, allowNull: false },
  external_id: { type: DataTypes.TEXT, allowNull: false },
  name: { type: DataTypes.TEXT },
  raw_json: { type: DataTypes.JSONB, allowNull: false },
  fetched_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW },
  expires_at: { type: DataTypes.DATE },
  content_hash: { type: DataTypes.TEXT, allowNull: false }
}, {
  tableName: 'ebay_policy_cache',
  timestamps: false
});

// ebay_listing_snapshot (immutable; no updated_at)
const EbayListingSnapshot = sequelize.define('ebay_listing_snapshot', {
  snapshot_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ebay_listing_id: { type: DataTypes.INTEGER, allowNull: false },
  snapshot_hash: { type: DataTypes.TEXT, allowNull: false },
  snapshot_json: { type: DataTypes.JSONB, allowNull: false },
  diff_from_prev_json: { type: DataTypes.JSONB, allowNull: false, defaultValue: {} },
  source_event: { type: DataTypes.TEXT, allowNull: false },
  dedup_of_snapshot_id: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ebay_listing_snapshot',
  timestamps: false
});

// ebay_failed_event (dead-letter queue for irrecoverable publish/update attempts)
const EbayFailedEvent = sequelize.define('ebay_failed_event', {
  failed_event_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ebay_listing_id: { type: DataTypes.INTEGER },
  intent: { type: DataTypes.TEXT },
  payload_hash: { type: DataTypes.TEXT },
  request_payload: { type: DataTypes.JSONB },
  last_error: { type: DataTypes.TEXT },
  attempts: { type: DataTypes.INTEGER },
  last_attempt_at: { type: DataTypes.DATE },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ebay_failed_event',
  timestamps: false
});

// ebay_transaction_log: fine-grained request/response history (immutable)
const EbayTransactionLog = sequelize.define('ebay_transaction_log', {
  txn_id: { type: DataTypes.BIGINT, autoIncrement: true, primaryKey: true },
  ebay_listing_id: { type: DataTypes.INTEGER },
  correlation_id: { type: DataTypes.TEXT }, // tie multiple attempts / related calls
  direction: { type: DataTypes.ENUM('outbound','inbound') },
  channel: { type: DataTypes.TEXT }, // adapter|policy|recon|audit
  operation: { type: DataTypes.TEXT },
  request_url: { type: DataTypes.TEXT },
  request_method: { type: DataTypes.TEXT },
  request_headers: { type: DataTypes.JSONB },
  request_body: { type: DataTypes.JSONB },
  response_code: { type: DataTypes.INTEGER },
  response_headers: { type: DataTypes.JSONB },
  response_body: { type: DataTypes.JSONB },
  status: { type: DataTypes.TEXT }, // success|failure|skipped
  error_classification: { type: DataTypes.TEXT },
  latency_ms: { type: DataTypes.INTEGER },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ebay_transaction_log',
  timestamps: false
});

// ebay_drift_event: records reconciliation drift classification events
const EbayDriftEvent = sequelize.define('ebay_drift_event', {
  drift_event_id: { type: DataTypes.INTEGER, autoIncrement: true, primaryKey: true },
  ebay_listing_id: { type: DataTypes.INTEGER, allowNull: false },
  classification: { type: DataTypes.TEXT, allowNull: false }, // internal_only|external_only|both_changed|snapshot_stale
  local_hash: { type: DataTypes.TEXT },
  remote_hash: { type: DataTypes.TEXT },
  snapshot_hash: { type: DataTypes.TEXT },
  details_json: { type: DataTypes.JSONB },
  created_at: { type: DataTypes.DATE, defaultValue: DataTypes.NOW }
}, {
  tableName: 'ebay_drift_event',
  timestamps: false
});

// Basic associations (avoid circular requires by not importing Listing model here)
EbayListing.hasMany(EbayChangeQueue, { foreignKey: 'ebay_listing_id' });
EbayListing.hasMany(EbaySyncLog, { foreignKey: 'ebay_listing_id' });
EbayListing.hasMany(EbayListingSnapshot, { foreignKey: 'ebay_listing_id' });
EbayChangeQueue.belongsTo(EbayListing, { foreignKey: 'ebay_listing_id' });
EbaySyncLog.belongsTo(EbayListing, { foreignKey: 'ebay_listing_id' });
EbayListingSnapshot.belongsTo(EbayListing, { foreignKey: 'ebay_listing_id' });
EbayFailedEvent.belongsTo(EbayListing, { foreignKey: 'ebay_listing_id' });
EbayDriftEvent.belongsTo(EbayListing, { foreignKey: 'ebay_listing_id' });

module.exports = {
  EbayListing,
  EbayChangeQueue,
  EbaySyncLog,
  EbayPolicyCache,
  EbayListingSnapshot,
  EbayTransactionLog,
  EbayFailedEvent,
  EbayDriftEvent
};
