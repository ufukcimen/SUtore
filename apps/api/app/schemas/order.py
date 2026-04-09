from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator


class OrderCheckoutItem(BaseModel):
    product_id: int = Field(ge=1)
    quantity: int = Field(ge=1, le=10)


class OrderCreate(BaseModel):
    user_id: int | None = Field(default=None, ge=1)
    items: list[OrderCheckoutItem] = Field(min_length=1)
    billing_name: str = Field(min_length=1, max_length=200)
    billing_email: EmailStr
    billing_phone: str = Field(min_length=1, max_length=50)
    billing_address: str = Field(min_length=1)
    payment_brand: str = Field(min_length=1, max_length=50)
    payment_last4: str = Field(min_length=4, max_length=4)

    @field_validator(
        "billing_name",
        "billing_phone",
        "billing_address",
        "payment_brand",
        mode="before",
    )
    @classmethod
    def validate_text_not_blank(cls, value: str) -> str:
        if isinstance(value, str):
            stripped = value.strip()
            if not stripped:
                raise ValueError("This field can't be left blank.")
            return stripped
        return value

    @field_validator("payment_last4")
    @classmethod
    def validate_payment_last4(cls, value: str) -> str:
        if not value.isdigit():
            raise ValueError("Payment last4 must contain only digits.")
        return value


class OrderItemRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_item_id: int
    product_id: int | None
    product_name: str
    product_category: str | None
    product_image_url: str | None
    unit_price: Decimal
    quantity: int
    line_total: Decimal


class OrderRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    order_id: int
    order_number: str
    user_id: int | None
    status: str
    billing_name: str
    billing_email: EmailStr
    billing_phone: str
    billing_address: str
    payment_brand: str
    payment_last4: str
    subtotal: Decimal
    shipping: Decimal
    tax: Decimal
    total: Decimal
    created_at: datetime
    items: list[OrderItemRead]
