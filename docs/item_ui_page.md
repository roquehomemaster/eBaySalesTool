# Item UI Page Design Documentation

## Overview
The **Item UI Page** is designed to manage and display detailed information about products listed on eBay. It consists of two main sections:
1. **Upper Section**: A list of items pulled from the database.
2. **Lower Section**: A detailed view of the selected item, displayed in a tabbed format.

---

## Item Definition
An **Item** represents a product listed on eBay. It is linked to an **Item Master Table** for general information and includes specific details about the product.

- **Item Master Table**:
  - Stores general item information such as:
    - Manufacturer Information: Make, Model.
    - Description: Detailed description of the product.
    - Sizing: Dimensions (e.g., length, width, height).
    - Weight: Weight of the product.
    - Technical Specifications: Any additional technical details.

- **Item Table**:
  - Contains item-specific details, including:
    - Lot/Batch/Serial Number Information.
    - eBay Information: Listing status, watchers, pricing, etc.
    - Link to Owner Information: Ownership details and contact information.

---

## Page Layout
1. **Header Section**:
   - **Title**: Displayed at the top of the page, centered, with the text "eBay Sales Tool".

2. **Messaging/Alert/Error Section**:
   - **Purpose**: Display messages to the user, such as success messages, errors, or alerts.
   - **Placement**: Directly below the title.
   - **Features**: Dynamically updates based on user actions or system feedback.

3. **List Section**:
   - **Purpose**: Display a list of items fetched from the database.
   - **Default View**: Show only currently active items.
   - **Features**:
     - **Search Bar**: Allow users to search for items by name, SKU, or other fields.
     - **Sort Options**: Enable sorting by fields such as Name, SKU, Category, Condition, or Status.
     - **Add Action Button**: Positioned at the top-right of the list section, allowing users to add a new item.
     - **Pagination or Infinite Scrolling**: Handle large datasets efficiently.
   - **Placement**: Below the messaging/alert/error section.

4. **Details Section**:
   - **Purpose**: Display detailed information about the selected item.
   - **Initial State**: Blank until an item is selected from the list.
   - **Features**:
     - **Tabbed View**:
       - **Details Tab**: General information about the item (e.g., description, dimensions, weight).
       - **Pricing Tab**: Pricing history, current price, and any discounts.
       - **Shipping Info Tab**: Shipping methods, costs, and estimated delivery times.
       - **Owner Tab**: Ownership details, including contact information and transfer history.
       - **History Tab**: A log of changes made to the item, including timestamps and change types.
     - **Delete Action Button**: Displayed in this section when an item is selected, allowing users to delete the selected item.
   - **Placement**: Below the list section, occupying the lower two-thirds of the page.

---

## Features
- **Interactive List**:
  - Clicking an item loads its details in the lower section.
  - Search and filter functionality for quick access.

- **Tabbed Details View**:
  - Smooth transitions between tabs.
  - Editable fields (if the user has permissions).
  - Save and cancel buttons for changes.

- **Responsive Design**:
  - Ensure the layout adapts to different screen sizes (desktop, tablet, mobile).

- **Error Handling**:
  - Display a message if no items are found or if there’s an error fetching data.

---

## Data Requirements
- **List Section**:
  - Each row in the list should include:
    - Item Name (clickable to load details in the lower section).
    - SKU/Barcode.
    - Category/Type.
    - Condition (e.g., New, Used).
    - Status (e.g., Active, Sold).

- **Details Section (Tabs)**:
  - **Details Tab**:
    - Description, Manufacturer, Model, Serial Number.
    - Dimensions, Weight, and Specifications.
  - **Pricing Tab**:
    - Current Price, Pricing History (graph or table), Discounts.
  - **Shipping Info Tab**:
    - Shipping Methods, Costs, Estimated Delivery Times.
  - **Owner Tab**:
    - Current Owner, Contact Info, Transfer History.
  - **History Tab**:
    - Change Type, Timestamp, and Description of changes.

---

## **ItemOwner Role Integration**

### **Purpose**
The `ItemOwner` role allows item owners to log in and manage their own data. This includes:
- Viewing their items and associated details (status, negotiated terms, general terms).
- Editing their contact information.

### **UI Adjustments**
- **Item List**:
  - Filtered to show only items owned by the logged-in `ItemOwner`.
- **Details Section**:
  - Includes tabs for viewing item status and negotiated terms.
  - Allows editing of contact information.

### **Permissions**
- Restricted from viewing or managing other users' items or sensitive system data.

---

## **Listing Item Integration**

### **Definition**
A **Listing Item** is the top-level entity representing an item being listed for sale on eBay. It includes:
- **Item Information**: Derived from the Item Master.
- **Listing Item Owner**: The owner associated with the listing.

### **States**
1. **Sales Active State**:
   - **Pending**: Default state when created.
   - **Active**: State when listed on eBay.
   - **Complete**: State when payout is confirmed.

2. **Item State**:
   - **New**: Default state when created.
   - **Pending**: State when pricing is set.
   - **Listed**: State when listed on eBay.
   - **Sold**: State when sold on eBay.
   - **Ready for Payout**: State when warranty terms are met.
   - **Paid**: State when payout is sent.
   - **Paid - Complete**: State 30 days after payout is sent.

### **Workflows**
1. **Sales Active State Workflow**:
   - **Pending** → **Active** → **Complete**.
2. **Item State Workflow**:
   - **New** → **Pending** → **Listed** → **Sold** → **Ready for Payout** → **Paid** → **Paid - Complete**.

### **UI Adjustments**
- **List Section**:
  - Display the Sales Active State and Item State for each Listing Item.
- **Details Section**:
  - Include tabs for managing states and workflows.
  - Allow General Users to create and update Listing Items.

---

## Default Table Behavior

When the database is empty, the Sales Table will display the table headers along with a default row containing the message "No sales data available." This ensures that the table structure is always visible to the user, even when no data is present.

---

# Item Page Wireframe

## Header Section
- **Title**: "Item Details"
- **Navigation Links**: Home, Items, Sales, Reports

## Item Information Section
- **Fields**:
  - Product Name
  - Description
  - Manufacturer Information
  - Dimensions (L x W x H)
  - Weight
  - Condition (dropdown: New, Used, Refurbished, etc.)
  - Category
  - SKU/Barcode
  - Images (upload and preview)

## Ownership Details Section
- **Fields**:
  - Current Owner
  - Transfer History (table with columns for previous owner, date, and reason for transfer)
  - Contact Information (phone, email, etc.)

## Sales History Section
- **Table Columns**:
  - Sale Date
  - Sale Price
  - Sales Channel
  - Customer Feedback

## eBay-Specific Information Section
- **Fields**:
  - Listing Status (Active, Ended, Removed)
  - Watchers
  - Payment Methods
  - Shipping Details

## Action Buttons
- Save Changes
- Delete Item
- Generate Listing (redirects to the listing generation page)

---

## Future Aspirations
- **Enhancements**:
  - Add a "Compare Items" feature to compare details of multiple items.
  - Include analytics (e.g., sales trends, pricing trends) in the Pricing tab.
  - Allow bulk actions (e.g., update status, delete) from the list.

- **Integration**:
  - Integrate with the backend API to fetch and update item data.
  - Use WebSocket or polling for real-time updates (e.g., status changes).

- **User Experience**:
  - Ensure the page is intuitive and easy to navigate.
  - Provide tooltips or help icons for complex fields.