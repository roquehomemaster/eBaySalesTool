-- [REMOVED 2025-05-20] CREATE TABLE "users" (
--     id SERIAL PRIMARY KEY,
--     username VARCHAR(50) NOT NULL UNIQUE,
--     password VARCHAR(255) NOT NULL,
--     email VARCHAR(100) NOT NULL UNIQUE,
--     created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
-- );

CREATE TABLE IF NOT EXISTS "sales" (
    id SERIAL PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    soldDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner VARCHAR(255) NOT NULL,
    negotiatedTerms TEXT
);

CREATE TABLE IF NOT EXISTS "product_research" (
    id SERIAL PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    sold_price DECIMAL(10, 2),
    research_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES "users"(id)
);

-- Ensure SellingItem table is created with correct schema and case-sensitive name
DROP TABLE IF EXISTS "SellingItem" CASCADE;

CREATE TABLE IF NOT EXISTS "SellingItem" (
    id SERIAL PRIMARY KEY,
    description VARCHAR(255) NOT NULL,
    manufacturer VARCHAR(255) NOT NULL,
    model VARCHAR(255) NOT NULL,
    serial_number VARCHAR(255) NOT NULL,
    product_page_link VARCHAR(255),
    dimensions JSON,
    weight DOUBLE PRECISION,
    condition VARCHAR(255),
    category VARCHAR(255),
    sku_barcode VARCHAR(255) UNIQUE,
    images TEXT[],
    specifications TEXT,
    warranty_information TEXT,
    compliance_and_certifications TEXT,
    manufacturer_info TEXT
);

-- Table for ownership details
CREATE TABLE IF NOT EXISTS "Ownership" (
    id SERIAL PRIMARY KEY,
    ownership_type VARCHAR(50) NOT NULL,
    first_name VARCHAR(100),
    last_name VARCHAR(100),
    address TEXT,
    telephone VARCHAR(20),
    email VARCHAR(100),
    company_name VARCHAR(255),
    company_address TEXT,
    company_telephone VARCHAR(20),
    company_email VARCHAR(100),
    assigned_contact_first_name VARCHAR(100),
    assigned_contact_last_name VARCHAR(100),
    assigned_contact_telephone VARCHAR(20),
    assigned_contact_email VARCHAR(100)
);

-- Table for ownership agreements
CREATE TABLE IF NOT EXISTS "OwnershipAgreements" (
    id SERIAL PRIMARY KEY,
    ownership_id INT REFERENCES "Ownership"(id),
    commission_percentage DECIMAL(5, 2),
    minimum_sale_price DECIMAL(10, 2),
    duration_of_agreement INT,
    renewal_terms TEXT
);

-- Table for history logs
CREATE TABLE IF NOT EXISTS "HistoryLogs" (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES "SellingItem"(id),
    change_type VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for sales history
CREATE TABLE IF NOT EXISTS "SalesHistory" (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES "SellingItem"(id),
    sales_channel VARCHAR(255),
    return_history TEXT,
    customer_feedback TEXT
);

-- Table for eBay-specific information
CREATE TABLE IF NOT EXISTS "eBayInfo" (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES "SellingItem"(id),
    listing_status VARCHAR(50),
    watchers INT,
    item_condition_description TEXT,
    payment_method VARCHAR(255),
    shipping_method TEXT
);

-- Table for customer details
CREATE TABLE IF NOT EXISTS "CustomerDetails" (
    id SERIAL PRIMARY KEY,
    purchase_date DATE,
    purchase_method VARCHAR(255),
    shipping_preferences TEXT
);

-- Table for financial tracking
CREATE TABLE IF NOT EXISTS "FinancialTracking" (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES "SellingItem"(id),
    net_proceeds_calculation TEXT
);

-- Table for communication logs
CREATE TABLE IF NOT EXISTS "CommunicationLogs" (
    id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES "Ownership"(id),
    owner_communication_history TEXT,
    approval_process TEXT
);

-- Table for performance metrics
CREATE TABLE IF NOT EXISTS "PerformanceMetrics" (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES "SellingItem"(id),
    total_sales DECIMAL(10, 2),
    number_of_items_sold INT,
    average_sale_price DECIMAL(10, 2)
);

-- Ensure AppConfig table exists and insert testdata flag for seeding
CREATE TABLE IF NOT EXISTS "AppConfig" (
    config_key VARCHAR(255) PRIMARY KEY,
    config_value TEXT NOT NULL,
    data_type VARCHAR(50) NOT NULL DEFAULT 'string'
);

-- Insert or update the testdata flag to true to enable seeding
INSERT INTO "AppConfig" (config_key, config_value, data_type)
VALUES ('testdata', 'true', 'string')
ON CONFLICT (config_key) DO UPDATE SET config_value = 'true', data_type = 'string';

-- Add configuration table to the database schema
CREATE SCHEMA IF NOT EXISTS "database";
CREATE TABLE IF NOT EXISTS "database"."configuration" (
    key TEXT PRIMARY KEY,
    value JSONB NOT NULL
);

-- Insert default isready record
INSERT INTO "database"."configuration" (key, value) VALUES ('isready', '{"isready": "true"}')
ON CONFLICT (key) DO NOTHING;

-- Add a configuration topic to signal readiness
INSERT INTO "database"."configuration" (key, value) VALUES ('01_Ready', '{"isready": "false"}')
ON CONFLICT (key) DO UPDATE SET value = '{"isready": "false"}';

-- Table for item master
CREATE TABLE IF NOT EXISTS "ItemMaster" (
    id SERIAL PRIMARY KEY,
    name VARCHAR(255) NOT NULL,
    description TEXT,
    price DECIMAL(10, 2),
    stock INT DEFAULT 0,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

DO
$$
BEGIN
   IF NOT EXISTS (
      SELECT FROM pg_catalog.pg_roles
      WHERE rolname = 'postgres') THEN
      CREATE ROLE postgres LOGIN PASSWORD 'your_password';
   END IF;
END
$$;

-- Ensure the user has the necessary privileges
GRANT ALL PRIVILEGES ON DATABASE ebay_sales_tool TO postgres;

-- Signal that 01_init.sql has completed
UPDATE "database"."configuration" SET value = '{"isready": "true"}' WHERE key = '01_Ready';