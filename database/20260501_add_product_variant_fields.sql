ALTER TABLE products
    ADD COLUMN IF NOT EXISTS variant_group VARCHAR(160),
    ADD COLUMN IF NOT EXISTS ram_capacity_gb INTEGER,
    ADD COLUMN IF NOT EXISTS storage_capacity_gb INTEGER;

DO $$
BEGIN
    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_ram_capacity_gb_nonnegative'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_ram_capacity_gb_nonnegative
            CHECK (ram_capacity_gb IS NULL OR ram_capacity_gb >= 0);
    END IF;

    IF NOT EXISTS (
        SELECT 1
        FROM pg_constraint
        WHERE conname = 'products_storage_capacity_gb_nonnegative'
    ) THEN
        ALTER TABLE products
            ADD CONSTRAINT products_storage_capacity_gb_nonnegative
            CHECK (storage_capacity_gb IS NULL OR storage_capacity_gb >= 0);
    END IF;
END $$;

CREATE INDEX IF NOT EXISTS idx_products_variant_group
    ON products (variant_group)
    WHERE variant_group IS NOT NULL;
