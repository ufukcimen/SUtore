from decimal import Decimal

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from random import sample

from app.db.session import get_db
from app.models.order import OrderItem
from app.models.product import Product
from app.models.review import Review
from app.schemas.product import ProductCreate, ProductFilterOptionsRead, ProductRead, ProductVariantRead
from app.services.product_filters import (
    build_filter_options,
    extract_product_filter_specs,
    normalize_filter_value,
)
from app.services.product_variants import (
    collapse_variant_products,
    extract_variant_specs,
    matching_variant_products,
)

router = APIRouter()


def _read_variant(product: Product) -> ProductVariantRead:
    specs = extract_variant_specs(product)
    data = ProductRead.model_validate(product).model_dump()
    data.update(
        ram_capacity=specs.ram_capacity,
        ram_capacity_gb=specs.ram_capacity_gb,
        storage_capacity=specs.storage_capacity,
        storage_capacity_gb=specs.storage_capacity_gb,
    )
    return ProductVariantRead(**data)


def _csv_values(value: str | None) -> set[str]:
    if not isinstance(value, str):
        return set()

    return {
        normalize_filter_value(part)
        for part in value.split(",")
        if normalize_filter_value(part)
    }


def _normalize_gpu_filter_value(value: str | None) -> str:
    normalized = normalize_filter_value(value)
    return normalized.replace("nvidia geforce ", "nvidia ")


def _csv_gpu_values(value: str | None) -> set[str]:
    if not isinstance(value, str):
        return set()

    return {
        _normalize_gpu_filter_value(part)
        for part in value.split(",")
        if _normalize_gpu_filter_value(part)
    }


def _csv_int_values(value: str | None) -> set[int]:
    values: set[int] = set()
    if not isinstance(value, str):
        return values

    for part in value.split(","):
        normalized = part.strip()
        if not normalized:
            continue
        try:
            values.add(int(normalized))
        except ValueError:
            continue

    return values


def _truthy_filter(value: bool | str | None) -> bool:
    if isinstance(value, bool):
        return value
    if isinstance(value, str):
        return value.strip().lower() in {"1", "true", "yes", "on"}
    return False


def _int_query_value(value: int | None) -> int | None:
    return value if isinstance(value, int) else None


def _number_query_value(value: float | Decimal | None) -> float | Decimal | None:
    return value if isinstance(value, (int, float, Decimal)) else None


def _apply_spec_filters(
    products: list[Product],
    *,
    brand: str | None,
    cpu: str | None,
    gpu: str | None,
    ram_capacity_gb: str | None,
    storage_capacity_gb: str | None,
    discounted: bool | str | None,
) -> list[Product]:
    selected_brands = _csv_values(brand)
    selected_cpus = _csv_values(cpu)
    selected_gpus = _csv_gpu_values(gpu)
    selected_ram = _csv_int_values(ram_capacity_gb)
    selected_storage = _csv_int_values(storage_capacity_gb)
    discounted_only = _truthy_filter(discounted)

    if not any(
        [
            selected_brands,
            selected_cpus,
            selected_gpus,
            selected_ram,
            selected_storage,
            discounted_only,
        ]
    ):
        return products

    filtered: list[Product] = []
    for product in products:
        specs = extract_product_filter_specs(product)
        if selected_brands and normalize_filter_value(specs.brand) not in selected_brands:
            continue
        if selected_cpus and normalize_filter_value(specs.cpu) not in selected_cpus:
            continue
        if selected_gpus and _normalize_gpu_filter_value(specs.gpu) not in selected_gpus:
            continue
        if selected_ram and specs.ram_capacity_gb not in selected_ram:
            continue
        if selected_storage and specs.storage_capacity_gb not in selected_storage:
            continue
        if discounted_only and not specs.discounted:
            continue
        filtered.append(product)

    return filtered


def _base_products_statement(
    *,
    category: str | None,
    category_id: int | None,
    item_type: str | None,
    price_min: float | None,
    price_max: float | None,
    search: str | None,
):
    statement = select(Product).where(Product.is_active == True)
    normalized_category_id = _int_query_value(category_id)
    normalized_price_min = _number_query_value(price_min)
    normalized_price_max = _number_query_value(price_max)

    if normalized_category_id is not None:
        statement = statement.where(Product.category_id == normalized_category_id)
    else:
        normalized_category = category.strip().lower() if isinstance(category, str) and category else None
        if normalized_category:
            statement = statement.where(func.lower(Product.category) == normalized_category)

    normalized_item_type = item_type.strip().lower() if isinstance(item_type, str) and item_type else None
    if normalized_item_type:
        statement = statement.where(func.lower(Product.item_type) == normalized_item_type)

    if normalized_price_min is not None:
        statement = statement.where(Product.price >= normalized_price_min)

    if normalized_price_max is not None:
        statement = statement.where(Product.price <= normalized_price_max)

    normalized_search = search.strip() if isinstance(search, str) and search else None
    if normalized_search:
        search_pattern = f"%{normalized_search}%"
        statement = statement.where(
            or_(
                Product.name.ilike(search_pattern),
                Product.model.ilike(search_pattern),
                Product.description.ilike(search_pattern),
            )
        )

    return statement


@router.get("", response_model=list[ProductRead])
def list_products(
    category: str | None = Query(default=None, min_length=1, max_length=100),
    category_id: int | None = Query(default=None, ge=1),
    item_type: str | None = Query(default=None, min_length=1, max_length=100),
    price_min: float | None = Query(default=None, ge=0),
    price_max: float | None = Query(default=None, ge=0),
    search: str | None = Query(default=None, min_length=1, max_length=200),
    sort: str | None = Query(default=None, max_length=30),
    brand: str | None = Query(default=None, max_length=800),
    cpu: str | None = Query(default=None, max_length=800),
    gpu: str | None = Query(default=None, max_length=800),
    ram_capacity_gb: str | None = Query(default=None, max_length=200),
    storage_capacity_gb: str | None = Query(default=None, max_length=200),
    discounted: bool | None = Query(default=None),
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    statement = _base_products_statement(
        category=category,
        category_id=category_id,
        item_type=item_type,
        price_min=price_min,
        price_max=price_max,
        search=search,
    )

    normalized_sort = sort.strip().lower() if isinstance(sort, str) and sort else None
    if normalized_sort == "popularity":
        # Composite popularity score:
        #   approved_review_count * REVIEW_WEIGHT  +  units_sold * SALES_WEIGHT
        # Reviews are weighted higher because they signal stronger engagement
        # (a customer cared enough to rate the product, not just buy it).
        REVIEW_WEIGHT = 10
        SALES_WEIGHT = 1

        sales_subquery = (
            select(
                OrderItem.product_id,
                func.coalesce(func.sum(OrderItem.quantity), 0).label("units_sold"),
            )
            .group_by(OrderItem.product_id)
            .subquery()
        )
        reviews_subquery = (
            select(
                Review.product_id,
                func.count(Review.review_id).label("review_count"),
            )
            .where(Review.status == "approved")
            .group_by(Review.product_id)
            .subquery()
        )
        popularity_score = (
            func.coalesce(reviews_subquery.c.review_count, 0) * REVIEW_WEIGHT
            + func.coalesce(sales_subquery.c.units_sold, 0) * SALES_WEIGHT
        )
        statement = (
            statement
            .outerjoin(sales_subquery, Product.product_id == sales_subquery.c.product_id)
            .outerjoin(reviews_subquery, Product.product_id == reviews_subquery.c.product_id)
            .order_by(popularity_score.desc(), Product.product_id)
        )
    else:
        statement = statement.order_by(Product.product_id)

    products = db.scalars(statement).all()
    products = _apply_spec_filters(
        products,
        brand=brand,
        cpu=cpu,
        gpu=gpu,
        ram_capacity_gb=ram_capacity_gb,
        storage_capacity_gb=storage_capacity_gb,
        discounted=discounted,
    )
    products = collapse_variant_products(products)

    normalized_offset = offset if isinstance(offset, int) else 0
    normalized_limit = limit if isinstance(limit, int) else None

    if normalized_offset:
        products = products[normalized_offset:]

    if normalized_limit is not None:
        products = products[:normalized_limit]

    return [ProductRead.model_validate(product) for product in products]


@router.get("/random", response_model=list[ProductRead])
def random_products(
    count: int = Query(default=6, ge=4, le=6),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    all_products = db.scalars(select(Product).where(Product.is_active == True)).all()
    all_products = collapse_variant_products(all_products)
    chosen = sample(all_products, min(count, len(all_products)))
    return [ProductRead.model_validate(p) for p in chosen]


@router.get("/filters", response_model=ProductFilterOptionsRead)
def get_product_filter_options(
    category: str | None = Query(default=None, min_length=1, max_length=100),
    category_id: int | None = Query(default=None, ge=1),
    item_type: str | None = Query(default=None, min_length=1, max_length=100),
    price_min: float | None = Query(default=None, ge=0),
    price_max: float | None = Query(default=None, ge=0),
    search: str | None = Query(default=None, min_length=1, max_length=200),
    db: Session = Depends(get_db),
) -> ProductFilterOptionsRead:
    statement = _base_products_statement(
        category=category,
        category_id=category_id,
        item_type=item_type,
        price_min=price_min,
        price_max=price_max,
        search=search,
    ).order_by(Product.product_id)

    products = db.scalars(statement).all()
    return ProductFilterOptionsRead(**build_filter_options(products))


@router.get("/{product_id}/variants", response_model=list[ProductVariantRead])
def get_product_variants(product_id: int, db: Session = Depends(get_db)) -> list[ProductVariantRead]:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    candidates = db.scalars(select(Product).where(Product.is_active == True)).all()
    variants = matching_variant_products(product, candidates)
    return [_read_variant(variant) for variant in variants]


@router.get("/{product_id}", response_model=ProductRead)
def get_product(product_id: int, db: Session = Depends(get_db)) -> ProductRead:
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Product not found.",
        )

    return ProductRead.model_validate(product)


@router.post("", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(payload: ProductCreate, db: Session = Depends(get_db)) -> ProductRead:
    product = Product(**payload.model_dump())
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)
