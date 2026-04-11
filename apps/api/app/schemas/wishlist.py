from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class WishlistAdd(BaseModel):
    user_id: int = Field(ge=1)
    product_id: int = Field(ge=1)


class WishlistRemove(BaseModel):
    user_id: int = Field(ge=1)
    product_id: int = Field(ge=1)


class WishlistProductRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    name: str | None = None
    model: str | None = None
    price: Decimal | None = None
    stock_quantity: int | None = None
    image_url: str | None = None
    category: str | None = None
    item_type: str | None = None


class WishlistItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    wishlist_item_id: int
    user_id: int
    product_id: int
    created_at: datetime
    product: WishlistProductRead | None = None
