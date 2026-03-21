CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    tax_id VARCHAR(50),
    email VARCHAR(150),
    home_address TEXT,
    password_hash TEXT
);

CREATE TABLE products (
    product_id SERIAL PRIMARY KEY,
    name VARCHAR(200),
    model VARCHAR(100),
    serial_number VARCHAR(100),
    description TEXT,
    price NUMERIC(10, 2),
    warranty_status BOOLEAN,
    distributor VARCHAR(200),
    stock_quantity INTEGER
);