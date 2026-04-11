from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas.wishlist import WishlistAdd, WishlistItemRead, WishlistProductRead, WishlistRemove

router = APIRouter()


@router.get("", response_model=list[WishlistItemRead])
def list_wishlist(
    user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> list[WishlistItemRead]:
    statement = (
        select(WishlistItem)
        .where(WishlistItem.user_id == user_id)
        .order_by(WishlistItem.created_at.desc())
    )

    items = db.scalars(statement).all()
    result = []

    for item in items:
        product = db.get(Product, item.product_id)
        product_data = WishlistProductRead.model_validate(product) if product else None

        entry = WishlistItemRead.model_validate(item)
        entry.product = product_data
        result.append(entry)

    return result


@router.post("", response_model=WishlistItemRead, status_code=status.HTTP_201_CREATED)
def add_to_wishlist(
    payload: WishlistAdd,
    db: Session = Depends(get_db),
) -> WishlistItemRead:
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    existing = db.scalars(
        select(WishlistItem).where(
            WishlistItem.user_id == payload.user_id,
            WishlistItem.product_id == payload.product_id,
        )
    ).first()

    if existing:
        entry = WishlistItemRead.model_validate(existing)
        entry.product = WishlistProductRead.model_validate(product)
        return entry

    item = WishlistItem(user_id=payload.user_id, product_id=payload.product_id)
    db.add(item)
    db.commit()
    db.refresh(item)

    entry = WishlistItemRead.model_validate(item)
    entry.product = WishlistProductRead.model_validate(product)
    return entry


@router.delete("", status_code=status.HTTP_200_OK)
def remove_from_wishlist(
    user_id: int = Query(ge=1),
    product_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> dict:
    item = db.scalars(
        select(WishlistItem).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
    ).first()

    if not item:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Wishlist entry not found.")

    db.delete(item)
    db.commit()
    return {"message": "Removed from wishlist."}


@router.get("/check", response_model=dict)
def check_wishlist(
    user_id: int = Query(ge=1),
    product_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> dict:
    item = db.scalars(
        select(WishlistItem).where(
            WishlistItem.user_id == user_id,
            WishlistItem.product_id == product_id,
        )
    ).first()

    return {"wishlisted": item is not None}
