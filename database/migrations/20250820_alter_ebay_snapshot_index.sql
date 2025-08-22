-- 20250820_alter_ebay_snapshot_index.sql
-- Purpose: Align ebay_listing_snapshot indexing with dedup design.
-- Rationale:
--   Original migration added UNIQUE index on snapshot_hash, but snapshotService intentionally
--   creates a new row for duplicate hashes (dedup_of_snapshot_id pointing at prior snapshot)
--   to preserve an event trail (source_event + created_at) even when projection is unchanged.
--   The unique constraint would block inserting subsequent duplicate snapshots.
--   Additionally, two different listings can legitimately produce identical projection hashes
--   (e.g., identical content) and should not conflict.
-- Change:
--   Drop UNIQUE index on snapshot_hash if present, replace with a NON-UNIQUE btree index for lookup.
--   (No composite uniqueness added so that per-listing duplicate hashes remain allowed.)
-- Safety:
--   IF EXISTS guards ensure idempotent execution across environments.

BEGIN;

-- Drop the old unique index if it exists.
DROP INDEX IF EXISTS uniq_ebay_listing_snapshot_hash;

-- Create a non-unique index to retain lookup performance by hash.
CREATE INDEX IF NOT EXISTS idx_ebay_listing_snapshot_hash ON ebay_listing_snapshot(snapshot_hash);

-- (Optional) Additional supporting index for frequent latest-snapshot retrievals by listing already exists:
--   idx_ebay_listing_snapshot_listing_created (listing_id, created_at DESC)
--   so no further action needed here.

COMMIT;
