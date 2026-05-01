from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from random import sample

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductRead, ProductVariantRead
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


@router.get("", response_model=list[ProductRead])
def list_products(
    category: str | None = Query(default=None, min_length=1, max_length=100),
    category_id: int | None = Query(default=None, ge=1),
    item_type: str | None = Query(default=None, min_length=1, max_length=100),
    price_min: float | None = Query(default=None, ge=0),
    price_max: float | None = Query(default=None, ge=0),
    search: str | None = Query(default=None, min_length=1, max_length=200),
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    statement = select(Product).where(Product.is_active == True).order_by(Product.product_id)

    if category_id is not None:
        statement = statement.where(Product.category_id == category_id)
    else:
        normalized_category = category.strip().lower() if category else None
        if normalized_category:
            statement = statement.where(func.lower(Product.category) == normalized_category)

    normalized_item_type = item_type.strip().lower() if item_type else None
    if normalized_item_type:
        statement = statement.where(func.lower(Product.item_type) == normalized_item_type)

    if price_min is not None:
        statement = statement.where(Product.price >= price_min)

    if price_max is not None:
        statement = statement.where(Product.price <= price_max)

    normalized_search = search.strip() if search else None
    if normalized_search:
        search_pattern = f"%{normalized_search}%"
        statement = statement.where(
            or_(
                Product.name.ilike(search_pattern),
                Product.model.ilike(search_pattern),
                Product.description.ilike(search_pattern),
            )
        )

    products = db.scalars(statement).all()
    products = collapse_variant_products(products)

    if offset:
        products = products[offset:]

    if limit is not None:
        products = products[:limit]

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
