# ListFlowHQ - Application Overview (formerly eBay Sales Tool)

## **Overview**
ListFlowHQ is a comprehensive web-based application designed to assist businesses in managing and tracking multi-channel (initially eBay) sales. It provides features for item management, owner management, sales tracking, and payout calculations, all integrated into a user-friendly interface.

---

## **Application Structure**
The application is divided into three main components (Internal Domain + Planned External Integration Layer):

### **1. Backend**
- **Framework**: Node.js (Express) with Sequelize (PostgreSQL).
- **Purpose**: Handles internal API requests, business logic, workflow validation, and data persistence.
- **Key Internal Features**:
  - CRUD operations for catalog, listings, owners, sales (sales module evolving).
  - Configurable listing status graph stored in AppConfig.
  - Separation between internal listing workflow and (planned) eBay integration.
  - Seed & migration system enabling reproducible environments.
- **Key Directories**:
  - `backend/models/`: Sequelize model definitions.
  - `backend/migrations/` & `database/migrations/`: Schema evolution (legacy + current).
  - `backend/src/controllers/`: Request handling & validation.
  - `backend/src/routes/`: Express route definitions.
  - `backend/src/utils/`: Shared utilities (instrumentation, db, etc.).
  - `backend/scripts/`: Build/test/seed/generation scripts (only use sanctioned scripts for builds & swagger generation).

### **2. Frontend**
- **Framework**: React.
- **Purpose**: Presents admin & operational interfaces (listing management, configuration, URL catalog, future eBay monitoring dashboards).
- **Key Features**:
  - List + detail views with tabbed sub-navigation.
  - Persisted table state (filters/sorts) per list.
  - Admin subtabs (App Config, Application URLs) with inline editing and dynamic graph visualization (planned).
  - Extensible components enabling future eBay snapshot & queue monitoring UIs.
- **Structure**:
  - `frontend/src/components/`: Shared UI components.
  - `frontend/src/pages/` or `routes/`: Page-level components (varies by repo structure).
  - `frontend/src/hooks/`: Custom React hooks (e.g., persisted table state).
  - `frontend/src/services/`: API abstractions.

### **3. Database (Internal)**
- **Type**: PostgreSQL.
- **Purpose**: Stores internal domain entities (catalog, listing, ownership, configuration, history, etc.).
- **Features**:
  - Branching listing status workflow (configurable graph) with validation.
  - Distinct sku vs barcode separation (recent refactor).
  - Listing fields include `serial_number`, `manufacture_date` (recent refactor) and status default from AppConfig.
- **Assets**:
  - `database/migrations/` & `backend/migrations/`: Evolution scripts (some legacy duplication scheduled for consolidation).
  - `backend/scripts/seedDatabase.js`: Controlled seed process (avoid Docker cache issues via seed versioning marker).

### **4. eBay Integration Layer (Planned / Isolated)**
- Implemented via separate `ebay_*` tables (see dedicated documents below) ensuring domain separation.
- Provides projection, queue, publisher, reconciliation, and snapshot subsystems.
- No direct UI coupling until monitoring panels are added.

---
## **eBay Integration Documentation Links**
- See `docs/ebay_integration_architecture.md` for architectural overview, tables, flows.
- See `docs/ebay_snapshot_strategy.md` for immutable snapshot design.

---

---

## **Core Features**

### **1. Item Management**
- Add, edit, and delete items.
- View item details in a tabbed interface.
- Search and sort items by various fields.

### **2. Owner Management**
- Add and edit owner information.
- Define general negotiated terms for each owner.
- Link items to owners and override terms at the item level.

### **3. Sales Tracking**
- Record and track sales data.
- Generate reports for sales trends and performance.

### **4. Payout Calculation**
- Use item-specific terms (or inherited owner terms) to calculate payouts.
- Generate payout reports for owners.

---

## **Listing Item Clarification (Internal Domain)**

### **Definition**
A **Listing Item** is the top-level entity representing an item being listed for sale on eBay. It includes information from the **Item Master**, the **Listing Item Owner**, and its associated states.

### **States**
1. **Sales Active State**:
   - **Pending**: Default state when the listing item is created. It remains in this state until the item is listed on eBay.
   - **Active**: The state when the item is listed on eBay.
   - **Complete**: The state when the payout is confirmed.

2. **Item State**:
   - **New**: Default state when the listing item is created.
   - **Pending**: The state when the item pricing is set.
   - **Listed**: The state when the item is listed on eBay.
   - **Sold**: The state when the item is sold on eBay.
   - **Ready for Payout**: The state when the item meets warranty terms (configurable by owner default or item override).
   - **Paid**: The state when the payout is sent.
   - **Complete**: The state 30 days (configurable) after the payout is sent, marking the item as complete.

### **Workflow**
1. **Sales Active State Workflow**:
   - **Pending** → **Active** → **Complete**.
2. **Item State Workflow**:
   - **New** → **Pending** → **Listed** → **Sold** → **Ready for Payout** → **Paid** → **Complete**.

### **Branching Listing Status Workflow (Current)**
A single `listing.status` field now follows a configurable branching state machine stored in `appconfig` under `listing_status_graph` (authoritative) or linear fallback `listing_status_workflow`.

Core default graph (keys = status, values = allowed next statuses):

```
draft -> ready_to_list
ready_to_list -> listed
listed -> sold | listing_ended | listing_removed
listing_ended -> relist | listing_removed
relist -> ready_to_list
sold -> shipped
shipped -> in_warranty | ready_for_payment
in_warranty -> ready_for_payment
ready_for_payment -> complete
listing_removed -> (terminal)
complete -> (terminal)
```

Status meanings (selected):
- draft: Created, data gathering.
- ready_to_list: Fully specified and ready to publish.
- listed: Live on marketplace (legacy alias: active -> normalizes to listed).
- listing_ended: Manually or time-ended; can relist or remove.
- listing_removed: Removed/withdrawn; terminal unless administratively reactivated by editing workflow.
- relist: Transitional node to re-enter readiness (returns to ready_to_list).
- sold: Buyer committed / sale recorded.
- shipped: Item shipped; warranty/return timer may begin.
- in_warranty: Within warranty/return/hold window.
- ready_for_payment: Warranty complete; payout eligible.
- complete: Payout processed and lifecycle closed.

Transition validation: updates to `status` are only accepted if the target is in the allowed next array for the current status (after normalizing legacy 'active' to 'listed'). Same-to-same transitions are no-ops and allowed.

Configuration precedence (highest to lowest):
1. `listing_status_graph` (JSON object) – authoritative branching model.
2. `listing_status_workflow` (JSON array) – linear fallback converted to chain.
3. Built-in default graph (above) – used when neither config key is set.

Status default is configurable via AppConfig key `listing_default_status` (falls back to `draft`).

Admin updates: POST `/api/listings/status/workflow` with `{ graph: { state:[next,...] } }` to atomically replace the graph. GET `/api/listings/status/workflow` returns the active graph (materialized, including implicitly referenced nodes).

Legacy data handling: a migration backfills any pre-existing `active` statuses to `listed`. Incoming API updates specifying `active` are normalized to `listed`.

---

## **Template Usage and History Tracking**

### Template Usage
The application supports dynamic HTML templates for item listings. These templates use placeholders (e.g., `{{productName}}`, `{{description}}`) that are populated with data from the database. The templates are stored in the `backend/src/templates/` directory.

### Multiple Template Selection
- Users can select from multiple templates for item listings.
- A new field has been added to the item listing to specify the selected template.

### History Record
- The rendered HTML is saved in the history record when an item is listed on eBay.
- Any modifications to the listing will also update the history record with the modified HTML.

This ensures that the exact HTML used for listing items is preserved for auditing and reference purposes.

---

## **Application Workflow**

### **1. Initial Setup**
- Clone the repository and install dependencies.
- Initialize the database using migration and seeding scripts.
- Start the backend and frontend servers.

### **2. User Interaction**
- **Item Page**:
  - View a list of items (default: active items).
  - Select an item to view details in a tabbed interface.
  - Add new items or delete existing ones.
- **Owner Page**:
  - Manage owner information and general terms.
  - Link items to owners and override terms as needed.
- **Sales Page**:
  - Record and track sales data.
  - Generate reports for sales trends and payouts.

---

## **Roles and Permissions**

### **1. Superuser**
- **Permissions**:
  - Full access to all application features and data.
  - Ability to view, create, modify, and delete all data, including sensitive data like negotiated contract terms.
- **Use Case**:
  - Typically assigned to system administrators or developers managing the application.

### **2. Admin**
- **Permissions**:
  - View and create system data (e.g., item master data, owner data).
  - Permissions available to General Users.
  - Cannot modify or delete sensitive data like negotiated contract terms.
- **Use Case**:
  - Assigned to users responsible for managing system data and overseeing operations.

### **3. General User**
- **Permissions**:
  - View data and create items in the lists (e.g., items, sales).
  - Create new Listing Items through the Add button.
  - Interact with and perform CRU (Create, Read, Update) operations on existing data.
- **Restrictions**:
  - Cannot add or modify item master data or owner data.
  - Cannot view sensitive data like negotiated contract terms.
- **Use Case**:
  - Assigned to regular users interacting with the application for day-to-day operations.

### **4. ItemOwner**
- **Permissions**:
  - View their items and associated details (status, negotiated terms, general terms).
  - Edit their contact information.
  - Cannot view or manage other users' items or sensitive system data.
- **Use Case**:
  - Assigned to owners of items listed in the system, allowing them to manage their own data and view relevant details.

---

## **Application Configuration Table**

### Overview
The `AppConfig` table is designed to store application-wide configuration settings in a flexible and scalable manner. It uses a key-value pair structure to accommodate various types of configuration data, including booleans, strings, numbers, and JSON objects. This table supports global and page-specific configurations, as well as environment-specific overrides.

### Table Schema
- **id**: A unique identifier for each configuration entry.
- **config_key**: A unique key representing the configuration setting.
- **config_value**: The value of the configuration, stored as text for flexibility.
- **data_type**: The data type of the configuration value (e.g., boolean, string, number, JSON).
- **scope**: The scope of the configuration (e.g., global, page-specific).
- **environment**: The environment for which the configuration applies (e.g., development, production).
- **updated_at**: A timestamp indicating the last update to the configuration.

### Example Configurations
| config_key       | config_value | data_type | scope       | environment   | updated_at          |
|------------------|--------------|-----------|-------------|---------------|---------------------|
| testdata         | true         | boolean   | global      | development   | 2025-05-01 10:00:00 |
| max_items_per_page | 50         | number    | item_page   | all           | 2025-05-01 10:00:00 |
| theme_color      | "#FFFFFF"    | string    | global      | all           | 2025-05-01 10:00:00 |
| feature_flags    | {"beta":true}| JSON      | global      | production    | 2025-05-01 10:00:00 |

### Usage
1. **Global Configurations**: Use the `scope` column to define settings that apply to the entire application.
2. **Page-Specific Configurations**: Use the `scope` column to specify settings for individual pages or components.
3. **Environment-Specific Overrides**: Use the `environment` column to define different values for development, testing, and production environments.
4. **Dynamic Updates**: The `updated_at` column helps track changes and ensures that the latest configurations are applied.

### Benefits
- **Flexibility**: Easily add new configuration settings without altering the database schema.
- **Scalability**: Supports a wide range of data types and scopes.
- **Environment-Specific**: Enables different configurations for various environments.
- **Future-Proof**: Accommodates complex configurations like feature flags or JSON objects.

---

## **Development Goals**

### **1. API-Driven Architecture**
- **Objective**:
  - Design the backend as a RESTful API to ensure flexibility and scalability.
  - Allow any frontend (e.g., web, mobile, or third-party integrations) to interact with the backend seamlessly.
- **Implementation**:
  - Use well-defined API endpoints for all operations (CRUD, workflows, etc.).
  - Follow RESTful principles for resource management.
  - Ensure proper versioning of APIs for backward compatibility.

### **2. Separation of Concerns**
- **Objective**:
  - Keep backend business logic and data management isolated from the frontend.
  - Ensure the backend handles all business rules, validations, and workflows.
- **Implementation**:
  - Use controllers and services in the backend to encapsulate business logic.
  - Frontend should only handle UI rendering and user interactions, relying on the backend for data and logic.

### **3. Testing Strategy**
- **Objective**:
  - Ensure the application is robust, reliable, and free of critical bugs.
- **Types of Tests**:
  1. **Unit Tests**:
     - Test individual functions, methods, and components in isolation.
     - Focus on backend models, controllers, and utility functions.
  2. **Integration Tests**:
     - Test interactions between different components (e.g., API endpoints, database).
     - Ensure data flows correctly between layers (e.g., controllers, services, and models).
  3. **Business Workflow Tests**:
     - Simulate real-world scenarios to validate end-to-end workflows.
     - Test critical business processes like item listing, sales tracking, and payouts.
- **Implementation**:
  - Use a testing framework like Jest or Mocha for backend tests.
  - Mock external dependencies (e.g., database, third-party APIs) where necessary.
  - Automate test execution as part of the CI/CD pipeline.

### **4. Scalability and Extensibility**
- **Objective**:
  - Design the system to handle future growth and new features.
- **Implementation**:
  - Use modular code structures for easy maintenance and feature addition.
  - Ensure the database schema supports future enhancements (e.g., new item states, roles).
  - Use environment-based configurations for deployment flexibility.

### **5. Security**
- **Objective**:
  - Protect sensitive data and ensure secure access to the application.
- **Implementation**:
  - Use role-based access control (RBAC) for API endpoints.
  - Encrypt sensitive data (e.g., passwords, negotiated terms).
  - Implement secure authentication (e.g., JWT tokens).
  - Regularly update dependencies to patch vulnerabilities.

### **6. Documentation**
- **Objective**:
  - Provide clear and comprehensive documentation for developers and users.
- **Implementation**:
  - Document API endpoints (e.g., using Swagger or Postman collections).
  - Maintain up-to-date technical documentation (e.g., architecture, workflows).
  - Provide user guides for frontend and backend usage.

### **7. Continuous Integration and Deployment (CI/CD)**
- **Objective**:
  - Automate testing, building, and deployment processes.
- **Implementation**:
  - Use tools like GitHub Actions or Jenkins for CI/CD pipelines.
  - Automate test execution and code quality checks on every commit.
  - Deploy to staging and production environments with minimal downtime.

---

## **Future Aspirations**

### **1. Analytics and Reporting**
- Add dashboards for sales trends and owner performance.
- Include visualizations for pricing and sales data.

### **2. Integration**
- Sync with eBay API for real-time updates.
- Integrate with QuickBooks for financial management.

### **3. User Roles and Permissions**
- Add role-based access control for managing items, owners, and sales.

---

## **Key Files and Directories (Updated)**
### Backend
- `backend/models/`: Sequelize models.
- `backend/src/controllers/`: API controllers.
- `backend/src/routes/`: Routes.
- `backend/src/utils/`: Shared utilities (instrumentation, db, etc.).
- `backend/scripts/`: Build, seed, swagger generation (use only sanctioned scripts).

### Frontend
- `frontend/src/components/`: Reusable UI.
- `frontend/src/hooks/`: Custom hooks.
- `frontend/src/services/`: API layer.
- `frontend/src/...`: Pages/routes per implementation.

### Database & Integration
- `database/migrations/` / `backend/migrations/`: Schema migrations.
- `backend/scripts/seedDatabase.js`: Seed logic.
- `docs/ebay_integration_architecture.md`: eBay integration design.
- `docs/ebay_snapshot_strategy.md`: Snapshot strategy.

---

## **Contributing**
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

---

## **License**
This project is licensed under the MIT License. See the LICENSE file for details.

---

# Application Overview

This project uses Docker Compose for backend, frontend, and database orchestration. Instrumentation, diagnostics, and test code are now consolidated in dedicated helpers for maintainability and production safety.

## Instrumentation and Diagnostics (May 2025 Update)
- All backend and database instrumentation code is in `backend/src/utils/backendInstrumentation.js`.
- All frontend instrumentation code is in `frontend/src/frontendInstrumentation.js`.
- See `logs/backend_docker_debugging_notes.md` and `logs/mount-issue.log` for a full record of debugging, issues, and resolutions.

## Debugging and Issue Resolution
- If you encounter backend startup issues (e.g., `MODULE_NOT_FOUND`, logger errors, or database connection problems), refer to the logs and use the helpers for diagnostics.
- Do not add test or debug code directly to production files; use the helpers.

## Running Jest API Tests and Capturing Output

To run a specific Jest test file and capture detailed output for debugging, use the following command in PowerShell:

```
npx jest --runInBand --detectOpenHandles --forceExit --testPathPattern=ownershipApi.test.js > "f:\Dev\eBaySalesTool\logs\API-Test-Results.txt" 2>&1
```

**Explanation:**
- `npx jest`: Runs Jest using npx (no global install required).
- `--runInBand`: Runs tests serially (one at a time), useful for debugging and avoiding race conditions.
- `--detectOpenHandles`: Helps detect async resource leaks.
- `--forceExit`: Forces Jest to exit after tests complete.
- `--testPathPattern=ownershipApi.test.js`: Runs only the specified test file.
- `> "f:\Dev\eBaySalesTool\logs\API-Test-Results.txt" 2>&1`: Redirects all output (stdout and stderr) to a log file for review.

This command is ideal for capturing all logs and errors during test execution for troubleshooting.