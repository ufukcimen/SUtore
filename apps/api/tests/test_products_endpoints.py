from decimal import Decimal

from app.api.v1.endpoints.products import list_products
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
