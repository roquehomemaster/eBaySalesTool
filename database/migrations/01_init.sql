-- Canonical schema initialization (SOP-compliant): all-lowercase, snake_case, unquoted identifiers

-- Drop legacy or conflicting tables first (broad net to prevent name casing inconsistencies)
DROP TABLE IF EXISTS "users" CASCADE;
DROP TABLE IF EXISTS "SalesHistory" CASCADE;
DROP TABLE IF EXISTS "Customer" CASCADE;
DROP TABLE IF EXISTS "eBayInfo" CASCADE;

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

-- Create tables (parents first)
CREATE TABLE application_account (
    user_account_id SERIAL PRIMARY KEY,
    username VARCHAR UNIQUE,
    password_hash VARCHAR,
    email VARCHAR UNIQUE,
    role_id INT,
    first_name VARCHAR,
    last_name VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE roles (
    role_id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE,
    description VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE pages (
    page_id SERIAL PRIMARY KEY,
    name VARCHAR UNIQUE,
    url VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE role_page_access (
    access_id SERIAL PRIMARY KEY,
    role_id INT REFERENCES roles(role_id),
    page_id INT REFERENCES pages(page_id),
    access VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE catalog (
    item_id SERIAL PRIMARY KEY,
    description VARCHAR,
    manufacturer VARCHAR,
    model VARCHAR,
    serial_number VARCHAR,
    sku_barcode VARCHAR UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE customer (
    customer_id SERIAL PRIMARY KEY,
    first_name VARCHAR,
    last_name VARCHAR,
    email VARCHAR,
    phone VARCHAR,
    address VARCHAR,
    status VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ownership (
    ownership_id SERIAL PRIMARY KEY,
    ownership_type VARCHAR,
    first_name VARCHAR,
    last_name VARCHAR,
    address TEXT,
    telephone VARCHAR,
    email VARCHAR UNIQUE,
    user_account_id INT UNIQUE REFERENCES application_account(user_account_id),
    company_name VARCHAR,
    company_address TEXT,
    company_telephone VARCHAR,
    company_email VARCHAR,
    assigned_contact_first_name VARCHAR,
    assigned_contact_last_name VARCHAR,
    assigned_contact_telephone VARCHAR,
    assigned_contact_email VARCHAR,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE ownershipagreements (
    ownershipagreement_id INT PRIMARY KEY,
    ownership_id INT REFERENCES ownership(ownership_id),
    commission_percentage DECIMAL,
    minimum_sale_price DECIMAL,
    duration_of_agreement INT,
    renewal_terms TEXT
);

CREATE TABLE customerdetails (
    customerdetail_id INT PRIMARY KEY,
    customer_id INT REFERENCES customer(customer_id),
    address VARCHAR,
    phone VARCHAR,
    notes TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE listing (
    listing_id SERIAL PRIMARY KEY,
    title VARCHAR,
    listing_price DECIMAL,
    item_id INT REFERENCES catalog(item_id),
    ownership_id INT REFERENCES ownership(ownership_id),
    status VARCHAR,
    watchers INT,
    item_condition_description TEXT,
    payment_method VARCHAR,
    shipping_method TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Track ownership history for listings (Option #2 implementation)
CREATE TABLE listing_ownership_history (
    listing_ownership_history_id SERIAL PRIMARY KEY,
    listing_id INT NOT NULL REFERENCES listing(listing_id),
    ownership_id INT NOT NULL REFERENCES ownership(ownership_id),
    started_at TIMESTAMP NOT NULL DEFAULT CURRENT_TIMESTAMP,
    ended_at TIMESTAMP NULL,
    change_reason TEXT,
    changed_by INT NULL REFERENCES application_account(user_account_id)
);
CREATE INDEX idx_listing_ownership_history_listing ON listing_ownership_history(listing_id);
CREATE INDEX idx_listing_ownership_history_active ON listing_ownership_history(listing_id, ended_at);

CREATE TABLE sales (
    sale_id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listing(listing_id),
    sold_price DECIMAL,
    sold_date TIMESTAMP,
    sold_shipping_collected DECIMAL,
    taxes DECIMAL,
    ownership_id INT REFERENCES ownership(ownership_id),
    negotiated_terms TEXT,
    negotiated_terms_calculation DECIMAL,
    sales_channel VARCHAR,
    customer_feedback TEXT
);

CREATE TABLE saleshistory (
    saleshistory_id SERIAL PRIMARY KEY,
    sale_id INT REFERENCES sales(sale_id),
    change_type VARCHAR,
    change_details TEXT,
    changed_by INT REFERENCES application_account(user_account_id),
    changed_at TIMESTAMP
);

CREATE TABLE shippinglog (
    shippinglog_id INT PRIMARY KEY,
    listing_id INT REFERENCES listing(listing_id),
    shipping_collected DECIMAL,
    shipping_label_costs DECIMAL,
    additional_shipping_costs_material DECIMAL,
    shipping_total DECIMAL
);

CREATE TABLE product_research (
    product_research_id INT PRIMARY KEY,
    item_id INT REFERENCES catalog(item_id),
    observed_sold_price DECIMAL,
    research_date TIMESTAMP
);

CREATE TABLE historylogs (
    id INT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    entity VARCHAR,
    entity_id INT,
    action VARCHAR,
    change_details TEXT,
    user_account_id INT REFERENCES application_account(user_account_id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE returnhistory (
    id INT PRIMARY KEY,
    listing_id INT REFERENCES listing(listing_id),
    return_reasoning TEXT,
    return_request_date DATE,
    return_approved_date DATE,
    return_received_date DATE,
    return_decision_notes TEXT
);

CREATE TABLE order_details (
    id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listing(listing_id),
    purchase_date DATE,
    date_shipped DATE,
    date_received DATE,
    date_out_of_warranty DATE,
    purchase_method VARCHAR(50),
    shipping_preferences VARCHAR(100)
);

CREATE TABLE financialtracking (
    financialtracking_id SERIAL PRIMARY KEY,
    listing_id INT REFERENCES listing(listing_id),
    sale_id INT REFERENCES sales(sale_id),
    sold_total DECIMAL,
    taxes_collected DECIMAL,
    actual_shipping_costs DECIMAL,
    net_proceeds_calculation DECIMAL,
    final_evaluation_calculation_used DECIMAL,
    terms_calculation DECIMAL,
    customer_payout DECIMAL,
    our_profit DECIMAL
);

CREATE TABLE communicationlogs (
    communicationlog_id SERIAL PRIMARY KEY,
    ownership_id INT REFERENCES ownership(ownership_id),
    owner_communication_history TEXT,
    approval_process TEXT
);

CREATE TABLE performancemetrics (
    performancemetric_id INT PRIMARY KEY,
    item_id INT UNIQUE REFERENCES catalog(item_id),
    total_sales DECIMAL,
    number_of_items_sold INT,
    average_sale_price DECIMAL
);

-- Configuration tables
CREATE TABLE appconfig (
    config_key VARCHAR PRIMARY KEY,
    config_value TEXT NOT NULL,
    data_type VARCHAR NOT NULL DEFAULT 'string'
);

INSERT INTO appconfig (config_key, config_value, data_type)
VALUES ('testdata', 'true', 'string')
ON CONFLICT (config_key) DO UPDATE SET config_value = 'true', data_type = 'string';

CREATE TABLE database_configuration (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

INSERT INTO database_configuration (key, value) VALUES ('isready', '{"isready": "true"}')
ON CONFLICT (key) DO NOTHING;