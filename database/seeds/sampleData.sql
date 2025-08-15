-- NOTE: This top-level seed file is legacy and NOT used by the automated build.
-- Canonical seed lives at backend/database/seeds/sampleData.sql.
-- Keep here only for reference; update both if intentionally diverging.

-- Insert Catalog records (for API compatibility)

INSERT INTO catalog (item_id, description, manufacturer, model, sku, barcode, created_at, updated_at) VALUES
  (1, 'Vintage Camera', 'Canon', 'AE-1', 'CAM-AE1', 'CAM12345', NOW(), NOW()),
  (2, 'Antique Vase', 'Unknown', 'N/A', 'VAS-ANTQ', 'VAS67890', NOW(), NOW());



-- Insert ownership records for FK integrity
INSERT INTO ownership (ownership_id, ownership_type, first_name, last_name, address, telephone, email, company_name, company_address, company_telephone, company_email, assigned_contact_first_name, assigned_contact_last_name, assigned_contact_telephone, assigned_contact_email)
VALUES
  (1, 'Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
  (2, 'Company', NULL, NULL, NULL, NULL, NULL, 'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com');

-- Insert OwnershipAgreements records
INSERT INTO ownershipagreements (ownershipagreement_id, ownership_id, commission_percentage, minimum_sale_price, duration_of_agreement, renewal_terms)
VALUES
  (1, 1, 10.0, 100.0, 30, 'Renew automatically'),
  (2, 2, 15.0, 200.0, 60, 'Manual renewal required');



INSERT INTO application_account (username, password_hash, email, created_at, updated_at)
VALUES
  ('johndoe', 'hashedpassword1', 'john.doe@example.com', NOW(), NOW()),
  ('janesmith', 'hashedpassword2', 'jane.smith@example.com', NOW(), NOW());

-- Insert historylogs records (entity, entity_id, action, change_details, user_account_id, created_at)
-- Insert historylogs records (id, entity, entity_id, action, change_details, user_account_id, created_at)
INSERT INTO historylogs (entity, entity_id, action, change_details, user_account_id, created_at)
VALUES
  ('listing', 1, 'update', '{"field": "price", "old": 100, "new": 150}', 1, '2025-04-01 10:00:00'),
  ('listing', 2, 'update', '{"field": "description", "old": "Old desc", "new": "New desc"}', 2, '2025-04-02 11:00:00'),
  ('ownership', 1, 'create', '{"field": "ownership_type", "new": "Self"}', 1, '2025-04-03 12:00:00'),
  ('ownership', 2, 'create', '{"field": "ownership_type", "new": "Company"}', 2, '2025-04-03 12:05:00');




-- Insert customer records with explicit IDs for FK integrity (must match customerdetails.customer_id references)
INSERT INTO customer (customer_id, first_name, last_name, email, phone, address, status, created_at, updated_at) VALUES
  (1, 'John', 'Doe', 'john.doe@example.com', '555-1234', '123 Main St', 'active', NOW(), NOW()),
  (2, 'Jane', 'Smith', 'jane.smith@example.com', '555-5678', '456 Elm St', 'active', NOW(), NOW());

-- Insert listing records required for sales FK (item_id must exist in catalog)
INSERT INTO listing (listing_id, title, listing_price, item_id, status, watchers, item_condition_description, payment_method, shipping_method, serial_number, manufacture_date, created_at, updated_at) VALUES
  (1, 'Sample Listing 1', 150.00, 1, 'active', 0, 'New', 'PayPal', 'Standard', '12345', '2024-01-15', NOW(), NOW()),
  (2, 'Sample Listing 2', 75.00, 2, 'active', 0, 'Used', 'Credit Card', 'Express', '67890', '2023-12-10', NOW(), NOW());

-- Insert sales records (using correct columns)
INSERT INTO sales (sale_id, listing_id, sold_price, sold_date, sold_shipping_collected, taxes, ownership_id, negotiated_terms, negotiated_terms_calculation, sales_channel, customer_feedback)
VALUES
  (1, 1, 150.00, '2023-10-01', 10.00, 5.00, 1, 'Standard terms', 135.00, 'eBay', 'Great product!'),
  (2, 2, 75.00, '2023-10-05', 5.00, 2.00, 2, 'Negotiated', 68.00, 'Website', 'Good quality');






-- Insert customerdetails records (must match schema: id, customer_id, address, phone, notes, created_at, updated_at)
INSERT INTO customerdetails (customerdetail_id, customer_id, address, phone, notes, created_at, updated_at) VALUES
  (1, 1, '123 Main St', '555-1234', 'VIP customer', NOW(), NOW()),
  (2, 2, '456 Elm St', '555-5678', 'Frequent buyer', NOW(), NOW());


-- Insert financialtracking records (must match schema: id, item_id, sales_id, sold_total, taxes_collected, actual_shipping_costs, net_proceeds_calculation, final_evaluation_calculation_used, terms_calculation, customer_payout, our_profit)
INSERT INTO financialtracking (financialtracking_id, listing_id, sale_id, sold_total, taxes_collected, actual_shipping_costs, net_proceeds_calculation, final_evaluation_calculation_used, terms_calculation, customer_payout, our_profit) VALUES
  (1, 1, 1, 150.00, 5.00, 10.00, 135.00, 130.00, 120.00, 100.00, 20.00),
  (2, 2, 2, 75.00, 2.00, 5.00, 68.00, 65.00, 60.00, 50.00, 10.00);

INSERT INTO communicationlogs (communicationlog_id, ownership_id, owner_communication_history, approval_process)
VALUES
  (1, 1, 'Discussed pricing on 2025-04-01', 'Approved by email'),
  (2, 2, 'Negotiated terms on 2025-04-02', 'Approved in person');


INSERT INTO performancemetrics (performancemetric_id, item_id, total_sales, number_of_items_sold, average_sale_price) VALUES
  (1, 1, 500.0, 5, 100.0),
  (2, 2, 400.0, 2, 200.0);


-- Insert saleshistory records (saleshistory_id, sale_id, change_type, change_details, changed_by, changed_at)
INSERT INTO saleshistory (saleshistory_id, sale_id, change_type, change_details, changed_by, changed_at) VALUES
  (1, 1, 'created', 'Initial sale record created', 1, '2025-04-01 10:05:00'),
  (2, 1, 'updated', 'Price updated from 100 to 150', 1, '2025-04-01 10:10:00'),
  (3, 2, 'created', 'Initial sale record created', 2, '2025-04-02 11:05:00'),
  (4, 2, 'updated', 'Shipping method changed to Express', 2, '2025-04-02 11:10:00');

-- Insert shippinglog records (id, listing_id, shipping_collected, shipping_label_costs, additional_shipping_costs_material, shipping_total)
INSERT INTO shippinglog (shippinglog_id, listing_id, shipping_collected, shipping_label_costs, additional_shipping_costs_material, shipping_total) VALUES
  (1, 1, 10.00, 3.00, 2.00, 15.00),
  (2, 2, 5.00, 2.00, 1.00, 8.00);


-- Insert returnhistory records (id, listing_id, return_reasoning, return_request_date, return_approved_date, return_received_date, return_decision_notes)
INSERT INTO returnhistory (id, listing_id, return_reasoning, return_request_date, return_approved_date, return_received_date, return_decision_notes) VALUES
  (1, 1, 'Damaged on arrival', '2025-04-10', '2025-04-12', '2025-04-15', 'Refund issued'),
  (2, 2, 'Not as described', '2025-04-11', '2025-04-13', '2025-04-16', 'Partial refund');

INSERT INTO order_details (id, listing_id, purchase_date, date_shipped, date_received, date_out_of_warranty, purchase_method, shipping_preferences) VALUES
  (1, 1, '2025-04-01', '2025-04-02', '2025-04-05', '2026-04-05', 'PayPal', 'Standard'),
  (2, 2, '2025-04-02', '2025-04-03', '2025-04-06', '2026-04-06', 'Credit Card', 'Express');


-- Insert product_research records (product_research_id, item_id, observed_sold_price, research_date)
INSERT INTO product_research (product_research_id, item_id, observed_sold_price, research_date) VALUES
  (1, 1, 140.00, '2025-03-25 09:00:00'),
  (2, 2, 70.00, '2025-03-26 10:00:00');

-- Insert ebayinfo records (account_id, store_name, feedback_score, positive_feedback_percent, seller_level, defect_rate, late_shipment_rate, transaction_defect_rate, policy_compliance_status, selling_limits, api_status, last_sync)
INSERT INTO ebayinfo (account_id, store_name, feedback_score, positive_feedback_percent, seller_level, defect_rate, late_shipment_rate, transaction_defect_rate, policy_compliance_status, selling_limits, api_status, last_sync) VALUES
  ('acc1', 'VintageStore', 1000, 99.8, 'Top Rated', 0.1, 0.2, 0.05, 'Compliant', '{"limit": 100}', 'Active', '2025-04-01'),
  ('acc2', 'AntiqueShop', 500, 98.5, 'Above Standard', 0.2, 0.3, 0.10, 'Compliant', '{"limit": 50}', 'Active', '2025-04-02');

-- Insert appconfig records (config_key, config_value, data_type)
INSERT INTO appconfig (config_key, config_value, data_type) VALUES
  ('site_name', 'eBay Sales Tool', 'string'),
  ('listings.page_size', '12', 'integer'),
  ('catalog.page_size', '15', 'integer'),
  ('sales.page_size', '10', 'integer');

-- Insert database_configuration records (key, value)
INSERT INTO database_configuration (key, value) VALUES
  ('maintenance_mode', '{"enabled": false}'),
  ('default_currency', '{"currency": "USD"}');