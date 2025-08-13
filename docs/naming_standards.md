# Naming Standards

This document defines the canonical naming conventions for the eBay Sales Tool backend.
All contributors MUST follow these rules. Deviations require explicit approval and an
update to this file.

## 1. General Principles
- Use `snake_case` for all database identifiers (tables, columns, indexes, constraints).
- Use all-lowercase unquoted identifiers in SQL so Postgres does not fold case unexpectedly.
- Use `camelCase` for in-code (JavaScript) variable names, function names, and object keys unless the
  key directly mirrors a database column (then keep snake_case to allow shallow serialization).
- Prefer singular table names EXCEPT where an existing plural has already shipped; new tables must be singular.
- Audit entity names (values stored in `historylogs.entity`) MUST be singular, lowercase snake_case.

## 2. Files & Folders
- JavaScript/Node source files: `lowerCamelCase` or descriptive kebab for scripts (`seedDatabase.js`).
- Model files: `<name>Model.js` (e.g., `catalogModel.js`) mapping to a singular snake_case table.
- Controller files: `<name>Controller.js` (e.g., `listingController.js`).
- Utility modules: concise, descriptive (e.g., `auditLogger.js`).
- Constants: placed in `src/constants/`, file names descriptive (e.g., `entities.js`).

## 3. Database Tables (Current Canonical Set)
| Logical Entity          | Table Name           | Primary Key Column             | Audit Entity Constant            |
|-------------------------|----------------------|--------------------------------|----------------------------------|
| Listing                 | `listing`            | `listing_id`                   | `listing`                        |
| Catalog Item            | `catalog`            | `item_id`                      | `catalog`                        |
| Customer                | `customer`           | `customer_id`                  | `customer`                       |
| Ownership               | `ownership`          | `ownership_id`                 | `ownership`                      |
| Sale                    | `sales`              | `sale_id`                      | `sales` (legacy plural table)    |
| App Config              | `appconfig`          | `config_key` (PK)              | `appconfig`                      |
| Shipping Log            | `shippinglog`        | `shippinglog_id`               | `shippinglog`                    |
| Financial Tracking      | `financialtracking`  | `financialtracking_id`         | `financialtracking`              |
| Communication Logs      | `communicationlogs`  | `communicationlog_id`          | `communicationlogs` (plural)     |
| Return History          | `returnhistory`      | `returnhistory_id`             | `returnhistory`                  |
| Performance Metrics     | `performancemetrics` | `id`                           | `performancemetrics`             |
| Order Details           | `orderdetails`       | `orderdetails_id`              | `orderdetails`                   |
| DB Configuration        | `database_configuration` | `id`                        | `database_configuration`         |

Notes:
- Some legacy plural table names (`sales`, `communicationlogs`, `performancemetrics`) remain; they keep their existing form for stability. Audit entity values match table names to avoid confusion.
- Future refactors can introduce views or synonyms if consolidation is desired; update the constants and this table accordingly.

## 4. Audit Logging
- All CRUD controllers MUST use the `ENTITY` constants exported from `src/constants/entities.js` to pass the `entity` value to `auditLogger`.
- Actions stored: `create`, `update`, `delete` only (no bulk pseudo-actions yet).
- `changed_fields` holds an array of column names modified in an update (exclude `created_at`, `updated_at`).
- `before_data` & `after_data` store shallow snapshots (JSONB). Null indicates absence (create/delete sides).
- `user_account_id` MAY be null until authentication is fully implemented.

## 5. Column Naming
- Foreign keys: `<referenced_table>_id` (e.g., `listing_id`).
- Timestamps: `created_at`, `updated_at` (managed by Sequelize when `timestamps: true`).
- Boolean flags use `is_` or `has_` prefixes (future additions).

## 6. Index Naming
- Pattern: `<table>_<column(s)>_<purpose>_idx` (e.g., `historylogs_entity_entity_id_created_at_idx`).
- GIN / specialized indexes append type (e.g., `historylogs_changed_fields_gin_idx`).

## 7. Testing Conventions
- Test filenames: `*.test.js` under `backend/tests/`.
- Use singular entity naming in test descriptions: `Customer Audit Logging`.
- When referencing audit entities in assertions, rely on constants if imported (preferred for new tests).

## 7.1 Sample Audit Invocation
```js
const { ENTITY } = require('../constants/entities');
await audit.logUpdate(ENTITY.CATALOG, catalog.item_id, beforeObj, afterObj, req.user_account_id);
```

## 8. Migration Strategy (Pre-Release)
- Canonical schema changes go directly into `database/migrations/01_init.sql`.
- Transitional compatibility helpers (ALTERs) live only in test setup until all environments are rebuilt.

## 9. Deviations & Legacy
Document any intentional deviations here:
- `sales` table plural retained (legacy). Audit entity also `sales` to avoid mismatch.
- `communicationlogs` plural retained. Same handling as `sales`.

## 10. Enforcement
- Code review MUST verify: use of `ENTITY` constants, no hard-coded entity strings except inside `entities.js`.
- Lint rule (future): forbid string literals matching known entity names outside constants file.

---
Update this document alongside any schema or naming changes. The audit history assumes these values remain stable.
