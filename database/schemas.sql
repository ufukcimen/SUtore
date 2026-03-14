CREATE TABLE users (
    id SERIAL PRIMARY KEY,
    full_name VARCHAR(100) NOT NULL,
    email VARCHAR(120) UNIQUE NOT NULL,
    password_hash TEXT NOT NULL
);


CREATE TABLE user_addresses (
    id SERIAL PRIMARY KEY,
    user_id INT NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    phone VARCHAR(20),
    address_line TEXT,
    city VARCHAR(100),
    country VARCHAR(100)
);


CREATE TABLE categories (
    id SERIAL PRIMARY KEY,
    name VARCHAR(100) UNIQUE NOT NULL,
    description TEXT
);


CREATE TABLE products (
    id SERIAL PRIMARY KEY,
    category_id INT REFERENCES categories(id) ON DELETE SET NULL,
    name VARCHAR(150) NOT NULL,
    model VARCHAR(100),
    serial_number VARCHAR(100) UNIQUE NOT NULL,
    description TEXT,
    stock_quantity INT DEFAULT 0,
    price NUMERIC(10,2) NOT NULL,
    warranty_status VARCHAR(100),
    distributor_info TEXT,
    image_url TEXT,
    is_active BOOLEAN DEFAULT TRUE
);