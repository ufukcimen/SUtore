from decimal import Decimal

from pydantic import BaseModel, ConfigDict, Field, field_validator


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
    discount_percent: int | None = Field(default=None, ge=0, le=100)
    variant_group: str | None = Field(default=None, max_length=160)
    ram_capacity_gb: int | None = Field(default=None, ge=0)
    storage_capacity_gb: int | None = Field(default=None, ge=0)

    @field_validator("variant_group", mode="before")
    @classmethod
    def normalize_variant_group(cls, value: str | None) -> str | None:
        if value is None:
            return None
        if isinstance(value, str):
            normalized = value.strip()
            return normalized or None
        return value

    @field_validator("ram_capacity_gb", "storage_capacity_gb", mode="before")
    @classmethod
    def normalize_optional_capacity(cls, value: int | str | None) -> int | None:
        if value is None or value == "":
            return None
        return value


class ProductCreate(ProductBase):
    pass


class ProductUpdate(ProductBase):
    pass


class ProductRead(ProductBase):
    model_config = ConfigDict(from_attributes=True)

    product_id: int
    is_active: bool = True
    discount_percent: int = 0


class ProductVariantRead(ProductRead):
    ram_capacity: str | None = None
    ram_capacity_gb: int | None = None
    storage_capacity: str | None = None
    storage_capacity_gb: int | None = None
