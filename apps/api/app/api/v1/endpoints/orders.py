from decimal import Decimal
import logging
from uuid import uuid4

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.delivery import Delivery
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCreate, OrderRead
from app.services import send_order_invoice_email

router = APIRouter()
logger = logging.getLogger(__name__)

FREE_SHIPPING_THRESHOLD = Decimal("1200.00")
STANDARD_SHIPPING = Decimal("24.90")
TAX_RATE = Decimal("0.08")


def build_order_number() -> str:
    return f"SU-{uuid4().hex[:8].upper()}"


def queue_invoice_email(order: OrderRead) -> None:
    try:
        send_order_invoice_email(order)
    except Exception:
        logger.exception(
            "Order %s was created, but invoice email delivery failed.",
            order.order_number,
        )


def serialize_order(db: Session, order_id: int) -> OrderRead:
    statement = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_id == order_id)
    )
    order = db.scalar(statement)
    if not order:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Order not found.",
        )

    return OrderRead.model_validate(order)


@router.get("", response_model=list[OrderRead])
def list_orders(
    user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> list[OrderRead]:
    statement = (
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.user_id == user_id)
        .order_by(Order.created_at.desc(), Order.order_id.desc())
    )
    orders = db.scalars(statement).all()
    return [OrderRead.model_validate(order) for order in orders]


@router.post("", response_model=OrderRead, status_code=status.HTTP_201_CREATED)
def create_order(
    payload: OrderCreate,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> OrderRead:
    if payload.user_id is not None:
        user = db.get(User, payload.user_id)
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found.",
            )

    product_ids = [item.product_id for item in payload.items]
    products = db.scalars(
        select(Product)
        .where(Product.product_id.in_(product_ids))
        .with_for_update()
    ).all()
    products_by_id = {product.product_id: product for product in products}

    subtotal = Decimal("0.00")
    order_items: list[OrderItem] = []

    for requested_item in payload.items:
        product = products_by_id.get(requested_item.product_id)
        if not product:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail=f"Product {requested_item.product_id} was not found.",
            )

        available_stock = product.stock_quantity or 0
        if available_stock < requested_item.quantity:
            product_name = product.name or f"Product {product.product_id}"
            if available_stock <= 0:
                detail = f"{product_name} is out of stock."
            else:
                detail = f"Only {available_stock} left in stock for {product_name}."
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail=detail,
            )

        unit_price = product.price or Decimal("0.00")
        line_total = unit_price * requested_item.quantity
        subtotal += line_total

        order_items.append(
            OrderItem(
                product_id=product.product_id,
                product_name=product.name or "Unnamed product",
                product_category=product.category,
                product_image_url=product.image_url,
                unit_price=unit_price,
                quantity=requested_item.quantity,
                line_total=line_total,
            )
        )

        product.stock_quantity = available_stock - requested_item.quantity

    shipping = Decimal("0.00") if subtotal >= FREE_SHIPPING_THRESHOLD else STANDARD_SHIPPING
    tax = (subtotal * TAX_RATE).quantize(Decimal("0.01"))
    total = subtotal + shipping + tax

    order = Order(
        order_number=build_order_number(),
        user_id=payload.user_id,
        status="confirmed",
        billing_name=payload.billing_name,
        billing_email=payload.billing_email,
        billing_phone=payload.billing_phone,
        billing_address=payload.billing_address,
        payment_brand=payload.payment_brand,
        payment_last4=payload.payment_last4,
        subtotal=subtotal,
        shipping=shipping,
        tax=tax,
        total=total,
        items=order_items,
    )
    db.add(order)
    db.flush()

    delivery = Delivery(
        order_id=order.order_id,
        customer_id=payload.user_id,
        delivery_address=payload.billing_address,
        total_price=total,
    )
    db.add(delivery)
    db.commit()

    created_order = serialize_order(db, order.order_id)
    background_tasks.add_task(queue_invoice_email, created_order)
    return created_order
