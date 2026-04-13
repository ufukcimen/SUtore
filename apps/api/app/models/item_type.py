from sqlalchemy import ForeignKey, Integer, String, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from app.db.base import Base


class ItemType(Base):
    __tablename__ = "item_types"
    __table_args__ = (UniqueConstraint("category_id", "value"),)

    item_type_id: Mapped[int] = mapped_column(primary_key=True)
    category_id: Mapped[int] = mapped_column(Integer, ForeignKey("categories.category_id", ondelete="CASCADE"), nullable=False)
    value: Mapped[str] = mapped_column(String(100), nullable=False)
    label: Mapped[str] = mapped_column(String(200), nullable=False)
    sort_order: Mapped[int] = mapped_column(Integer, server_default="0", nullable=False)
