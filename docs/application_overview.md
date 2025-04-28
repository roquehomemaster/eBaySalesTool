# eBay Sales Tool - Application Overview

## **Overview**
The eBay Sales Tool is a comprehensive web-based application designed to assist businesses in managing and tracking their eBay sales. It provides features for item management, owner management, sales tracking, and payout calculations, all integrated into a user-friendly interface.

---

## **Application Structure**
The application is divided into three main components:

### **1. Backend**
- **Framework**: Node.js with Express.
- **Purpose**: Handles API requests, business logic, and database interactions.
- **Key Features**:
  - CRUD operations for items, owners, and sales.
  - Integration with eBay API for real-time updates.
  - Payout calculation logic based on item-specific or owner-inherited terms.
- **Key Files**:
  - `models/`: Contains Mongoose schemas for `Item`, `Owner`, and `Sales`.
  - `routes/`: Defines API endpoints for items, owners, and sales.
  - `controllers/`: Implements business logic for API endpoints.
  - `utils/`: Utility functions for API interactions and data processing.

### **2. Frontend**
- **Framework**: React.
- **Purpose**: Provides a user-friendly interface for managing items, owners, and sales.
- **Key Features**:
  - Interactive list and details view for items.
  - Tabbed interface for item details (Details, Pricing, Shipping Info, Owner, History).
  - Search and sort functionality for item lists.
  - Responsive design for desktop and mobile.
- **Key Files**:
  - `components/`: Reusable React components for forms, tables, and research tools.
  - `services/`: API service for interacting with the backend.
  - `context/`: Context API for managing authentication and global state.

### **3. Database**
- **Type**: PostgreSQL.
- **Purpose**: Stores data for items, owners, and sales.
- **Key Features**:
  - Relational structure for efficient data management.
  - Migration and seeding scripts for database initialization.
- **Key Files**:
  - `migrations/`: SQL scripts for creating database schema.
  - `seeds/`: Sample data for testing and development.

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

## **Listing Item Clarification**

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

## **Key Files and Directories**

### **Backend**
- `models/`: Mongoose schemas for database models.
- `routes/`: API endpoints for items, owners, and sales.
- `controllers/`: Business logic for API endpoints.
- `utils/`: Helper functions for API interactions.

### **Frontend**
- `components/`: React components for UI elements.
- `services/`: API service for backend communication.
- `context/`: Context API for global state management.

### **Database**
- `migrations/`: SQL scripts for schema creation.
- `seeds/`: Sample data for testing.

---

## **Contributing**
Contributions are welcome! Please submit a pull request or open an issue for any enhancements or bug fixes.

---

## **License**
This project is licensed under the MIT License. See the LICENSE file for details.