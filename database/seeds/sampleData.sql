-- Updated seed data to match new data structures

-- Insert items
INSERT INTO items (name, price, description, manufacturer, model, serial_number, product_page_link, dimension_x, dimension_y, dimension_z, weight, condition, category, sku_barcode, images, specifications, created_at) VALUES 
('Vintage Camera', 150.00, 'A classic vintage camera', 'Canon', 'AE-1', '12345', 'http://example.com/camera', 10, 5, 3, 1.2, 'Used', 'Electronics', 'CAM12345', '["http://example.com/camera.jpg"]', '35mm film camera', '2023-10-01'),
('Antique Vase', 75.00, 'A beautiful antique vase', 'Unknown', 'N/A', '67890', 'http://example.com/vase', 8, 8, 12, 2.5, 'Good', 'Home Decor', 'VAS67890', '["http://example.com/vase.jpg"]', 'Porcelain vase from the 19th century', '2023-10-05');

-- Insert ownership records
INSERT INTO ownership (ownershipType, contact_firstName, contact_lastName, contact_address, contact_telephone, contact_email, companyDetails_companyName, companyDetails_companyAddress, companyDetails_companyTelephone, companyDetails_companyEmail, companyDetails_assignedContact_firstName, companyDetails_assignedContact_lastName, companyDetails_assignedContact_telephone, companyDetails_assignedContact_email) VALUES 
('Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Company', NULL, NULL, NULL, NULL, NULL, 'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com');

-- Insert sales records
INSERT INTO sales (item, price, soldDate) VALUES 
('Vintage Camera', 150.00, '2023-10-01'),
('Antique Vase', 75.00, '2023-10-05'),
('Collectible Action Figure', 30.00, '2023-10-10'),
('Old Vinyl Record', 20.00, '2023-10-15'),
('Rare Book', 100.00, '2023-10-20');