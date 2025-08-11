# Migrations Directory

This directory contains SQL scripts for initializing and migrating the database schema. The scripts are executed in alphabetical order by PostgreSQL during container startup.

## Guidelines for Scripts
1. **Naming Convention**:
   - Use a clear and consistent naming convention, such as `01_init.sql`, `02_add_table.sql`, etc., to ensure the correct execution order.

2. **Avoid Duplicates**:
   - Ensure there are no duplicate or conflicting scripts. Each script should have a unique purpose.

3. **Testing**:
   - Test each script independently before adding it to this directory.

## Current Scripts (canonical only)
- `01_init.sql`: Initial database setup (SOP-compliant, snake_case).
- `03_create_customer_table.sql`: Customer table.
- `03_create_eBayInfo.sql`: ebayinfo table (drops legacy "eBayInfo").
- `03_fix_ownership_enum.sql`: Fixes ownership enum values.
- `04_auth_roles_permissions_seed.sql`: Seeds roles and permissions data.
- `07_create_ownerships_table.sql`: Creates the ownerships table.
- `08_create_items_table.sql` or `08_create_catalog_table.sql`: Creates the catalog table.
- `99_drop_catalogs_table.sql`: Drops legacy Catalogs table if present.


## Data Model Note

The `Catalog` table is the master list of all products ever tracked, regardless of eBay listing status. The `Listing` table tracks all eBay listings, past or present, and references products in the Catalog.

The `HistoryLogs` table records all changes to tracked entities (such as Listing, Customer, etc.) for auditing purposes. Each log entry includes:
- The entity name (e.g., 'Listing')
- The entity's ID
- The action performed (e.g., create, update, delete)
- Details of the change
- The user (by Ownership ID) who made the change
- The timestamp of the change

This ensures all changes are auditable and attributable to a specific user.

## Cleanup Status
- Legacy init/seed scripts removed from this folder: `init.sql`, `sampleData.sql`, `02_sampleData.sql`.
- Duplicates and non-canonical files should not be placed here. If additional cleanup is needed, move files to `database/legacy/` or delete them.

## Notes
- Ensure the `db_data` volume is removed before rebuilding the container to apply changes on a fresh init.
- Only SQL files present in this folder at first container startup are auto-run by Postgres (alphabetical order).
- Do NOT place seed data here. Use `database/seeds/` and application seeders.
