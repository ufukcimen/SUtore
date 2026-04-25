from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, Response, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session, selectinload

from app.api.v1.endpoints.invoice_utils import invoice_pdf_response
from app.db.session import get_db
from app.models.category import Category
from app.models.delivery import Delivery
from app.models.item_type import ItemType
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.schemas.category import CategoryCreate, CategoryRead, CategoryUpdate
from app.schemas.delivery import DeliveryRead
from app.schemas.item_type import ItemTypeCreate, ItemTypeRead, ItemTypeUpdate
from app.schemas.order import OrderRead
from app.schemas.product import ProductCreate, ProductRead, ProductUpdate
from app.services import build_invoice_pdf

router = APIRouter()

ORDER_STATUS_IN_TRANSIT = "in-transit"
ORDER_STATUS_DELIVERED = "delivered"


# ── Helpers ──────────────────────────────────────────────────────────

def _require_manager(db: Session, manager_user_id: int) -> User:
    user = db.get(User, manager_user_id)
    if not user or user.role != "product_manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return user


def _serialize_delivery(db: Session, delivery: Delivery) -> DeliveryRead:
    entry = DeliveryRead.model_validate(delivery)
    order = db.get(Order, delivery.order_id)
    entry.order_number = order.order_number if order else None
    entry.order_status = order.status if order else None
    customer = db.get(User, delivery.customer_id) if delivery.customer_id else None
    entry.customer_name = customer.name if customer else None
    return entry


# ── Product CRUD ─────────────────────────────────────────────────────

@router.get("/products", response_model=list[ProductRead])
def list_all_products(
    manager_user_id: int = Query(ge=1),
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    _require_manager(db, manager_user_id)
    statement = select(Product).order_by(Product.product_id)
    if not include_inactive:
        statement = statement.where(Product.is_active == True)
    products = db.scalars(statement).all()
    return [ProductRead.model_validate(p) for p in products]


@router.post("/products", response_model=ProductRead, status_code=status.HTTP_201_CREATED)
def create_product(
    payload: ProductCreate,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> ProductRead:
    _require_manager(db, manager_user_id)

    if payload.serial_number:
        existing = db.scalars(
            select(Product).where(
                func.lower(Product.serial_number) == payload.serial_number.strip().lower(),
                Product.is_active == True,
            )
        ).first()
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with serial number '{payload.serial_number}' already exists.",
            )

    product = Product(**payload.model_dump(), is_active=True)
    db.add(product)
    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)


@router.patch("/products/{product_id}", response_model=ProductRead)
def update_product(
    product_id: int,
    payload: ProductUpdate,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> ProductRead:
    _require_manager(db, manager_user_id)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    update_data = payload.model_dump(exclude_unset=True)

    if "serial_number" in update_data and update_data["serial_number"]:
        dup = db.scalars(
            select(Product).where(
                func.lower(Product.serial_number) == update_data["serial_number"].strip().lower(),
                Product.product_id != product_id,
                Product.is_active == True,
            )
        ).first()
        if dup:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=f"A product with serial number '{update_data['serial_number']}' already exists.",
            )

    for field, value in update_data.items():
        setattr(product, field, value)

    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)


@router.delete("/products/{product_id}")
def deactivate_product(
    product_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> dict:
    _require_manager(db, manager_user_id)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    product.is_active = False
    db.commit()
    return {"message": f"Product {product_id} has been deactivated."}


@router.patch("/products/{product_id}/activate")
def activate_product(
    product_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> dict:
    _require_manager(db, manager_user_id)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    product.is_active = True
    db.commit()
    return {"message": f"Product {product_id} has been activated."}


@router.delete("/products/{product_id}/permanent")
def delete_product_permanently(
    product_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> dict:
    _require_manager(db, manager_user_id)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    db.delete(product)
    db.commit()
    return {"message": f"Product {product_id} has been permanently deleted."}


# ── Stock management ─────────────────────────────────────────────────

@router.patch("/products/{product_id}/stock", response_model=ProductRead)
def update_stock(
    product_id: int,
    quantity: int = Query(ge=0),
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> ProductRead:
    _require_manager(db, manager_user_id)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    product.stock_quantity = quantity
    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)


# ── Category CRUD ────────────────────────────────────────────────────

@router.get("/categories", response_model=list[CategoryRead])
def list_categories(
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> list[CategoryRead]:
    _require_manager(db, manager_user_id)
    categories = db.scalars(select(Category).order_by(Category.sort_order, Category.category_id)).all()
    return [CategoryRead.model_validate(c) for c in categories]


@router.post("/categories", response_model=CategoryRead, status_code=status.HTTP_201_CREATED)
def create_category(
    payload: CategoryCreate,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> CategoryRead:
    _require_manager(db, manager_user_id)

    existing = db.scalars(
        select(Category).where(func.lower(Category.name) == payload.name.strip().lower())
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category name already exists.")

    slug_conflict = db.scalars(
        select(Category).where(func.lower(Category.slug) == payload.slug.strip().lower())
    ).first()
    if slug_conflict:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug already exists.")

    cat = Category(
        name=payload.name.strip().lower(),
        label=payload.label.strip(),
        slug=payload.slug.strip().lower(),
        description=payload.description.strip() if payload.description else "",
        icon=payload.icon.strip() if payload.icon else "",
        image_url=payload.image_url,
        is_visible_in_sidebar=payload.is_visible_in_sidebar,
        is_visible_on_homepage=payload.is_visible_on_homepage,
        sort_order=payload.sort_order,
    )
    db.add(cat)
    db.commit()
    db.refresh(cat)
    return CategoryRead.model_validate(cat)


@router.patch("/categories/{category_id}", response_model=CategoryRead)
def update_category(
    category_id: int,
    payload: CategoryUpdate,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> CategoryRead:
    _require_manager(db, manager_user_id)
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "name" in update_data:
        update_data["name"] = update_data["name"].strip().lower()
    if "label" in update_data:
        update_data["label"] = update_data["label"].strip()
    if "slug" in update_data:
        update_data["slug"] = update_data["slug"].strip().lower()
        slug_conflict = db.scalars(
            select(Category).where(
                func.lower(Category.slug) == update_data["slug"],
                Category.category_id != category_id,
            )
        ).first()
        if slug_conflict:
            raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Category slug already exists.")

    for field, value in update_data.items():
        setattr(cat, field, value)

    db.commit()
    db.refresh(cat)
    return CategoryRead.model_validate(cat)


@router.delete("/categories/{category_id}")
def delete_category(
    category_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> dict:
    _require_manager(db, manager_user_id)
    cat = db.get(Category, category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    product_count = db.scalar(
        select(func.count(Product.product_id)).where(
            Product.category_id == cat.category_id,
            Product.is_active == True,
        )
    )
    if product_count and product_count > 0:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail=f"Cannot delete: {product_count} active products use this category.",
        )

    db.delete(cat)
    db.commit()
    return {"message": "Category deleted."}


# ── Item type management ─────────────────────────────────────────────

@router.get("/item-types/{category_id}", response_model=list[ItemTypeRead])
def list_item_types(
    category_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> list[ItemTypeRead]:
    _require_manager(db, manager_user_id)
    types = db.scalars(
        select(ItemType)
        .where(ItemType.category_id == category_id)
        .order_by(ItemType.sort_order, ItemType.item_type_id)
    ).all()
    return [ItemTypeRead.model_validate(t) for t in types]


@router.post("/item-types", response_model=ItemTypeRead, status_code=status.HTTP_201_CREATED)
def create_item_type(
    payload: ItemTypeCreate,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> ItemTypeRead:
    _require_manager(db, manager_user_id)

    cat = db.get(Category, payload.category_id)
    if not cat:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Category not found.")

    existing = db.scalars(
        select(ItemType).where(
            ItemType.category_id == payload.category_id,
            func.lower(ItemType.value) == payload.value.strip().lower(),
        )
    ).first()
    if existing:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Item type already exists for this category.")

    it = ItemType(
        category_id=payload.category_id,
        value=payload.value.strip().lower(),
        label=payload.label.strip(),
        sort_order=payload.sort_order,
    )
    db.add(it)
    db.commit()
    db.refresh(it)
    return ItemTypeRead.model_validate(it)


@router.patch("/item-types/{item_type_id}", response_model=ItemTypeRead)
def update_item_type(
    item_type_id: int,
    payload: ItemTypeUpdate,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> ItemTypeRead:
    _require_manager(db, manager_user_id)
    it = db.get(ItemType, item_type_id)
    if not it:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item type not found.")

    update_data = payload.model_dump(exclude_unset=True)
    if "value" in update_data:
        update_data["value"] = update_data["value"].strip().lower()
    if "label" in update_data:
        update_data["label"] = update_data["label"].strip()

    for field, value in update_data.items():
        setattr(it, field, value)

    db.commit()
    db.refresh(it)
    return ItemTypeRead.model_validate(it)


@router.delete("/item-types/{item_type_id}")
def delete_item_type(
    item_type_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> dict:
    _require_manager(db, manager_user_id)
    it = db.get(ItemType, item_type_id)
    if not it:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Item type not found.")

    db.delete(it)
    db.commit()
    return {"message": "Item type deleted."}


# ── Invoices (order viewing) ────────────────────────────────────────

@router.get("/invoices", response_model=list[OrderRead])
def list_invoices(
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> list[OrderRead]:
    _require_manager(db, manager_user_id)
    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc())
    ).all()
    return [OrderRead.model_validate(o) for o in orders]


@router.get("/invoices/{order_id}", response_model=OrderRead)
def get_invoice(
    order_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> OrderRead:
    _require_manager(db, manager_user_id)
    order = db.scalar(
        select(Order).options(selectinload(Order.items)).where(Order.order_id == order_id)
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    return OrderRead.model_validate(order)


@router.get("/invoices/{order_id}/pdf")
def download_invoice_pdf(
    order_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> Response:
    _require_manager(db, manager_user_id)
    order = db.scalar(
        select(Order).options(selectinload(Order.items)).where(Order.order_id == order_id)
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    order_read = OrderRead.model_validate(order)
    pdf_bytes = build_invoice_pdf(order_read)
    return invoice_pdf_response(pdf_bytes, f"invoice-{order.order_number}.pdf")


# ── Delivery management ──────────────────────────────────────────────

@router.get("/deliveries", response_model=list[DeliveryRead])
def list_deliveries(
    manager_user_id: int = Query(ge=1),
    show_completed: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[DeliveryRead]:
    _require_manager(db, manager_user_id)
    statement = select(Delivery).order_by(Delivery.created_at.desc())
    if not show_completed:
        statement = statement.where(Delivery.is_completed == False)

    deliveries = db.scalars(statement).all()
    return [_serialize_delivery(db, delivery) for delivery in deliveries]


@router.patch("/deliveries/{delivery_id}/in-transit", response_model=DeliveryRead)
def mark_delivery_in_transit(
    delivery_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> DeliveryRead:
    _require_manager(db, manager_user_id)
    delivery = db.get(Delivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found.")

    if delivery.is_completed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Delivery already completed.")

    order = db.get(Order, delivery.order_id)
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")

    order.status = ORDER_STATUS_IN_TRANSIT
    db.commit()
    db.refresh(delivery)
    return _serialize_delivery(db, delivery)


@router.patch("/deliveries/{delivery_id}/complete", response_model=DeliveryRead)
def complete_delivery(
    delivery_id: int,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> DeliveryRead:
    _require_manager(db, manager_user_id)
    delivery = db.get(Delivery, delivery_id)
    if not delivery:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Delivery not found.")

    if delivery.is_completed:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Delivery already completed.")

    delivery.is_completed = True
    delivery.completed_at = datetime.now(timezone.utc)
    order = db.get(Order, delivery.order_id)
    if order:
        order.status = ORDER_STATUS_DELIVERED
    db.commit()
    db.refresh(delivery)
    return _serialize_delivery(db, delivery)
