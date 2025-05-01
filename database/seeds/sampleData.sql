-- Updated seed data to match new data structures

-- Insert items
INSERT INTO items (name, price, description, manufacturer, model, serial_number, product_page_link, dimension_x, dimension_y, dimension_z, weight, condition, category, sku_barcode, images, specifications, created_at) VALUES 
('Vintage Camera', 150.00, 'A classic vintage camera', 'Canon', 'AE-1', '12345', 'http://example.com/camera', 10, 5, 3, 1.2, 'Used', 'Electronics', 'CAM12345', '["http://example.com/camera.jpg"]', '35mm film camera', '2023-10-01'),
('Antique Vase', 75.00, 'A beautiful antique vase', 'Unknown', 'N/A', '67890', 'http://example.com/vase', 8, 8, 12, 2.5, 'Good', 'Home Decor', 'VAS67890', '["http://example.com/vase.jpg"]', 'Porcelain vase from the 19th century', '2023-10-05'),
('Sample Item 1', 'Brand A', 'Model X', 'SN12345', 'http://example.com/item1', 10, 10, 10, 1.5, 'New', 'Electronics', 'SKU001', '["image1.jpg", "image2.jpg"]', 'Specs for Item 1', '2023-10-10'),
('Sample Item 2', 'Brand B', 'Model Y', 'SN67890', 'http://example.com/item2', 20, 20, 20, 2.0, 'Used', 'Home Appliances', 'SKU002', '["image3.jpg", "image4.jpg"]', 'Specs for Item 2', '2023-10-15');

-- Insert ownership records
INSERT INTO ownership (ownershipType, contact_firstName, contact_lastName, contact_address, contact_telephone, contact_email, companyDetails_companyName, companyDetails_companyAddress, companyDetails_companyTelephone, companyDetails_companyEmail, companyDetails_assignedContact_firstName, companyDetails_assignedContact_lastName, companyDetails_assignedContact_telephone, companyDetails_assignedContact_email) VALUES 
('Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Company', NULL, NULL, NULL, NULL, NULL, 'Acme Corp', '456 Elm St', '555-5678', 'info@acmecorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@acmecorp.com'),
('Self', 'John', 'Doe', '123 Main St', '555-1234', 'john.doe@example.com', NULL, NULL, NULL, NULL, NULL, NULL, NULL, NULL),
('Company', NULL, NULL, NULL, NULL, NULL, 'Tech Corp', '456 Tech Ave', '555-5678', 'info@techcorp.com', 'Jane', 'Smith', '555-8765', 'jane.smith@techcorp.com');

-- Insert ownership agreements
INSERT INTO OwnershipAgreements (ownership_id, commission_percentage, minimum_sale_price, duration_of_agreement, renewal_terms) VALUES
(1, 10.0, 100.0, 30, 'Renew automatically'),
(2, 15.0, 200.0, 60, 'Manual renewal required');

-- Insert history logs
INSERT INTO HistoryLogs (item_id, change_type, timestamp) VALUES
(1, 'Price updated', '2025-04-01 10:00:00'),
(2, 'Description updated', '2025-04-02 11:00:00');

-- Insert sales records
INSERT INTO sales (item, price, soldDate) VALUES 
('Vintage Camera', 150.00, '2023-10-01'),
('Antique Vase', 75.00, '2023-10-05'),
('Collectible Action Figure', 30.00, '2023-10-10'),
('Old Vinyl Record', 20.00, '2023-10-15'),
('Rare Book', 100.00, '2023-10-20');

-- Insert sales history
INSERT INTO SalesHistory (item_id, sales_channel, return_history, customer_feedback) VALUES
(1, 'eBay', 'No returns', 'Great product!'),
(2, 'Website', 'Returned once', 'Good quality');

-- Insert eBay-specific information
INSERT INTO eBayInfo (item_id, listing_status, watchers, item_condition_description, payment_method, shipping_method) VALUES
(1, 'Active', 5, 'Brand new in box', 'PayPal', 'Standard shipping'),
(2, 'Ended', 2, 'Used but in good condition', 'Credit Card', 'Express shipping');

-- Insert customer details
INSERT INTO CustomerDetails (purchase_date, purchase_method, shipping_preferences) VALUES
('2025-04-15', 'Credit Card', 'Standard shipping'),
('2025-04-20', 'PayPal', 'Express shipping');

-- Insert financial tracking data
INSERT INTO FinancialTracking (item_id, net_proceeds_calculation) VALUES
(1, 'Sale price: $100, eBay fees: $10, Shipping: $5, Net: $85'),
(2, 'Sale price: $200, eBay fees: $20, Shipping: $10, Net: $170');

-- Insert communication logs
INSERT INTO CommunicationLogs (owner_id, communication_history, approval_process) VALUES
(1, 'Discussed pricing on 2025-04-01', 'Approved by email'),
(2, 'Negotiated terms on 2025-04-02', 'Approved in person');

-- Insert performance metrics
INSERT INTO PerformanceMetrics (item_id, total_sales, number_of_items_sold, average_sale_price) VALUES
(1, 500.0, 5, 100.0),
(2, 400.0, 2, 200.0);