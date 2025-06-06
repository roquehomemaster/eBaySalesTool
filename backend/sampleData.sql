-- Updated users insert to handle duplicate keys
INSERT INTO users (username, password, email) VALUES
('john_doe', 'hashed_password_123', 'john.doe@example.com'),
('jane_smith', 'hashed_password_456', 'jane.smith@example.com')
ON CONFLICT (username) DO UPDATE SET password = EXCLUDED.password, email = EXCLUDED.email;

-- Update dimensions to JSON format and add missing manufacturer_info field
INSERT INTO "Item" (description, manufacturer, manufacturer_info, model, serial_number, dimensions, weight, condition, category, sku_barcode, images, specifications, product_page_link, warranty_information, compliance_and_certifications) VALUES
('Vintage Camera', 'Canon', 'Canon Inc.', 'AE-1', '12345', '{"x": 10, "y": 5, "z": 3}', 1.2, 'Used', 'Electronics', 'CAM12345', '{"http://example.com/camera.jpg"}', '35mm film camera', 'http://example.com/camera', '1-year limited warranty', 'FCC certified'),
('Antique Vase', 'Unknown', 'Handcrafted in 19th century', 'N/A', '67890', '{"x": 8, "y": 8, "z": 12}', 2.5, 'Good', 'Home Decor', 'VAS67890', '{"http://example.com/vase.jpg"}', 'Porcelain vase from the 19th century', 'http://example.com/vase', 'No warranty', 'None');

-- Insert sample ownerships
INSERT INTO ownership (ownership_type, first_name, last_name, address, telephone, email, company_name, company_address, company_telephone, company_email, assigned_contact_first_name, assigned_contact_last_name, assigned_contact_telephone, assigned_contact_email) VALUES
('Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Company', NULL, NULL, NULL, NULL, NULL, 'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com');

-- Insert sample sales
INSERT INTO sales (item, price, soldDate, owner, negotiatedTerms) VALUES
('Vintage Camera', 150.00, '2023-10-01', 'John Doe', 'Negotiated 10% discount'),
('Antique Vase', 75.00, '2023-10-05', 'Acme Corp', 'Full price agreed');

-- Updated AppConfig insert to handle duplicate keys
INSERT INTO AppConfig (config_key, config_value, data_type) VALUES
('testdata', 'true', 'boolean'),
('maintenance_mode', 'false', 'boolean')
ON CONFLICT (config_key) DO UPDATE SET config_value = EXCLUDED.config_value;