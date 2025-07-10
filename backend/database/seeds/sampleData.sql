-- Updated seed data to match new data structures



-- Insert Ownership records
INSERT INTO "Ownership" (ownership_type, first_name, last_name, address, telephone, email, company_name, company_address, company_telephone, company_email, assigned_contact_first_name, assigned_contact_last_name, assigned_contact_telephone, assigned_contact_email)
VALUES
('Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Company', NULL, NULL, NULL, NULL, NULL, 'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com');

-- Insert OwnershipAgreements records
INSERT INTO "OwnershipAgreements" (ownership_id, commission_percentage, minimum_sale_price, duration_of_agreement, renewal_terms)
VALUES
(1, 10.0, 100.0, 30, 'Renew automatically'),
(2, 15.0, 200.0, 60, 'Manual renewal required');

-- Insert HistoryLogs records
INSERT INTO "HistoryLogs" (entity, entityId, action, changeDetails, user_id, createdAt)
VALUES
('Listing', 1, 'update', '{"field": "price", "old": 100, "new": 150}', 1, '2025-04-01 10:00:00'),
('Listing', 2, 'update', '{"field": "description", "old": "Old desc", "new": "New desc"}', 2, '2025-04-02 11:00:00'),
('Ownership', 1, 'create', '{"field": "ownership_type", "new": "Self"}', 1, '2025-04-03 12:00:00'),
('Ownership', 2, 'create', '{"field": "ownership_type", "new": "Company"}', 2, '2025-04-03 12:05:00')
ON CONFLICT (entity, entityId, action, createdAt) DO NOTHING;

-- Insert sales records
INSERT INTO "sales" (item, price, soldDate, owner, negotiatedTerms)
VALUES
('Vintage Camera', 150.00, '2023-10-01', 'John Doe', NULL),
('Antique Vase', 75.00, '2023-10-05', 'Acme Corp', NULL);

-- Insert SalesHistory records
INSERT INTO "SalesHistory" (item_id, sales_channel, return_history, customer_feedback)
VALUES
(1, 'eBay', 'No returns', 'Great product!'),
(2, 'Website', 'Returned once', 'Good quality');


-- Insert CustomerDetails records
INSERT INTO "CustomerDetails" (purchase_date, purchase_method, shipping_preferences)
VALUES
('2025-04-15', 'Credit Card', 'Standard shipping'),
('2025-04-20', 'PayPal', 'Express shipping');

-- Insert FinancialTracking records
INSERT INTO "FinancialTracking" (item_id, net_proceeds_calculation)
VALUES
(1, 'Sale price: $100, eBay fees: $10, Shipping: $5, Net: $85'),
(2, 'Sale price: $200, eBay fees: $20, Shipping: $10, Net: $170');

-- Insert CommunicationLogs records
INSERT INTO "CommunicationLogs" (owner_id, owner_communication_history, approval_process)
VALUES
(1, 'Discussed pricing on 2025-04-01', 'Approved by email'),
(2, 'Negotiated terms on 2025-04-02', 'Approved in person');

-- Insert PerformanceMetrics records
INSERT INTO "PerformanceMetrics" (item_id, total_sales, number_of_items_sold, average_sale_price)
VALUES
(1, 500.0, 5, 100.0),
(2, 400.0, 2, 200.0);

-- Insert Customer records for API tests
INSERT INTO "Customer" ("firstName", "lastName", "email", "phone", "address", "status", "createdAt", "updatedAt") VALUES
('John', 'Doe', 'john@example.com', '555-1234', '123 Main St', 'active', NOW(), NOW()),
('Jane', 'Smith', 'jane@example.com', '555-5678', '456 Elm St', 'active', NOW(), NOW());