CREATE TABLE users (
    user_id SERIAL PRIMARY KEY,
    name VARCHAR(100),
    tax_id VARCHAR(50),
    email VARCHAR(150),
    home_address TEXT,
    password_hash TEXT,
    role VARCHAR(30) NOT NULL DEFAULT 'customer'
);

CREATE TABLE categories (
    category_id SERIAL PRIMARY KEY,
    name VARCHAR(100) NOT NULL UNIQUE,
    label VARCHAR(200) NOT NULL,
    slug VARCHAR(120) NOT NULL UNIQUE,
    description TEXT DEFAULT '',
    icon VARCHAR(60) DEFAULT '',
    image_url TEXT DEFAULT '',
    is_visible_in_sidebar BOOLEAN NOT NULL DEFAULT TRUE,
    is_visible_on_homepage BOOLEAN NOT NULL DEFAULT FALSE,
    sort_order INTEGER NOT NULL DEFAULT 0,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE item_types (
    item_type_id SERIAL PRIMARY KEY,
    category_id INTEGER NOT NULL REFERENCES categories(category_id) ON DELETE CASCADE,
    value VARCHAR(100) NOT NULL,
    label VARCHAR(200) NOT NULL,
    sort_order INTEGER NOT NULL DEFAULT 0,
    UNIQUE (category_id, value)
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
    category VARCHAR(100),
    item_type VARCHAR(50),
    is_active BOOLEAN NOT NULL DEFAULT TRUE,
    category_id INTEGER REFERENCES categories(category_id) ON DELETE SET NULL,
    discount_percent INTEGER NOT NULL DEFAULT 0 CHECK (discount_percent >= 0 AND discount_percent <= 100)
);

CREATE TABLE reviews (
    review_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    rating INTEGER NOT NULL CHECK (rating >= 1 AND rating <= 5),
    comment TEXT NOT NULL,
    status VARCHAR(20) NOT NULL DEFAULT 'pending',
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);

CREATE TABLE wishlist_items (
    wishlist_item_id SERIAL PRIMARY KEY,
    user_id INTEGER NOT NULL REFERENCES users(user_id) ON DELETE CASCADE,
    product_id INTEGER NOT NULL REFERENCES products(product_id) ON DELETE CASCADE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    UNIQUE (user_id, product_id)
);

CREATE TABLE orders (
    order_id SERIAL PRIMARY KEY,
    order_number VARCHAR(32) UNIQUE NOT NULL,
    user_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    status VARCHAR(30) NOT NULL DEFAULT 'processing',
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

CREATE TABLE deliveries (
    delivery_id SERIAL PRIMARY KEY,
    order_id INTEGER NOT NULL REFERENCES orders(order_id) ON DELETE CASCADE,
    customer_id INTEGER REFERENCES users(user_id) ON DELETE SET NULL,
    delivery_address TEXT NOT NULL,
    total_price NUMERIC(10, 2) NOT NULL,
    is_completed BOOLEAN NOT NULL DEFAULT FALSE,
    created_at TIMESTAMPTZ NOT NULL DEFAULT CURRENT_TIMESTAMP,
    completed_at TIMESTAMPTZ
);
