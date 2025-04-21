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
    sold_date TIMESTAMP NOT NULL,
    user_id INT REFERENCES users(id),
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE product_research (
    id SERIAL PRIMARY KEY,
    item VARCHAR(255) NOT NULL,
    sold_price DECIMAL(10, 2),
    research_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    user_id INT REFERENCES users(id)
);

-- Create the items table to store item information
CREATE TABLE items (
    id SERIAL PRIMARY KEY,
    description TEXT NOT NULL,
    manufacturer_info VARCHAR(255),
    size VARCHAR(100),
    weight DECIMAL(10, 2),
    condition VARCHAR(50),
    category VARCHAR(100),
    sku_barcode VARCHAR(100) UNIQUE,
    images TEXT[],
    specifications TEXT,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);