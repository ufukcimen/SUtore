from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, or_, select
from sqlalchemy.orm import Session
from random import sample

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductRead

router = APIRouter()


@router.get("", response_model=list[ProductRead])
def list_products(
    category: str | None = Query(default=None, min_length=1, max_length=100),
    item_type: str | None = Query(default=None, min_length=1, max_length=100),
    price_min: float | None = Query(default=None, ge=0),
    price_max: float | None = Query(default=None, ge=0),
    search: str | None = Query(default=None, min_length=1, max_length=200),
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    statement = select(Product).order_by(Product.product_id)

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

    if offset:
        statement = statement.offset(offset)

    if limit is not None:
        statement = statement.limit(limit)

    products = db.scalars(statement).all()
    return [ProductRead.model_validate(product) for product in products]


@router.get("/random", response_model=list[ProductRead])
def random_products(
    count: int = Query(default=6, ge=4, le=6),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    all_products = db.scalars(select(Product)).all()
    chosen = sample(all_products, min(count, len(all_products)))
    return [ProductRead.model_validate(p) for p in chosen]


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
