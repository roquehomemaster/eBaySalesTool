
-- Wrap all seeding in a single transaction for FK safety
BEGIN;

-- Truncate all tables in dependency order and reset sequences
TRUNCATE TABLE financialtracking RESTART IDENTITY CASCADE;
TRUNCATE TABLE saleshistory RESTART IDENTITY CASCADE;
TRUNCATE TABLE shippinglog RESTART IDENTITY CASCADE;
TRUNCATE TABLE sales RESTART IDENTITY CASCADE;
TRUNCATE TABLE listing RESTART IDENTITY CASCADE;
TRUNCATE TABLE catalog RESTART IDENTITY CASCADE;
TRUNCATE TABLE customerdetails RESTART IDENTITY CASCADE;
TRUNCATE TABLE customer RESTART IDENTITY CASCADE;
TRUNCATE TABLE ownershipagreements RESTART IDENTITY CASCADE;
TRUNCATE TABLE ownership RESTART IDENTITY CASCADE;
TRUNCATE TABLE application_account RESTART IDENTITY CASCADE;
TRUNCATE TABLE roles RESTART IDENTITY CASCADE;

-- Insert or fetch the Admin role, capture role_id
WITH ins_role AS (
  INSERT INTO roles (name)
  VALUES ('Admin')
  ON CONFLICT (name) DO NOTHING
  RETURNING role_id
), role_row AS (
  SELECT COALESCE((SELECT role_id FROM ins_role), (SELECT role_id FROM roles WHERE name = 'Admin')) AS role_id
)
-- Insert application accounts using captured role_id, capture user ids
, ins_user1 AS (
  INSERT INTO application_account (username, password_hash, email, role_id, created_at, updated_at)
  SELECT 'johndoe', 'hashedpassword1', 'john.doe@example.com', role_id, NOW(), NOW()
  FROM role_row
  RETURNING user_account_id
), user1 AS (
  SELECT COALESCE((SELECT user_account_id FROM ins_user1), (SELECT user_account_id FROM application_account WHERE username='johndoe')) AS user_account_id
), ins_user2 AS (
  INSERT INTO application_account (username, password_hash, email, role_id, created_at, updated_at)
  SELECT 'janesmith', 'hashedpassword2', 'jane.smith@example.com', role_id, NOW(), NOW()
  FROM role_row
  RETURNING user_account_id
), user2 AS (
  SELECT COALESCE((SELECT user_account_id FROM ins_user2), (SELECT user_account_id FROM application_account WHERE username='janesmith')) AS user_account_id
)
-- Insert ownerships referencing the users, with emails that won't conflict with tests
, ins_own1 AS (
  INSERT INTO ownership (
    ownership_type, first_name, last_name, address, telephone, email,
    company_name, company_address, company_telephone, company_email,
    assigned_contact_first_name, assigned_contact_last_name, assigned_contact_telephone, assigned_contact_email,
    user_account_id, created_at, updated_at
  )
  SELECT 'Self', 'John', 'Doe', '123 Main St', '555-1234', 'owner1@example.com',
         NULL, NULL, NULL, NULL,
         NULL, NULL, NULL, NULL,
         user_account_id, NOW(), NOW()
  FROM user1
  RETURNING ownership_id
), own1 AS (
  SELECT ownership_id FROM ins_own1
), ins_own2 AS (
  INSERT INTO ownership (
    ownership_type, first_name, last_name, address, telephone, email,
    company_name, company_address, company_telephone, company_email,
    assigned_contact_first_name, assigned_contact_last_name, assigned_contact_telephone, assigned_contact_email,
    user_account_id, created_at, updated_at
  )
  SELECT 'Company', NULL, NULL, NULL, NULL, 'owner2@example.com',
         'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com',
         'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com',
         user_account_id, NOW(), NOW()
  FROM user2
  RETURNING ownership_id
), own2 AS (
  SELECT ownership_id FROM ins_own2
)
-- Insert customers and details
, ins_cust1 AS (
  INSERT INTO customer (first_name, last_name, email, phone, address, status, created_at, updated_at)
  VALUES ('John', 'Doe', 'john.doe@example.com', '555-1234', '123 Main St', 'active', NOW(), NOW())
  RETURNING customer_id
), ins_cust2 AS (
  INSERT INTO customer (first_name, last_name, email, phone, address, status, created_at, updated_at)
  VALUES ('Jane', 'Smith', 'jane.smith@example.com', '555-5678', '456 Elm St', 'active', NOW(), NOW())
  RETURNING customer_id
)
INSERT INTO customerdetails (customerdetail_id, customer_id, address, phone, notes, created_at, updated_at)
VALUES
  (1, (SELECT customer_id FROM ins_cust1), '123 Main St', '555-1234', 'First customer', NOW(), NOW()),
  (2, (SELECT customer_id FROM ins_cust2), '456 Elm St', '555-5678', 'Second customer', NOW(), NOW());

-- Insert catalog items and capture item_ids
WITH ins_item1 AS (
  INSERT INTO catalog (description, manufacturer, model, serial_number, sku_barcode, created_at, updated_at)
  VALUES ('Test Item 1', 'TestCo', 'ModelA', 'SN123', 'SKU123', NOW(), NOW())
  RETURNING item_id
), ins_item2 AS (
  INSERT INTO catalog (description, manufacturer, model, serial_number, sku_barcode, created_at, updated_at)
  VALUES ('Test Item 2', 'TestCo', 'ModelB', 'SN124', 'SKU124', NOW(), NOW())
  RETURNING item_id
)
-- Insert listings referencing catalog items
INSERT INTO listing (title, listing_price, item_id, status, watchers, item_condition_description, payment_method, shipping_method, created_at, updated_at)
VALUES
  ('Sample Listing 1', 150.00, (SELECT item_id FROM ins_item1), 'active', 0, 'New', 'PayPal', 'Standard', NOW(), NOW()),
  ('Sample Listing 2', 75.00, (SELECT item_id FROM ins_item2), 'active', 0, 'Used', 'Credit Card', 'Express', NOW(), NOW());

-- Insert sales referencing listings and ownerships
WITH l1 AS (SELECT listing_id FROM listing ORDER BY listing_id ASC LIMIT 1),
     l2 AS (SELECT listing_id FROM listing ORDER BY listing_id DESC LIMIT 1)
INSERT INTO sales (listing_id, sold_price, sold_date, sold_shipping_collected, taxes, ownership_id, negotiated_terms, negotiated_terms_calculation, sales_channel, customer_feedback)
VALUES
  ((SELECT listing_id FROM l1), 150.00, NOW(), 10.00, 5.00, (SELECT ownership_id FROM ownership WHERE email = 'owner1@example.com' ORDER BY ownership_id DESC LIMIT 1), 'Standard terms', 135.00, 'eBay', 'Great product!'),
  ((SELECT listing_id FROM l2), 75.00, NOW(), 5.00, 2.00, (SELECT ownership_id FROM ownership WHERE email = 'owner2@example.com' ORDER BY ownership_id DESC LIMIT 1), 'Negotiated', 68.00, 'Website', 'Good quality');

-- Insert sales history referencing created sales
WITH s AS (SELECT sale_id FROM sales ORDER BY sale_id ASC),
     s1 AS (SELECT sale_id FROM s LIMIT 1),
     s2 AS (SELECT sale_id FROM s OFFSET 1 LIMIT 1)
INSERT INTO saleshistory (sale_id, change_type, change_details, changed_by, changed_at)
VALUES
  ((SELECT sale_id FROM s1), 'update', '{"field": "price", "old": 100, "new": 150}', (SELECT user_account_id FROM application_account WHERE username='johndoe' ORDER BY user_account_id DESC LIMIT 1), '2025-04-01 10:00:00'),
  ((SELECT sale_id FROM s2), 'update', '{"field": "description", "old": "Old desc", "new": "New desc"}', (SELECT user_account_id FROM application_account WHERE username='janesmith' ORDER BY user_account_id DESC LIMIT 1), '2025-04-02 11:00:00');

-- Insert shipping logs (non-serial PK) referencing listings
WITH l AS (SELECT listing_id FROM listing ORDER BY listing_id ASC)
INSERT INTO shippinglog (shippinglog_id, listing_id, shipping_collected, shipping_label_costs, additional_shipping_costs_material, shipping_total)
VALUES
  (1, (SELECT listing_id FROM l LIMIT 1), 10.00, 2.00, 1.00, 13.00),
  (2, (SELECT listing_id FROM l OFFSET 1 LIMIT 1), 5.00, 1.50, 0.50, 7.00);

-- Insert financial tracking referencing listing and sales (auto id)
WITH s AS (SELECT sale_id, listing_id FROM sales ORDER BY sale_id ASC)
INSERT INTO financialtracking (listing_id, sale_id, sold_total, taxes_collected, actual_shipping_costs, net_proceeds_calculation, final_evaluation_calculation_used, terms_calculation, customer_payout, our_profit)
VALUES
  ((SELECT listing_id FROM s LIMIT 1), (SELECT sale_id FROM s LIMIT 1), 150.00, 5.00, 10.00, 135.00, 0, 0, 120.00, 15.00),
  ((SELECT listing_id FROM s OFFSET 1 LIMIT 1), (SELECT sale_id FROM s OFFSET 1 LIMIT 1), 75.00, 2.00, 5.00, 68.00, 0, 0, 60.00, 8.00);

COMMIT;

