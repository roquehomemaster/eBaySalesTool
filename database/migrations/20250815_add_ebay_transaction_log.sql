-- 20250815_add_ebay_transaction_log.sql
-- Detailed transaction history for eBay integration

BEGIN;

CREATE TABLE IF NOT EXISTS ebay_transaction_log (
  txn_id              BIGSERIAL PRIMARY KEY,
  ebay_listing_id     INTEGER NULL REFERENCES ebay_listing(ebay_listing_id) ON DELETE SET NULL,
  correlation_id      TEXT NULL,
  direction           TEXT NOT NULL, -- outbound|inbound
  channel             TEXT NOT NULL, -- adapter|policy|recon|audit
  operation           TEXT NOT NULL, -- create|update|policy_refresh|reconcile|audit_scan etc
  request_url         TEXT NULL,
  request_method      TEXT NULL,
  request_headers     JSONB NULL,
  request_body        JSONB NULL,
  response_code       INTEGER NULL,
  response_headers    JSONB NULL,
  response_body       JSONB NULL,
  status              TEXT NOT NULL, -- success|failure|skipped
  error_classification TEXT NULL,
  latency_ms          INTEGER NULL,
  created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebay_txn_listing_created ON ebay_transaction_log(ebay_listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebay_txn_channel_created ON ebay_transaction_log(channel, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebay_txn_operation_created ON ebay_transaction_log(operation, created_at DESC);

COMMIT;
