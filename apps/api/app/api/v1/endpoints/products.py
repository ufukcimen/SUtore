from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.schemas.product import ProductCreate, ProductRead

router = APIRouter()


@router.get("", response_model=list[ProductRead])
def list_products(
    category: str | None = Query(default=None, min_length=1, max_length=100),
    limit: int | None = Query(default=None, ge=1, le=100),
    offset: int = Query(default=0, ge=0),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    statement = select(Product).order_by(Product.product_id)

    normalized_category = category.strip().lower() if category else None
    if normalized_category:
        statement = statement.where(func.lower(Product.category) == normalized_category)

    if offset:
        statement = statement.offset(offset)

    if limit is not None:
        statement = statement.limit(limit)

    products = db.scalars(statement).all()
    return [ProductRead.model_validate(product) for product in products]


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
