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
    stock_quantity INTEGER,
    image_url TEXT,
    category VARCHAR(100)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'confirmed',
    billing_name VARCHAR(200) NOT NULL,
    billing_email VARCHAR(150) NOT NULL,
    billing_phone VARCHAR(50) NOT NULL,
    billing_address TEXT NOT NULL,
    payment_brand VARCHAR(50) NOT NULL,
    payment_last4 VARCHAR(4) NOT NULL,
    subtotal NUMERIC(10, 2) NOT NULL,
    shipping NUMERIC(10, 2) NOT NULL,
    tax NUMERIC(10, 2) NOT NULL,
    total NUMERIC(10, 2) NOT NULL,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE order_items (
    order_item_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    product_id INTEGER REFERENCES products(product_id) ON DELETE SET NULL,
    product_name VARCHAR(200) NOT NULL,
    product_category VARCHAR(100),
    product_image_url TEXT,
    unit_price NUMERIC(10, 2) NOT NULL,
    quantity INTEGER NOT NULL,
    line_total NUMERIC(10, 2) NOT NULL
);
