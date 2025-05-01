CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(50) NOT NULL UNIQUE,
    password VARCHAR(255) NOT NULL,
    email VARCHAR(100) NOT NULL UNIQUE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE sales (
    id SERIAL PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    price DECIMAL(10, 2) NOT NULL,
    soldDate TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    owner VARCHAR(255) NOT NULL,
    negotiatedTerms TEXT
);

CREATE TABLE product_research (
    id SERIAL PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    sold_price DECIMAL(10, 2),
    research_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id)
);

-- Table for storing basic item information
CREATE TABLE Items (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    manufacturer VARCHAR(255) DEFAULT 'Unknown',
    model VARCHAR(255) DEFAULT 'Unknown',
    serial_number VARCHAR(255) DEFAULT 'Unknown',
    dimensions VARCHAR(255),
    weight DECIMAL(10, 2),
    condition VARCHAR(50),
    category VARCHAR(100),
    sku_barcode VARCHAR(100),
    images TEXT[],
    specifications TEXT,
    product_page_link TEXT
);

-- Table for ownership details
CREATE TABLE Ownership (
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
CREATE TABLE OwnershipAgreements (
    id SERIAL PRIMARY KEY,
    ownership_id INT REFERENCES Ownership(id),
    commission_percentage DECIMAL(5, 2),
    minimum_sale_price DECIMAL(10, 2),
    duration_of_agreement INT,
    renewal_terms TEXT
);

-- Table for history logs
CREATE TABLE HistoryLogs (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES Items(id),
    change_type VARCHAR(255),
    timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Table for sales history
CREATE TABLE SalesHistory (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES Items(id),
    sales_channel VARCHAR(255),
    return_history TEXT,
    customer_feedback TEXT
);

-- Table for eBay-specific information
CREATE TABLE eBayInfo (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES Items(id),
    listing_status VARCHAR(50),
    watchers INT,
    item_condition_description TEXT,
    payment_method VARCHAR(255),
    shipping_method TEXT
);

-- Table for customer details
CREATE TABLE CustomerDetails (
    id SERIAL PRIMARY KEY,
    purchase_date DATE,
    purchase_method VARCHAR(255),
    shipping_preferences TEXT
);

-- Table for financial tracking
CREATE TABLE FinancialTracking (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES Items(id),
    net_proceeds_calculation TEXT
);

-- Table for communication logs
CREATE TABLE CommunicationLogs (
    id SERIAL PRIMARY KEY,
    owner_id INT REFERENCES Ownership(id),
    communication_history TEXT,
    approval_process TEXT
);

-- Table for performance metrics
CREATE TABLE PerformanceMetrics (
    id SERIAL PRIMARY KEY,
    item_id INT REFERENCES Items(id),
    total_sales DECIMAL(10, 2),
    number_of_items_sold INT,
    average_sale_price DECIMAL(10, 2)
);

-- Table for application configuration
CREATE TABLE AppConfig (
    id SERIAL PRIMARY KEY,
    config_key VARCHAR(255) NOT NULL UNIQUE, -- Unique key for the configuration
    config_value TEXT NOT NULL,              -- Value stored as text for flexibility
    data_type VARCHAR(50) NOT NULL,          -- Data type (e.g., boolean, string, number, JSON)
    scope VARCHAR(100) DEFAULT 'global',     -- Scope (e.g., global, page-specific)
    environment VARCHAR(50) DEFAULT 'all',  -- Environment (e.g., development, production)
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP -- Last updated timestamp
);