# 8. Naming Conventions (Tables, Columns, and Files)

**All table and column names must use all lowercase, snake_case, and be unquoted everywhere: schema, models, seeders, and code.**

- Table names: `historylogs`, `application_account`, `ownershipagreements`, etc.
- Column names: `user_account_id`, `first_name`, `created_at`, etc.
- Do not use camelCase, PascalCase, or mix underscores with camelCase.
- All references in code, migrations, seeders, and documentation must match the schema exactly.
- Migration and seeder filenames should use date-based prefixes and lower_snake_case (e.g., `20250711_my_seeder.js`).

**This convention supersedes all previous or legacy naming. All contributors and AI agents must follow this standard.**
# Standard Operating Procedures (SOP)

This document outlines the required Standard Operating Procedures (SOP) for development, build, and documentation practices in this project. All contributors must follow these guidelines to ensure code quality, maintainability, and robust build processes.

## 1. Code Commenting and Documentation
- All scripts, migrations, and major code changes **must** include clear, descriptive comments explaining:
  - The purpose of the file or function.
  - Any non-obvious logic or workarounds.
  - The expected order of operations, especially for build and seed scripts.
- API schemas and endpoints must be documented in `swagger.json` and kept in sync with the database schema.
- All new tables, migrations, and seed data must be documented in the appropriate `README.md` or table-specific `.md` files.

## 2. Build and Seeding Process
- Always use the official build script: `backend/scripts/run_build.bat`.
- The build process must:
  - Verify and log row counts for every table after seeding.
  - Fail if any required table is empty after seeding.
  - Log and handle all foreign key, migration, and seeding errors robustly.
- All table truncation or deletion logic must check for table existence before attempting to modify data.
- All seed scripts must insert records in the correct order to satisfy foreign key constraints.

## 3. Swagger and API Schema
- `swagger.json` must always be valid JSON and in sync with the current database schema.
- The build must be robust against invalid or empty `swagger.json` (log warnings, do not fail hard).
- All changes to API endpoints or schemas must be reflected in `swagger.json` and documented.

## 4. Table Reference and Auditing
All tables below are required, must use all-lowercase, snake_case, and be unquoted everywhere:

- `listing_default_status`: UI default filter & creation default when request omits status (e.g., 'draft'). Frontend dropdown reads this key.

All columns must use snake_case and match the schema exactly. No legacy, quoted, or camelCase names are allowed.

## 5. eBayInfo Table
- The `ebayinfo` table must exist as a physical table and be seeded with valid data.
- All references to legacy/test artifacts must be removed from code and documentation.

## 6. General Practices
- All major changes must be reviewed for adequate commenting and documentation.
- All scripts and processes that write to critical files (e.g., `swagger.json`) must use atomic writes to prevent file corruption.
- Any process that could truncate or corrupt important files must be robust and log warnings if issues are detected.

## 7. SOP Maintenance
- This `SOP.md` file is the canonical source for all standard operating procedures.
- Any updates to procedures must be reflected here and communicated to all contributors.

---

*This SOP supersedes any previous experimental or ad-hoc documentation. Remove or update references to SOPs in `EXPERIMENTAL.md` and ensure this file is kept up to date.*
