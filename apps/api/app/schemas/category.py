from datetime import datetime

from pydantic import BaseModel, ConfigDict, Field


class CategoryCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    label: str = Field(min_length=1, max_length=200)
    slug: str = Field(min_length=1, max_length=120)
    description: str = Field(default="", max_length=500)
    icon: str = Field(default="", max_length=60)
    image_url: str | None = None
    is_visible_in_sidebar: bool = True
    is_visible_on_homepage: bool = False
    sort_order: int = 0


class CategoryUpdate(BaseModel):
    name: str | None = Field(default=None, min_length=1, max_length=100)
    label: str | None = Field(default=None, min_length=1, max_length=200)
    slug: str | None = Field(default=None, min_length=1, max_length=120)
    description: str | None = Field(default=None, max_length=500)
    icon: str | None = Field(default=None, max_length=60)
    image_url: str | None = None
    is_visible_in_sidebar: bool | None = None
    is_visible_on_homepage: bool | None = None
    sort_order: int | None = None


class CategoryRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    category_id: int
    name: str
    label: str
    slug: str
    description: str
    icon: str
    image_url: str | None
    is_visible_in_sidebar: bool
    is_visible_on_homepage: bool
    sort_order: int
    created_at: datetime


class ItemTypePublicEntry(BaseModel):
    value: str
    label: str
    sort_order: int = 0


class CategoryPublicRead(BaseModel):
    category_id: int
    name: str
    label: str
    slug: str
    description: str
    icon: str
    image_url: str | None
    is_visible_in_sidebar: bool
    is_visible_on_homepage: bool
    sort_order: int
    item_types: list[ItemTypePublicEntry] = []
