from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field


class ProductBase(BaseModel):
    name: str | None = Field(default=None, max_length=200)
    model: str | None = Field(default=None, max_length=100)
    serial_number: str | None = Field(default=None, max_length=100)
    description: str | None = None
    price: Decimal | None = Field(default=None, decimal_places=2, max_digits=10)
    warranty_status: bool | None = None
    distributor: str | None = Field(default=None, max_length=200)
    stock_quantity: int | None = None
    image_url: str | None = None
    category: str | None = Field(default=None, max_length=100)
    item_type: str | None = Field(default=None, max_length=100)
    category_id: int | None = None


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    is_active: bool = True
