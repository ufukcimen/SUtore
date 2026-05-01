from decimal import Decimal

from sqlalchemy import Boolean, ForeignKey, Integer, Numeric, String, Text
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class Product(Base):
    __tablename__ = "products"

    product_id: Mapped[int] = mapped_column(primary_key=True)
    name: Mapped[str | None] = mapped_column(String(200))
    model: Mapped[str | None] = mapped_column(String(100))
    serial_number: Mapped[str | None] = mapped_column(String(100))
    description: Mapped[str | None] = mapped_column(Text)
    price: Mapped[Decimal | None] = mapped_column(Numeric(10, 2))
    warranty_status: Mapped[bool | None] = mapped_column(Boolean)
    distributor: Mapped[str | None] = mapped_column(String(200))
    stock_quantity: Mapped[int | None] = mapped_column(Integer)
    image_url: Mapped[str | None] = mapped_column(Text)
    category: Mapped[str | None] = mapped_column(String(100))
    item_type: Mapped[str | None] = mapped_column(String(100))
    is_active: Mapped[bool] = mapped_column(Boolean, server_default="true", nullable=False)
    category_id: Mapped[int | None] = mapped_column(Integer, ForeignKey("categories.category_id", ondelete="SET NULL"), nullable=True)
    discount_percent: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
    variant_group: Mapped[str | None] = mapped_column(String(160), nullable=True)
    ram_capacity_gb: Mapped[int | None] = mapped_column(Integer, nullable=True)
    storage_capacity_gb: Mapped[int | None] = mapped_column(Integer, nullable=True)
