# ListFlowHQ Database Reference: Table Creation and Seeding Order

## Table Dependency and Creation Order

This document describes the correct order for creating and seeding tables in the ListFlowHQ database (formerly eBay Sales Tool), based on Sequelize model definitions and foreign key relationships. Use this as a reference for writing or reviewing seed scripts and migrations.

---

### 1. roles
- No dependencies.

### 2. pages
- No dependencies.

### 3. application_account
- Depends on: roles (`role_id` foreign key)

### 4. ownership
- Depends on: application_account (`user_account_id` foreign key)

### 5. ownershipagreements
- Depends on: ownership (`ownership_id` foreign key)

### 6. customer
- No dependencies.

### 7. catalog
- No dependencies.

### 8. listing
- Depends on: catalog (`item_id` foreign key)

### 9. sales
- Depends on: listing (`listing_id` foreign key)
- Depends on: ownership (`ownership_id` foreign key)

### 10. orderdetails
- Depends on: sales (`sale_id` foreign key)
- Depends on: catalog (`item_id` foreign key)

### 11. role_page_access
- Depends on: roles (`role_id` foreign key)
- Depends on: pages (`page_id` foreign key)

### 12. ebayinfo
- No dependencies.

---

## Seeding Guidelines
- **Insert parent tables first** (e.g., roles before application_account, ownership before sales).
- **Truncate child tables first** when cleaning (e.g., orderdetails before sales, sales before ownership).

---

_Last updated: 2025-07-23_
