from pydantic import BaseModel, ConfigDict, Field


class ItemTypeCreate(BaseModel):
    category_id: int = Field(ge=1)
    value: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=200)
    sort_order: int = 0


class ItemTypeUpdate(BaseModel):
    value: str | None = Field(default=None, min_length=1, max_length=100)
    label: str | None = Field(default=None, min_length=1, max_length=200)
    sort_order: int | None = None


class ItemTypeRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    item_type_id: int
    category_id: int
    value: str
    label: str
    sort_order: int


class ItemTypePublic(BaseModel):
    value: str
    label: str
    sort_order: int
