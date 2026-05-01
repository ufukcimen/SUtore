from __future__ import annotations

import argparse
from dataclasses import dataclass
from pathlib import Path
import sys

from sqlalchemy import select, text

API_DIR = Path(__file__).resolve().parents[1]
sys.path.insert(0, str(API_DIR))

from app.db.session import SessionLocal, engine
from app.models.product import Product
from app.services.product_variants import extract_variant_specs, infer_variant_group


SCHEMA_STATEMENTS = [
    """
    ALTER TABLE products
        ADD COLUMN IF NOT EXISTS variant_group VARCHAR(160),
        ADD COLUMN IF NOT EXISTS ram_capacity_gb INTEGER,
        ADD COLUMN IF NOT EXISTS storage_capacity_gb INTEGER
    """,
    """
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
    END $$
    """,
    """
    CREATE INDEX IF NOT EXISTS idx_products_variant_group
        ON products (variant_group)
        WHERE variant_group IS NOT NULL
    """,
]


@dataclass
class BackfillStats:
    scanned: int = 0
    updated: int = 0
    ram_filled: int = 0
    storage_filled: int = 0
    groups_filled: int = 0


def apply_schema() -> None:
    with engine.begin() as connection:
        for statement in SCHEMA_STATEMENTS:
            connection.execute(text(statement))


def backfill_variants(*, dry_run: bool) -> BackfillStats:
    stats = BackfillStats()

    with SessionLocal() as db:
        products = db.scalars(select(Product).order_by(Product.product_id)).all()
        stats.scanned = len(products)

        for product in products:
            specs = extract_variant_specs(product)
            changed = False

            if product.ram_capacity_gb is None and specs.ram_capacity_gb is not None:
                product.ram_capacity_gb = specs.ram_capacity_gb
                stats.ram_filled += 1
                changed = True

            if product.storage_capacity_gb is None and specs.storage_capacity_gb is not None:
                product.storage_capacity_gb = specs.storage_capacity_gb
                stats.storage_filled += 1
                changed = True

            if not (product.variant_group or "").strip():
                inferred_group = infer_variant_group(product)
                if inferred_group:
                    product.variant_group = inferred_group
                    stats.groups_filled += 1
                    changed = True

            if changed:
                stats.updated += 1

        if dry_run:
            db.rollback()
        else:
            db.commit()

    return stats


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Add and backfill structured product variant fields."
    )
    parser.add_argument(
        "--apply-schema",
        action="store_true",
        help="Apply nullable product variant columns and indexes before backfilling.",
    )
    parser.add_argument(
        "--commit",
        action="store_true",
        help="Persist backfilled values. Without this flag, runs as a dry run.",
    )
    args = parser.parse_args()

    if args.apply_schema:
        apply_schema()
        print("schema: applied")

    stats = backfill_variants(dry_run=not args.commit)
    mode = "committed" if args.commit else "dry-run"
    print(
        f"{mode}: scanned={stats.scanned} updated={stats.updated} "
        f"ram_filled={stats.ram_filled} storage_filled={stats.storage_filled} "
        f"groups_filled={stats.groups_filled}"
    )


if __name__ == "__main__":
    main()
