from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.category import Category
from app.models.item_type import ItemType
from app.schemas.category import CategoryPublicRead, ItemTypePublicEntry

router = APIRouter()


@router.get("", response_model=list[CategoryPublicRead])
def list_public_categories(
    db: Session = Depends(get_db),
) -> list[CategoryPublicRead]:
    categories = db.scalars(
        select(Category).order_by(Category.sort_order, Category.category_id)
    ).all()

    result = []
    for cat in categories:
        types = db.scalars(
            select(ItemType)
            .where(ItemType.category_id == cat.category_id)
            .order_by(ItemType.sort_order, ItemType.item_type_id)
        ).all()

        result.append(
            CategoryPublicRead(
                category_id=cat.category_id,
                name=cat.name,
                label=cat.label,
                slug=cat.slug,
                description=cat.description,
                icon=cat.icon,
                image_url=cat.image_url,
                is_visible_in_sidebar=cat.is_visible_in_sidebar,
                is_visible_on_homepage=cat.is_visible_on_homepage,
                sort_order=cat.sort_order,
                item_types=[
                    ItemTypePublicEntry(value=t.value, label=t.label, sort_order=t.sort_order)
                    for t in types
                ],
            )
        )

    return result
