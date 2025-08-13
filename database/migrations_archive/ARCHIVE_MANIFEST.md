Planned archived migrations (moved from active set to ensure deterministic schema rebuild):

Legacy / superseded by 01_init.sql:
- 01a_create_owners_table.sql
- 03_create_customer_table.sql
- 03_create_eBayInfo.sql
- 03_fix_ownership_enum.sql
- 04_appconfig_pagesize.sql
- 04_auth_roles_permissions_seed.sql (seed logic consolidated elsewhere / upcoming)
- 07_create_ownerships_table.sql
- 08_create_items_table.sql
- 10_add_address_to_owners.sql
- 11_create_owners_table.sql
- 12_add_listing_ownership_and_history.sql (historylogs replaces legacy history handling)
- 99_drop_catalogs_table.sql (drop logic embedded in 01_init.sql)

Retained incremental (still active):
- 20250812_add_historylogs_audit_columns.sql (adds columns with IF NOT EXISTS)
- (Deprecated no-op) 20250813_add_listing_status_graph.sql

Next step after review: physically move listed legacy files into migrations_archive/legacy so they are not mounted into Postgres init path.
