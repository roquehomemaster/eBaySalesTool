-- 20250812_add_historylogs_audit_columns.sql
-- Purpose: Extend historylogs table to support structured per-change auditing
-- Adds: changed_fields (TEXT[]), before_data (JSONB), after_data (JSONB)
-- Indexes: (entity, entity_id, created_at desc) and GIN on changed_fields for filtering
-- Safe: Uses IF NOT EXISTS to allow re-run without error

ALTER TABLE historylogs
    ADD COLUMN IF NOT EXISTS changed_fields TEXT[] NULL,
    ADD COLUMN IF NOT EXISTS before_data JSONB NULL,
    ADD COLUMN IF NOT EXISTS after_data JSONB NULL;

-- Composite btree index for fast entity/id timeline queries
CREATE INDEX IF NOT EXISTS historylogs_entity_entity_id_created_at_idx
    ON historylogs (entity, entity_id, created_at DESC);

-- GIN index to allow queries like: field X changed recently.
CREATE INDEX IF NOT EXISTS historylogs_changed_fields_gin_idx
    ON historylogs USING GIN (changed_fields);

-- NOTE: before_data / after_data JSONB are intentionally NOT GIN indexed initially to
-- avoid storage bloat. Add targeted functional indexes later if specific keys need acceleration.
