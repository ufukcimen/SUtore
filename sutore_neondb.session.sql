ALTER TABLE products
    ADD COLUMN IF NOT EXISTS variant_group VARCHAR(160),
    ADD COLUMN IF NOT EXISTS ram_capacity_gb INTEGER,
    ADD COLUMN IF NOT EXISTS storage_capacity_gb INTEGER;