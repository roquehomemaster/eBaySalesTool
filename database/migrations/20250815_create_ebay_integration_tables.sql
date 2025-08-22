-- 20250815_create_ebay_integration_tables.sql
-- Purpose: Introduce foundational eBay integration tables (phase 1)
-- Tables: ebay_listing, ebay_change_queue, ebay_sync_log, ebay_policy_cache, ebay_listing_snapshot
-- Optional table ebay_auth_token omitted pending secret storage decision.

BEGIN;

-- 1. ebay_listing: current projection control & linkage
CREATE TABLE IF NOT EXISTS ebay_listing (
    ebay_listing_id        SERIAL PRIMARY KEY,
    internal_listing_id    INTEGER NOT NULL REFERENCES listing(listing_id) ON DELETE CASCADE,
    external_item_id       TEXT NULL, -- eBay assigned id once created
    external_site          TEXT NOT NULL DEFAULT 'EBAY_US',
    lifecycle_state        TEXT NOT NULL DEFAULT 'pending', -- pending|published|ended|removed
    last_publish_hash      TEXT NULL, -- projection hash last successfully published
    last_published_at      TIMESTAMPTZ NULL,
    last_known_external_revision TEXT NULL, -- eBay revision / version token if available
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at             TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    UNIQUE(internal_listing_id)
);

CREATE INDEX IF NOT EXISTS idx_ebay_listing_state ON ebay_listing(lifecycle_state);

-- 2. ebay_change_queue: intents to publish
CREATE TABLE IF NOT EXISTS ebay_change_queue (
    queue_id           SERIAL PRIMARY KEY,
    ebay_listing_id    INTEGER NOT NULL REFERENCES ebay_listing(ebay_listing_id) ON DELETE CASCADE,
    intent             TEXT NOT NULL, -- create|update|end|relist
    payload_hash       TEXT NOT NULL, -- projection/payload hash used for idempotency
    status             TEXT NOT NULL DEFAULT 'pending', -- pending|processing|complete|failed|dead
    priority           SMALLINT NOT NULL DEFAULT 5, -- lower = higher priority
    attempts           INTEGER NOT NULL DEFAULT 0,
    error_reason       TEXT NULL,
    next_earliest_run_at TIMESTAMPTZ NULL,
    last_attempt_at    TIMESTAMPTZ NULL,
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebay_change_queue_status_priority ON ebay_change_queue(status, priority, created_at);
CREATE INDEX IF NOT EXISTS idx_ebay_change_queue_listing ON ebay_change_queue(ebay_listing_id);

-- 3. ebay_sync_log: every publish/sync attempt (immutable)
CREATE TABLE IF NOT EXISTS ebay_sync_log (
    sync_log_id        SERIAL PRIMARY KEY,
    ebay_listing_id    INTEGER NOT NULL REFERENCES ebay_listing(ebay_listing_id) ON DELETE CASCADE,
    operation          TEXT NOT NULL, -- publish|reconcile|end|relist|policy_refresh etc
    request_payload    JSONB NULL,
    response_code      INTEGER NULL,
    response_body      JSONB NULL,
    result             TEXT NOT NULL, -- success|failure
    duration_ms        INTEGER NULL,
    attempt_hash       TEXT NULL, -- hash of request payload for grouping
    created_at         TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebay_sync_log_listing_created ON ebay_sync_log(ebay_listing_id, created_at DESC);
CREATE INDEX IF NOT EXISTS idx_ebay_sync_log_operation_created ON ebay_sync_log(operation, created_at DESC);

-- 4. ebay_policy_cache: cached reference data
CREATE TABLE IF NOT EXISTS ebay_policy_cache (
    policy_cache_id    SERIAL PRIMARY KEY,
    policy_type        TEXT NOT NULL, -- shipping|return|fulfillment|payment|category
    external_id        TEXT NOT NULL,
    name               TEXT NULL,
    raw_json           JSONB NOT NULL,
    fetched_at         TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    expires_at         TIMESTAMPTZ NULL,
    content_hash       TEXT NOT NULL
);

CREATE UNIQUE INDEX IF NOT EXISTS uniq_policy_type_external ON ebay_policy_cache(policy_type, external_id);
CREATE INDEX IF NOT EXISTS idx_policy_type ON ebay_policy_cache(policy_type);

-- 5. ebay_listing_snapshot: immutable historical record
CREATE TABLE IF NOT EXISTS ebay_listing_snapshot (
    snapshot_id            SERIAL PRIMARY KEY,
    ebay_listing_id        INTEGER NOT NULL REFERENCES ebay_listing(ebay_listing_id) ON DELETE CASCADE,
    snapshot_hash          TEXT NOT NULL,
    snapshot_json          JSONB NOT NULL,
    diff_from_prev_json    JSONB NOT NULL DEFAULT '{}'::JSONB,
    source_event           TEXT NOT NULL, -- publish_success|external_drift|manual|policy_dependency_change|lifecycle_change
    dedup_of_snapshot_id   INTEGER NULL REFERENCES ebay_listing_snapshot(snapshot_id) ON DELETE SET NULL,
    created_at             TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX IF NOT EXISTS idx_ebay_listing_snapshot_listing_created ON ebay_listing_snapshot(ebay_listing_id, created_at DESC);
CREATE UNIQUE INDEX IF NOT EXISTS uniq_ebay_listing_snapshot_hash ON ebay_listing_snapshot(snapshot_hash);

-- Trigger updates for updated_at columns where needed
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER ebay_listing_set_updated_at
BEFORE UPDATE ON ebay_listing
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER ebay_change_queue_set_updated_at
BEFORE UPDATE ON ebay_change_queue
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

COMMIT;
