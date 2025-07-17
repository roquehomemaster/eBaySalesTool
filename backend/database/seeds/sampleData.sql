-- Updated seed data to match new data structures



-- Insert Ownership records


-- Explicitly set IDs to match ownershipagreements
INSERT INTO ownership (id, ownership_type, first_name, last_name, address, telephone, email, company_name, company_address, company_telephone, company_email, assigned_contact_first_name, assigned_contact_last_name, assigned_contact_telephone, assigned_contact_email)
VALUES
  (1, 'Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (2, 'Company', NULL, NULL, NULL, NULL, NULL, 'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com');

-- Insert OwnershipAgreements records

INSERT INTO ownershipagreements (id, ownership_id, commission_percentage, minimum_sale_price, duration_of_agreement, renewal_terms)
VALUES
  (1, 1, 10.0, 100.0, 30, 'Renew automatically'),
  (2, 2, 15.0, 200.0, 60, 'Manual renewal required');

-- Insert historylogs records

-- Insert application_account records (formerly user table)

INSERT INTO application_account (username, password_hash, email, created_at, updated_at)
VALUES
  ('johndoe', 'hashedpassword1', 'john.doe@example.com', NOW(), NOW()),
  ('janesmith', 'hashedpassword2', 'jane.smith@example.com', NOW(), NOW());

-- Insert historylogs records (updated for new schema)
-- Insert historylogs records (entity, entity_id, action, change_details, user_account_id, created_at)
INSERT INTO historylogs (entity, entity_id, action, change_details, user_account_id, created_at)
VALUES
  ('listing', 1, 'update', '{"field": "price", "old": 100, "new": 150}', 1, '2025-04-01 10:00:00'),
  ('listing', 2, 'update', '{"field": "description", "old": "Old desc", "new": "New desc"}', 2, '2025-04-02 11:00:00'),
  ('ownership', 1, 'create', '{"field": "ownership_type", "new": "Self"}', 1, '2025-04-03 12:00:00'),
  ('ownership', 2, 'create', '{"field": "ownership_type", "new": "Company"}', 2, '2025-04-03 12:05:00');


-- Insert minimal Catalog records for FK integrity
INSERT INTO catalog (id, description, manufacturer, model, serial_number, sku_barcode, created_at, updated_at) VALUES
  (1, 'Test Item 1', 'TestCo', 'ModelA', 'SN123', 'SKU123', NOW(), NOW()),
  (2, 'Test Item 2', 'TestCo', 'ModelB', 'SN124', 'SKU124', NOW(), NOW());

-- Insert Listing records required for sales FK
INSERT INTO listing (id, title, listing_price, item_id, status, watchers, item_condition_description, payment_method, shipping_method, created_at, updated_at) VALUES
  (1, 'Sample Listing 1', 150.00, 1, 'active', 0, 'New', 'PayPal', 'Standard', NOW(), NOW()),
  (2, 'Sample Listing 2', 75.00, 2, 'active', 0, 'Used', 'Credit Card', 'Express', NOW(), NOW());

-- Insert sales records
-- Insert sales records (using correct columns)
INSERT INTO sales (id, listing_id, sold_price, sold_date, sold_shipping_collected, taxes, owner_id, negotiated_terms, negotiated_terms_calculation, sales_channel, customer_feedback)
VALUES
  (1, 1, 150.00, '2023-10-01', 10.00, 5.00, 1, 'Standard terms', 135.00, 'eBay', 'Great product!'),
  (2, 2, 75.00, '2023-10-05', 5.00, 2.00, 2, 'Negotiated', 68.00, 'Website', 'Good quality');

-- Insert SalesHistory records

-- Corrected: saleshistory (id, sale_id, change_type, change_details, changed_by, changed_at)
INSERT INTO saleshistory (id, sale_id, change_type, change_details, changed_by, changed_at)
VALUES
  (1, 1, 'update', '{"field": "price", "old": 100, "new": 150}', 1, '2025-04-01 10:00:00'),
  (2, 2, 'update', '{"field": "description", "old": "Old desc", "new": "New desc"}', 2, '2025-04-02 11:00:00');



INSERT INTO customerdetails (id, customer_id, address, phone, notes, created_at, updated_at)
VALUES
  (1, 1, '123 Main St', '555-1234', 'First customer', NOW(), NOW()),
  (2, 2, '456 Elm St', '555-5678', 'Second customer', NOW(), NOW());


-- Moved financialtracking insert to end for FK integrity

-- Insert CommunicationLogs records

-- Ensure communicationlogs table is dropped and recreated for correct owner_id column
DROP TABLE IF EXISTS communicationlogs CASCADE;
CREATE TABLE communicationlogs (
  id int PRIMARY KEY,
  owner_id int REFERENCES ownership(id),
  owner_communication_history text,
  approval_process text
);
INSERT INTO communicationlogs (id, owner_id, owner_communication_history, approval_process)
VALUES
  (1, 1, 'Discussed pricing on 2025-04-01', 'Approved by email'),
  (2, 2, 'Negotiated terms on 2025-04-02', 'Approved in person');

-- Insert PerformanceMetrics records




INSERT INTO financialtracking (id, item_id, sales_id, sold_total, taxes_collected, actual_shipping_costs, net_proceeds_calculation, final_evaluation_calculation_used, terms_calculation, customer_payout, our_profit)
VALUES
  (1, 1, 1, 150.00, 5.00, 10.00, 135.00, 0, 0, 120.00, 15.00),
  (2, 2, 2, 75.00, 2.00, 5.00, 68.00, 0, 0, 60.00, 8.00);

