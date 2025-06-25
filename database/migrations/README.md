# Migrations Directory

This directory contains SQL scripts for initializing and migrating the database schema. The scripts are executed in alphabetical order by PostgreSQL during container startup.

## Guidelines for Scripts
1. **Naming Convention**:
   - Use a clear and consistent naming convention, such as `01_init.sql`, `02_add_table.sql`, etc., to ensure the correct execution order.

2. **Avoid Duplicates**:
   - Ensure there are no duplicate or conflicting scripts. Each script should have a unique purpose.

3. **Testing**:
   - Test each script independently before adding it to this directory.

## Current Scripts
- `01a_create_owners_table.sql`: Creates the owners table.
- `01_init.sql`: Initial database setup.
- `02_sampleData.sql`: Inserts sample data.
- `03_fix_ownership_enum.sql`: Fixes ownership enum values.
- `04_auth_roles_permissions.sql`: Adds roles and permissions.
- `04_auth_roles_permissions_seed.sql`: Seeds roles and permissions data.
- `05_add_user_security_fields.sql`: Adds security fields to the user table.
- `06_create_userlog_table.sql`: Creates the user log table.
- `07_create_ownerships_table.sql`: Creates the ownerships table.
- `08_create_catalog_table.sql`: Creates the Catalog table (formerly Items).
- `09_create_owners_table.sql`: Creates the owners table (duplicate, consider removing).
- `10_add_address_to_owners.sql`: Adds address fields to the owners table.
- `11_create_owners_table.sql`: Creates the owners table (duplicate, consider removing).

## Data Model Note
- The `Catalog` table is the master list of all products ever tracked, regardless of eBay listing status. The `SellingItem` table tracks all eBay listings, past or present, and references products in the Catalog.

## Cleanup Required
- Review and remove duplicate scripts, such as `09_create_owners_table.sql` and `11_create_owners_table.sql`.

## Notes
- Ensure the `db_data` volume is removed before rebuilding the container to apply changes.
