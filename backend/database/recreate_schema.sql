-- DROP TABLES (in dependency order)

-- DROP TABLES (child tables first, then parents)
DROP TABLE IF EXISTS financialtracking CASCADE;
DROP TABLE IF EXISTS shippinglog CASCADE;
DROP TABLE IF EXISTS communicationlogs CASCADE;
DROP TABLE IF EXISTS performancemetrics CASCADE;
DROP TABLE IF EXISTS returnhistory CASCADE;
DROP TABLE IF EXISTS order_details CASCADE;
DROP TABLE IF EXISTS saleshistory CASCADE;
DROP TABLE IF EXISTS sales CASCADE;
DROP TABLE IF EXISTS listing CASCADE;
DROP TABLE IF EXISTS product_research CASCADE;
DROP TABLE IF EXISTS ownershipagreements CASCADE;
DROP TABLE IF EXISTS historylogs CASCADE;
DROP TABLE IF EXISTS customerdetails CASCADE;
DROP TABLE IF EXISTS ownership CASCADE;
DROP TABLE IF EXISTS application_account CASCADE;
DROP TABLE IF EXISTS catalog CASCADE;
DROP TABLE IF EXISTS customer CASCADE;
DROP TABLE IF EXISTS ebayinfo CASCADE;
DROP TABLE IF EXISTS appconfig CASCADE;
DROP TABLE IF EXISTS database_configuration CASCADE;


-- CREATE TABLES (parents first, then children, all-lowercase, snake_case, unquoted)

CREATE TABLE application_account (
  user_account_id SERIAL PRIMARY KEY,
  username varchar UNIQUE,
  password_hash varchar,
  email varchar UNIQUE,
  role_id int,
  first_name varchar,
  last_name varchar,
  status varchar,
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE catalog (
  id int PRIMARY KEY,
  description varchar,
  manufacturer varchar,
  model varchar,
  serial_number varchar,
  sku_barcode varchar UNIQUE,
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE customer (
  id int PRIMARY KEY,
  first_name varchar,
  last_name varchar,
  email varchar,
  phone varchar,
  address varchar,
  status varchar,
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE ebayinfo (
  account_id varchar PRIMARY KEY,
  store_name varchar,
  feedback_score int,
  positive_feedback_percent float,
  seller_level varchar,
  ebay_evaluation_fee float,
  defect_rate float,
  late_shipment_rate float,
  transaction_defect_rate float,
  policy_compliance_status varchar,
  selling_limits jsonb,
  api_status varchar,
  last_sync date
);

CREATE TABLE appconfig (
  config_key varchar PRIMARY KEY,
  config_value text,
  data_type varchar
);

CREATE TABLE database_configuration (
  key text PRIMARY KEY,
  value jsonb
);

CREATE TABLE ownership (
  id int PRIMARY KEY,
  ownership_type varchar,
  first_name varchar,
  last_name varchar,
  address text,
  telephone varchar,
  email varchar UNIQUE,
  user_account_id int UNIQUE REFERENCES application_account(user_account_id),
  company_name varchar,
  company_address text,
  company_telephone varchar,
  company_email varchar,
  assigned_contact_first_name varchar,
  assigned_contact_last_name varchar,
  assigned_contact_telephone varchar,
  assigned_contact_email varchar
);

CREATE TABLE ownershipagreements (
  id int PRIMARY KEY,
  ownership_id int REFERENCES ownership(id),
  commission_percentage decimal,
  minimum_sale_price decimal,
  duration_of_agreement int,
  renewal_terms text
);

CREATE TABLE customerdetails (
  id int PRIMARY KEY,
  customer_id int REFERENCES customer(id),
  address varchar,
  phone varchar,
  notes text,
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE listing (
  id int PRIMARY KEY,
  title varchar,
  listing_price decimal,
  item_id int REFERENCES catalog(id),
  status varchar,
  watchers int,
  item_condition_description text,
  payment_method varchar,
  shipping_method text,
  created_at timestamp,
  updated_at timestamp
);

CREATE TABLE sales (
  id int PRIMARY KEY,
  listing_id int REFERENCES listing(id),
  sold_price decimal,
  sold_date timestamp,
  sold_shipping_collected decimal,
  taxes decimal,
  owner_id int REFERENCES ownership(id),
  negotiated_terms text,
  negotiated_terms_calculation decimal,
  sales_channel varchar,
  customer_feedback text
);

CREATE TABLE saleshistory (
  id int PRIMARY KEY,
  sale_id int REFERENCES sales(id),
  change_type varchar,
  change_details text,
  changed_by int REFERENCES application_account(user_account_id),
  changed_at timestamp
);


CREATE TABLE shippinglog (
  id int PRIMARY KEY,
  listing_id int REFERENCES listing(id),
  shipping_collected decimal,
  shipping_label_costs decimal,
  additional_shipping_costs_material decimal,
  shipping_total decimal
);

CREATE TABLE product_research (
  id int PRIMARY KEY,
  item int REFERENCES catalog(id),
  observed_sold_price decimal,
  research_date timestamp
);

CREATE TABLE historylogs (
  id int GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  entity varchar,
  entity_id int,
  action varchar,
  change_details text,
  user_account_id int REFERENCES application_account(user_account_id),
  created_at timestamp
);

CREATE TABLE returnhistory (
  id int PRIMARY KEY,
  item_id int REFERENCES listing(id),
  return_reasoning text,
  return_request_date date,
  return_approved_date date,
  return_received_date date,
  return_decision_notes text
);

CREATE TABLE order_details (
  id int,
  listing_id int,
  purchase_date date,
  date_shipped date,
  date_received date,
  date_out_of_warranty date,
  purchase_method varchar,
  shipping_preferences text,
  PRIMARY KEY (id, listing_id),
  FOREIGN KEY (listing_id) REFERENCES listing(id)
-- removed stray parenthesis
);



CREATE TABLE financialtracking (
  id int PRIMARY KEY,
  item_id int REFERENCES listing(id),
  sales_id int REFERENCES sales(id),
  sold_total decimal,
  taxes_collected decimal,
  actual_shipping_costs decimal,
  net_proceeds_calculation decimal,
  final_evaluation_calculation_used decimal,
  terms_calculation decimal,
  customer_payout decimal,
  our_profit decimal
);

CREATE TABLE communicationlogs (
  id int PRIMARY KEY,
  owner_id int REFERENCES ownership(id),
  owner_communication_history text,
  approval_process text
);

CREATE TABLE performancemetrics (
  id int PRIMARY KEY,
  item_id int UNIQUE REFERENCES catalog(id),
  total_sales decimal,
  number_of_items_sold int,
  average_sale_price decimal
);
