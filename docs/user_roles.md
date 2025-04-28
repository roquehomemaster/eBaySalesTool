# User Roles and Permissions

## **Overview**
This document outlines the roles and permissions implemented in the eBay Sales Tool application. Each role defines the level of access and actions a user can perform.

---

## **Roles**

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

### **5. Template Manager**
- **Permissions**:
  - Manage and upload new templates for item listings.
  - Assign templates to specific item listings.
  - Permissions available to Admins and Superusers.
- **Use Case**:
  - Assigned to users responsible for managing the templates used in item listings.

---

## **Implementation**

### **Backend**
- A `User` schema will store user information and roles.
- Middleware will enforce role-based access control for API endpoints.

### **Frontend**
- Role-based UI rendering will hide or disable features based on the user's role.
- Login and authentication mechanisms will ensure users can only access permitted features.

---

## **CRUD Page for Users**

### **Overview**
The CRUD (Create, Read, Update, Delete) page for Users allows administrators to manage user accounts and their associated roles. This page is accessible only to users with the `Superuser` or `Admin` roles.

### **Features**
1. **Create User**:
   - Add a new user by providing the following details:
     - First Name
     - Last Name
     - Username
     - Email Address
     - Role (Superuser, Admin, General User, ItemOwner, Template Manager)
   - Validation ensures all required fields are filled and the email is unique.

2. **Read User**:
   - View a list of all users with the following details:
     - Full Name
     - Username
     - Email Address
     - Role
   - Search and filter functionality to find specific users.

3. **Update User**:
   - Edit user details, including their role.
   - Validation ensures the email remains unique if updated.

4. **Delete User**:
   - Remove a user from the system.
   - Confirmation dialog to prevent accidental deletions.

### **UI Layout**
- **Header**: Title "User Management".
- **Table**: Displays user details with action buttons (Edit, Delete) for each row.
- **Add Button**: Positioned at the top-right to create a new user.
- **Search Bar**: Allows searching by name, username, or email.

---

## **Security Management Page**

### **Overview**
The Security Management page provides a comprehensive view of all features/actions in the application and their accessibility based on user roles. Each feature is represented as a boolean value (`true` or `false`) indicating whether the role has access.

### **Features**
1. **Role-Based Access Table**:
   - Columns: Feature/Action, Superuser, Admin, General User, ItemOwner, Template Manager.
   - Rows: List of all features/actions in the application.

2. **Editable Permissions**:
   - Accessible only to `Superuser`.
   - Allows toggling of boolean values to grant/restrict access.

### **Features/Actions List**
| Feature/Action                  | Superuser | Admin | General User | ItemOwner | Template Manager |
|---------------------------------|-----------|-------|--------------|-----------|------------------|
| Create User                     | true      | true  | false        | false     | false            |
| Read User                       | true      | true  | false        | false     | false            |
| Update User                     | true      | true  | false        | false     | false            |
| Delete User                     | true      | true  | false        | false     | false            |
| Create Listing Item             | true      | true  | true         | false     | false            |
| Read Listing Item               | true      | true  | true         | true      | false            |
| Update Listing Item             | true      | true  | true         | false     | false            |
| Delete Listing Item             | true      | true  | false        | false     | false            |
| View Sensitive Data             | true      | false | false        | false     | false            |
| Edit Contact Information        | true      | true  | false        | true      | false            |
| Manage System Data              | true      | true  | false        | false     | false            |
| Manage Templates                | true      | true  | false        | false     | true             |

### **UI Layout**
- **Header**: Title "Security Management".
- **Table**: Displays the role-based access table.
- **Edit Button**: Allows toggling of permissions (visible only to `Superuser`).
- **Save Button**: Saves changes to permissions.

---

## **Future Aspirations**
- **Custom Roles**:
  - Allow the creation of custom roles with specific permissions.
- **Audit Logs**:
  - Track user actions for security and accountability.
- **Two-Factor Authentication**:
  - Enhance security for user accounts.