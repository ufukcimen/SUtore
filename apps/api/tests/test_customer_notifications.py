from decimal import Decimal

from sqlalchemy import select

from app.api.v1.endpoints import admin as admin_endpoints
from app.api.v1.endpoints.admin import approve_refund, apply_discount
from app.api.v1.endpoints.notifications import mark_all_notifications_read
from app.models.notification import Notification
from app.models.order import Order, OrderItem
from app.models.product import Product
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas.admin import DiscountApply


def seed_notification_users(db_session) -> tuple[User, User]:
    customer = User(
        user_id=1,
        name="Customer",
        email="customer@example.com",
        password_hash="hashed-password",
        role="customer",
    )
    sales_manager = User(
        user_id=2,
        name="Sales Manager",
        email="sales@example.com",
        password_hash="hashed-password",
        role="sales_manager",
    )
    db_session.add_all([customer, sales_manager])
    db_session.commit()
    return customer, sales_manager


def test_apply_discount_creates_wishlist_notification_and_calls_email(monkeypatch, db_session) -> None:
    customer, sales_manager = seed_notification_users(db_session)
    product = Product(
        product_id=100,
        name="Wishlist Laptop",
        model="WL-1",
        description="Laptop on a customer wishlist",
        price=Decimal("1000.00"),
        stock_quantity=5,
        category="Laptop",
        item_type="laptop",
        is_active=True,
    )
    wishlist_item = WishlistItem(user_id=customer.user_id, product_id=product.product_id)
    db_session.add_all([product, wishlist_item])
    db_session.commit()

    sent_emails: list[dict[str, object]] = []

    def fake_discount_email(**kwargs) -> bool:
        sent_emails.append(kwargs)
        return True

    monkeypatch.setattr(admin_endpoints, "send_discount_notification_email", fake_discount_email)

    result = apply_discount(
        DiscountApply(product_ids=[product.product_id], discount_rate=Decimal("20.00")),
        sales_manager.user_id,
        db_session,
    )

    notification = db_session.scalar(select(Notification).where(Notification.user_id == customer.user_id))
    updated_product = db_session.get(Product, product.product_id)

    assert result.notified_users_count == 1
    assert result.notified_emails == ["customer@example.com"]
    assert result.in_app_notifications_created == 1
    assert result.email_notifications_sent == 1
    assert result.email_notifications_failed == 0
    assert sent_emails == [
        {
            "recipient_email": "customer@example.com",
            "product_name": "Wishlist Laptop",
            "discount_rate": Decimal("20.00"),
            "old_price": Decimal("1000.00"),
            "new_price": Decimal("800.00"),
        }
    ]
    assert updated_product.price == Decimal("800.00")
    assert notification is not None
    assert notification.notification_type == "discount"
    assert notification.title == "Wishlist item on sale"
    assert "Wishlist Laptop on your wishlist is now 20.00% off." in notification.message
    assert notification.product_id == product.product_id
    assert notification.is_read is False


def test_approve_refund_creates_notification_restock_and_calls_email(monkeypatch, db_session) -> None:
    customer, sales_manager = seed_notification_users(db_session)
    product = Product(
        product_id=100,
        name="Refund Laptop",
        model="RL-1",
        description="Laptop being refunded",
        price=Decimal("500.00"),
        stock_quantity=3,
        category="Laptop",
        item_type="laptop",
        is_active=True,
    )
    order = Order(
        order_id=200,
        order_number="SU-REFUND1",
        user_id=customer.user_id,
        status="refund_requested",
        billing_name="Customer",
        billing_email="customer@example.com",
        billing_phone="+90 555 111 2233",
        billing_address="Refund Street",
        payment_brand="Visa",
        payment_last4="1111",
        subtotal=Decimal("1000.00"),
        shipping=Decimal("0.00"),
        tax=Decimal("80.00"),
        total=Decimal("1080.00"),
        items=[
            OrderItem(
                product_id=product.product_id,
                product_name="Refund Laptop",
                product_category="Laptop",
                unit_price=Decimal("500.00"),
                quantity=2,
                line_total=Decimal("1000.00"),
            )
        ],
    )
    db_session.add_all([product, order])
    db_session.commit()

    sent_emails: list[dict[str, object]] = []

    def fake_refund_email(**kwargs) -> bool:
        sent_emails.append(kwargs)
        return True

    monkeypatch.setattr(admin_endpoints, "send_refund_approved_email", fake_refund_email)

    result = approve_refund(order.order_id, sales_manager.user_id, db_session)

    notification = db_session.scalar(select(Notification).where(Notification.user_id == customer.user_id))
    updated_product = db_session.get(Product, product.product_id)

    assert result.status == "refunded"
    assert updated_product.stock_quantity == 5
    assert sent_emails == [
        {
            "recipient_email": "customer@example.com",
            "order_number": "SU-REFUND1",
            "total": Decimal("1080.00"),
            "product_names": ["Refund Laptop"],
        }
    ]
    assert notification is not None
    assert notification.notification_type == "refund_approved"
    assert notification.title == "Refund approved"
    assert "Your refund for order SU-REFUND1 has been approved." in notification.message
    assert notification.order_id == order.order_id
    assert notification.is_read is False


def test_notification_read_all_route_marks_only_user_notifications(db_session) -> None:
    customer, _ = seed_notification_users(db_session)
    other_user = User(
        user_id=3,
        name="Other Customer",
        email="other@example.com",
        password_hash="hashed-password",
        role="customer",
    )
    db_session.add(other_user)
    db_session.flush()
    db_session.add_all(
        [
            Notification(
                user_id=customer.user_id,
                notification_type="discount",
                title="Wishlist item on sale",
                message="Wishlist Laptop is now on sale.",
            ),
            Notification(
                user_id=customer.user_id,
                notification_type="refund_approved",
                title="Refund approved",
                message="Your refund was approved.",
                is_read=True,
            ),
            Notification(
                user_id=other_user.user_id,
                notification_type="discount",
                title="Other sale",
                message="Another customer notification.",
            ),
        ]
    )
    db_session.commit()

    response = mark_all_notifications_read(customer.user_id, db_session)

    assert len(response) == 1
    customer_notifications = db_session.scalars(
        select(Notification).where(Notification.user_id == customer.user_id)
    ).all()
    other_notification = db_session.scalar(select(Notification).where(Notification.user_id == other_user.user_id))

    assert all(notification.is_read for notification in customer_notifications)
    assert other_notification is not None
    assert other_notification.is_read is False
