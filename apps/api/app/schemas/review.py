from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class ReviewCreate(BaseModel):
    user_id: int = Field(ge=1)
    product_id: int = Field(ge=1)
    rating: int = Field(ge=1, le=5)
    comment: str = Field(min_length=1, max_length=2000)


class ReviewRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    review_id: int
    user_id: int
    product_id: int
    rating: int
    comment: str
    status: str
    created_at: datetime
    user_name: str | None = None


class ReviewStatusUpdate(BaseModel):
    status: str = Field(pattern=r"^(approved|rejected)$")


class ReviewSummary(BaseModel):
    average_rating: float | None = None
    review_count: int = 0
