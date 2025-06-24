-- Wait for the `01_Ready` configuration topic to be set to true
DO $$
DECLARE
    start_time TIMESTAMP := clock_timestamp();
    timeout_interval INTERVAL := INTERVAL '10 minutes';
    is_ready BOOLEAN := FALSE;
BEGIN
    LOOP
        -- Check if the configuration topic exists and is set to true
        SELECT (value->>'isready')::BOOLEAN INTO is_ready
        FROM "database"."configuration"
        WHERE key = '01_Ready';

        -- Exit the loop if the topic is set to true
        IF is_ready THEN
            EXIT;
        END IF;

        -- Exit with an error if the timeout is reached
        IF clock_timestamp() - start_time > timeout_interval THEN
            RAISE 'Timeout: Configuration topic `01_Ready` not set to true within 10 minutes';
        END IF;

        -- Sleep for 5 seconds before checking again
        PERFORM pg_sleep(5);
    END LOOP;
END $$;

-- Updated users insert to handle duplicate keys
INSERT INTO "users" (username, password, email) VALUES
('john_doe', 'hashed_password_123', 'john.doe@example.com'),
('jane_smith', 'hashed_password_456', 'jane.smith@example.com')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, email = EXCLUDED.email;

-- Update seed data for `SellingItem`
INSERT INTO "SellingItem" (description, manufacturer, manufacturer_info, model, serial_number, dimensions, weight, condition, category, sku_barcode, images, specifications, product_page_link, warranty_information, compliance_and_certifications) VALUES
('Vintage Camera', 'Canon', 'Canon Inc.', 'AE-1', '12345', '{"x": 10, "y": 5, "z": 3}', 1.2, 'Used', 'Electronics', 'CAM12345', '{"http://example.com/camera.jpg"}', '35mm film camera', 'http://example.com/camera', '1-year limited warranty', 'FCC certified'),
('Antique Vase', 'Unknown', 'Handcrafted in 19th century', 'N/A', '67890', '{"x": 8, "y": 8, "z": 12}', 2.5, 'Good', 'Home Decor', 'VAS67890', '{"http://example.com/vase.jpg"}', 'Porcelain vase from the 19th century', 'http://example.com/vase', 'No warranty', 'None');

-- Insert sample data into SellingItem table (ensure unique SKUs)
INSERT INTO "SellingItem" (description, manufacturer, model, serial_number, product_page_link, dimensions, weight, condition, category, sku_barcode, images, specifications, warranty_information, compliance_and_certifications, manufacturer_info)
VALUES
('Sample Item 1', 'Manufacturer A', 'Model X', 'SN12345', 'http://example.com/product1', '{"length": 10, "width": 5, "height": 2}', 1.5, 'New', 'Category A', 'SKU54321', ARRAY['image1.jpg', 'image2.jpg'], 'Specifications for item 1', '1 year warranty', 'Certifications for item 1', 'Manufacturer info for item 1');

-- Update seed data for `ItemMaster`
INSERT INTO "ItemMaster" (name, description, price, stock, created_at) VALUES
('Sample Item 1', 'Description for item 1', 19.99, 100, CURRENT_TIMESTAMP),
('Sample Item 2', 'Description for item 2', 29.99, 50, CURRENT_TIMESTAMP);

-- Insert sample ownerships
INSERT INTO "Ownership" (ownership_type, first_name, last_name, address, telephone, email, company_name, company_address, company_telephone, company_email, assigned_contact_first_name, assigned_contact_last_name, assigned_contact_telephone, assigned_contact_email) VALUES
('Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Company', NULL, NULL, NULL, NULL, NULL, 'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com');

-- Insert sample sales
INSERT INTO "sales" (item, price, soldDate, owner, negotiatedTerms) VALUES
('Vintage Camera', 150.00, '2023-10-01', 'John Doe', 'Negotiated 10% discount'),
('Antique Vase', 200.00, '2023-10-02', 'Acme Corp', 'No negotiation.');

-- Updated AppConfig insert to handle duplicate keys
INSERT INTO "AppConfig" (config_key, config_value, data_type) VALUES
('testdata', 'true', 'boolean'),
('maintenance_mode', 'false', 'boolean')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;