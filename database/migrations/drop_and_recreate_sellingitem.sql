DROP TABLE IF EXISTS "SellingItem" CASCADE;

CREATE TABLE "SellingItem" (
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
