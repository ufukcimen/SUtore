from datetime import datetime

from pydantic import BaseModel, ConfigDict


class NotificationRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    notification_id: int
    user_id: int
    notification_type: str
    title: str
    message: str
    product_id: int | None
    order_id: int | None
    is_read: bool
    created_at: datetime
