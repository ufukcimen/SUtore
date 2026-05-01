from decimal import Decimal

from app.api.v1.endpoints.products import get_product_variants, list_products
from app.models.product import Product


def seed_products(db_session) -> None:
    db_session.add_all(
        [
            Product(
                product_id=1,
                name="GeForce RTX 5090",
                model="RTX 5090 FE",
                description="Flagship GPU for 4K gaming",
                price=Decimal("1999.99"),
                stock_quantity=3,
                category="GPU",
                item_type="gpu",
                is_active=True,
            ),
            Product(
                product_id=2,
                name="MSI Gaming Trio",
                model="RTX 5080",
                description="High-end RTX graphics card",
                price=Decimal("1499.99"),
                stock_quantity=5,
                category="GPU",
                item_type="gpu",
                is_active=True,
            ),
            Product(
                product_id=3,
                name="Ryzen 9 9950X",
                model="9950X",
                description="Desktop CPU",
                price=Decimal("649.99"),
                stock_quantity=9,
                category="CPU",
                item_type="cpu",
                is_active=True,
            ),
            Product(
                product_id=4,
                name="Archived GPU",
                model="RTX 4090",
                description="Inactive product should never be listed",
                price=Decimal("999.99"),
                stock_quantity=1,
                category="GPU",
                item_type="gpu",
                is_active=False,
            ),
        ]
    )
    db_session.commit()


def test_category_filter_is_case_insensitive_and_excludes_inactive_products(db_session) -> None:
    seed_products(db_session)

    results = list_products(
        category="gpu",
        category_id=None,
        item_type=None,
        price_min=None,
        price_max=None,
        search=None,
        limit=None,
        offset=0,
        db=db_session,
    )

    assert [product.product_id for product in results] == [1, 2]


def test_search_matches_partial_keywords_case_insensitively_and_trims_whitespace(db_session) -> None:
    seed_products(db_session)

    results = list_products(
        category=None,
        category_id=None,
        item_type=None,
        price_min=None,
        price_max=None,
        search="  rtx  ",
        limit=None,
        offset=0,
        db=db_session,
    )

    assert [product.product_id for product in results] == [1, 2]


def test_search_returns_an_empty_list_when_no_products_match(db_session) -> None:
    seed_products(db_session)

    results = list_products(
        category=None,
        category_id=None,
        item_type=None,
        price_min=None,
        price_max=None,
        search="Threadripper Laptop",
        limit=None,
        offset=0,
        db=db_session,
    )

    assert results == []


def test_price_range_filter_returns_only_products_inside_the_bounds(db_session) -> None:
    seed_products(db_session)

    results = list_products(
        category=None,
        category_id=None,
        item_type=None,
        price_min=Decimal("600.00"),
        price_max=Decimal("1600.00"),
        search=None,
        limit=None,
        offset=0,
        db=db_session,
    )

    assert [product.product_id for product in results] == [2, 3]


def seed_laptop_variants(db_session) -> None:
    db_session.add_all(
        [
            Product(
                product_id=10,
                name="Lenovo ThinkBook 14 G6 16GB RAM 512GB SSD",
                model="TB14-G6",
                description="Intel Core i7 laptop with 16GB RAM and 512GB SSD.",
                price=Decimal("899.99"),
                stock_quantity=4,
                category="laptop",
                item_type="business_laptop",
                is_active=True,
            ),
            Product(
                product_id=11,
                name="Lenovo ThinkBook 14 G6 32GB RAM 1TB SSD",
                model="TB14-G6",
                description="Intel Core i7 laptop with 32GB RAM and 1TB SSD.",
                price=Decimal("1099.99"),
                stock_quantity=3,
                category="laptop",
                item_type="business_laptop",
                is_active=True,
            ),
            Product(
                product_id=12,
                name="Lenovo ThinkBook 15 G6 32GB RAM 1TB SSD",
                model="TB15-G6",
                description="Larger laptop with 32GB RAM and 1TB SSD.",
                price=Decimal("1199.99"),
                stock_quantity=2,
                category="laptop",
                item_type="business_laptop",
                is_active=True,
            ),
        ]
    )
    db_session.commit()


def test_list_products_collapses_ram_and_ssd_variants(db_session) -> None:
    seed_laptop_variants(db_session)

    results = list_products(
        category="laptop",
        category_id=None,
        item_type=None,
        price_min=None,
        price_max=None,
        search=None,
        limit=None,
        offset=0,
        db=db_session,
    )

    assert [product.product_id for product in results] == [10, 12]


def test_product_variants_include_capacities_and_prices(db_session) -> None:
    seed_laptop_variants(db_session)

    variants = get_product_variants(product_id=10, db=db_session)

    assert [variant.product_id for variant in variants] == [10, 11]
    assert [(variant.ram_capacity, variant.storage_capacity) for variant in variants] == [
        ("16 GB", "512 GB"),
        ("32 GB", "1 TB"),
    ]
    assert [variant.price for variant in variants] == [
        Decimal("899.99"),
        Decimal("1099.99"),
    ]


def seed_hydroc_variants(db_session) -> None:
    db_session.add_all(
        [
            Product(
                product_id=2813,
                name="HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, NVIDIA RTX 5090, 4TB Gen 5 SSD, 48GB 6400MHz RAM",
                model="2813",
                serial_number="eluktronics-2813",
                description="Intel Core Ultra 9 275HX, NVIDIA RTX 5090, 4TB Gen 5 SSD, 48GB 6400MHz RAM",
                price=Decimal("4489.99"),
                distributor="Eluktronics",
                stock_quantity=0,
                category="laptop",
                item_type="gaming_laptop",
                is_active=True,
            ),
            Product(
                product_id=2816,
                name="HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, NVIDIA RTX 5090, 4TB Gen 5 SSD, 96GB 6400MHz RAM",
                model="2816",
                serial_number="eluktronics-2816",
                description="Intel Core Ultra 9 275HX, NVIDIA RTX 5090, 4TB Gen 5 SSD, 96GB 6400MHz RAM",
                price=Decimal("4989.99"),
                distributor="Eluktronics",
                stock_quantity=0,
                category="laptop",
                item_type="gaming_laptop",
                is_active=True,
            ),
            Product(
                product_id=2812,
                name="HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, NVIDIA RTX 5080, 4TB SSD, 48GB 6400MHz RAM",
                model="2812",
                serial_number="eluktronics-2812",
                description="Intel Core Ultra 9 275HX, NVIDIA RTX 5080, 4TB SSD, 48GB 6400MHz RAM",
                price=Decimal("3299.99"),
                distributor="Eluktronics",
                stock_quantity=0,
                category="laptop",
                item_type="gaming_laptop",
                is_active=True,
            ),
            Product(
                product_id=2911,
                name="HYDROC-16 G2 Ultra Pro Edition - Intel Core Ultra 9 275HX, NVIDIA RTX 5080, 4TB Gen 5 SSD, 96GB 6400MHz RAM",
                model="2911",
                serial_number="eluktronics-2911",
                description="Intel Core Ultra 9 275HX, NVIDIA RTX 5080, 4TB Gen 5 SSD, 96GB 6400MHz RAM",
                price=Decimal("3699.99"),
                distributor="Eluktronics",
                stock_quantity=0,
                category="laptop",
                item_type="gaming_laptop",
                is_active=True,
            ),
        ]
    )
    db_session.commit()


def test_hydroc_scraped_id_variants_collapse_and_expose_ram_options(db_session) -> None:
    seed_hydroc_variants(db_session)

    results = list_products(
        category="laptop",
        category_id=None,
        item_type=None,
        price_min=None,
        price_max=None,
        search=None,
        limit=None,
        offset=0,
        db=db_session,
    )
    variants = get_product_variants(product_id=2813, db=db_session)

    assert [product.product_id for product in results] == [2812, 2813]
    assert [variant.product_id for variant in variants] == [2813, 2816]
    assert [(variant.ram_capacity, variant.storage_capacity, variant.price) for variant in variants] == [
        ("48 GB", "4 TB", Decimal("4489.99")),
        ("96 GB", "4 TB", Decimal("4989.99")),
    ]

    rtx_5080_variants = get_product_variants(product_id=2812, db=db_session)
    assert [variant.product_id for variant in rtx_5080_variants] == [2812, 2911]


def test_structured_variant_fields_group_products_without_capacity_text(db_session) -> None:
    db_session.add_all(
        [
            Product(
                product_id=30,
                name="OEM Falcon Build",
                model="FALCON-A",
                description="Same CPU and GPU configuration.",
                price=Decimal("1299.99"),
                stock_quantity=4,
                category="desktop",
                item_type="prebuilt_pc",
                variant_group="oem-falcon-rtx4070",
                ram_capacity_gb=32,
                storage_capacity_gb=1024,
                is_active=True,
            ),
            Product(
                product_id=31,
                name="OEM Falcon Build",
                model="FALCON-B",
                description="Same CPU and GPU configuration.",
                price=Decimal("1499.99"),
                stock_quantity=2,
                category="desktop",
                item_type="prebuilt_pc",
                variant_group="oem-falcon-rtx4070",
                ram_capacity_gb=64,
                storage_capacity_gb=2048,
                is_active=True,
            ),
        ]
    )
    db_session.commit()

    results = list_products(
        category="desktop",
        category_id=None,
        item_type=None,
        price_min=None,
        price_max=None,
        search=None,
        limit=None,
        offset=0,
        db=db_session,
    )
    variants = get_product_variants(product_id=30, db=db_session)

    assert [product.product_id for product in results] == [30]
    assert [(variant.product_id, variant.ram_capacity, variant.storage_capacity) for variant in variants] == [
        (30, "32 GB", "1 TB"),
        (31, "64 GB", "2 TB"),
    ]
