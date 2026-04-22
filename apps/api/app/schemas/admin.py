from datetime import date
from decimal import Decimal

from pydantic import BaseModel, Field


class ProductPriceUpdate(BaseModel):
    price: Decimal = Field(ge=0, decimal_places=2, max_digits=10)


class DiscountApply(BaseModel):
    product_ids: list[int] = Field(min_length=1)
    discount_rate: Decimal = Field(gt=0, lt=100, decimal_places=2, max_digits=5)


class DiscountedProductRead(BaseModel):
    product_id: int
    name: str | None
    old_price: Decimal
    new_price: Decimal
    discount_rate: Decimal
    wishlist_users_notified: int


class DiscountApplyResult(BaseModel):
    message: str
    products: list[DiscountedProductRead]
    notified_users_count: int
    notified_emails: list[str]


class DailyFinancialPoint(BaseModel):
    day: date
    revenue: Decimal
    refunded_loss: Decimal
    estimated_profit: Decimal
    order_count: int


class FinancialSummary(BaseModel):
    start_date: date | None
    end_date: date | None
    revenue: Decimal
    net_revenue: Decimal
    refunded_loss: Decimal
    estimated_cost: Decimal
    estimated_profit: Decimal
    order_count: int
    refund_count: int
    cost_rate: Decimal
    daily: list[DailyFinancialPoint]
