-- 03_create_eBayInfo.sql
-- Purpose: Create the ebayinfo table to store eBay account and performance data for reporting, auditing, and offline access.
-- This table is updated via sync jobs or API calls and is referenced by the eBayInfo API endpoints.

-- Drop legacy CamelCase table if it exists to enforce SOP (all lowercase snake_case)
DROP TABLE IF EXISTS "eBayInfo" CASCADE;

CREATE TABLE IF NOT EXISTS ebayinfo (
    id SERIAL PRIMARY KEY,
    account_id VARCHAR(255) NOT NULL,
    store_name VARCHAR(255),
    feedback_score INTEGER,
    positive_feedback_percent NUMERIC(5,2),
    selling_limits JSONB,
    seller_level VARCHAR(50),
    defect_rate NUMERIC(5,2),
    late_shipment_rate NUMERIC(5,2),
    transaction_defect_rate NUMERIC(5,2),
    policy_compliance_status VARCHAR(50),
    api_status VARCHAR(50),
    last_sync TIMESTAMP,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Index for quick lookup by account_id
CREATE INDEX IF NOT EXISTS idx_ebayinfo_account_id ON ebayinfo(account_id);
