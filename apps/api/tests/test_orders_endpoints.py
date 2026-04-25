from decimal import Decimal

import pytest
from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import select

from app.api.v1.endpoints.orders import create_order
from app.models.delivery import Delivery
from app.models.product import Product
from app.models.user import User
from app.schemas.order import OrderCheckoutItem, OrderCreate


def seed_checkout_state(db_session, *, price: str = "499.99", stock: int = 5) -> tuple[User, Product]:
    user = User(
        user_id=1,
        name="Checkout User",
        email="checkout@example.com",
        password_hash="hashed-password",
    )
    product = Product(
        product_id=100,
        name="GeForce RTX 5080",
        model="RTX 5080 FE",
        description="GPU ready for checkout tests",
        price=Decimal(price),
        stock_quantity=stock,
        category="GPU",
        item_type="gpu",
        is_active=True,
    )
    db_session.add_all([user, product])
    db_session.commit()
    return user, product


def test_create_order_reduces_stock_and_creates_a_delivery_record(db_session) -> None:
    user, product = seed_checkout_state(db_session)
    background_tasks = BackgroundTasks()

    created_order = create_order(
        OrderCreate(
            user_id=user.user_id,
            items=[OrderCheckoutItem(product_id=product.product_id, quantity=2)],
            billing_name="Checkout User",
            billing_email="checkout@example.com",
            billing_phone="+90 555 111 2233",
            billing_address="123 Checkout Street",
            payment_brand="Visa",
            payment_last4="1111",
        ),
        background_tasks,
        db_session,
    )

    updated_product = db_session.get(Product, product.product_id)
    delivery = db_session.scalar(
        select(Delivery).where(Delivery.order_id == created_order.order_id)
    )

    assert updated_product is not None
    assert updated_product.stock_quantity == 3
    assert created_order.subtotal == Decimal("999.98")
    assert created_order.shipping == Decimal("24.90")
    assert created_order.tax == Decimal("80.00")
    assert created_order.total == Decimal("1104.88")
    assert delivery is not None
    assert delivery.delivery_address == "123 Checkout Street"
    assert len(background_tasks.tasks) == 1


def test_create_order_uses_free_shipping_at_or_above_the_threshold(db_session) -> None:
    user, product = seed_checkout_state(db_session, price="1200.00", stock=2)

    created_order = create_order(
        OrderCreate(
            user_id=user.user_id,
            items=[OrderCheckoutItem(product_id=product.product_id, quantity=1)],
            billing_name="Checkout User",
            billing_email="checkout@example.com",
            billing_phone="+90 555 111 2233",
            billing_address="123 Checkout Street",
            payment_brand="Visa",
            payment_last4="1111",
        ),
        BackgroundTasks(),
        db_session,
    )

    assert created_order.shipping == Decimal("0.00")
    assert created_order.tax == Decimal("96.00")
    assert created_order.total == Decimal("1296.00")


def test_create_order_rejects_requests_above_available_stock(db_session) -> None:
    _, product = seed_checkout_state(db_session, stock=1)

    with pytest.raises(HTTPException) as exc_info:
        create_order(
            OrderCreate(
                user_id=None,
                items=[OrderCheckoutItem(product_id=product.product_id, quantity=2)],
                billing_name="Checkout User",
                billing_email="checkout@example.com",
                billing_phone="+90 555 111 2233",
                billing_address="123 Checkout Street",
                payment_brand="Visa",
                payment_last4="1111",
            ),
            BackgroundTasks(),
            db_session,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "Only 1 left in stock for GeForce RTX 5080."
    assert db_session.get(Product, product.product_id).stock_quantity == 1
