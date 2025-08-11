-- 03_seed_eBayInfo.sql
-- Purpose: Seed the ebayinfo table with a sample eBay account and performance data for development/testing.
-- In production, this table should be updated via sync jobs or API calls.

INSERT INTO ebayinfo (
    account_id, store_name, feedback_score, positive_feedback_percent, selling_limits, seller_level, defect_rate, late_shipment_rate, transaction_defect_rate, policy_compliance_status, api_status, last_sync
) VALUES (
    'test-account-001',
    'Sample Store',
    1000,
    99.8,
    '{"monthlyLimit": 10000, "remaining": 8000}',
    'Top Rated',
    0.5,
    1.2,
    0.3,
    'Compliant',
    'Healthy',
    NOW()
)
ON CONFLICT DO NOTHING;
