from datetime import datetime
from decimal import Decimal

from pydantic import BaseModel, ConfigDict


class DeliveryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    delivery_id: int
    order_id: int
    customer_id: int | None
    delivery_address: str
    total_price: Decimal
    is_completed: bool
    created_at: datetime
    completed_at: datetime | None
    order_number: str | None = None
    order_status: str | None = None
    customer_name: str | None = None
