from collections import Counter
from datetime import date, datetime, time, timedelta, timezone
from decimal import Decimal, ROUND_HALF_UP

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session, selectinload

from app.db.session import get_db
from app.models.order import Order
from app.models.product import Product
from app.models.user import User
from app.models.wishlist import WishlistItem
from app.schemas.admin import (
    DailyFinancialPoint,
    DiscountApply,
    DiscountApplyResult,
    DiscountedProductRead,
    FinancialSummary,
    ProductPriceUpdate,
)
from app.schemas.order import OrderRead
from app.schemas.product import ProductRead

router = APIRouter()

SALES_ADMIN_ROLES = {"sales_manager", "admin"}
MONEY = Decimal("0.01")


def _money(value: Decimal | int | str | None) -> Decimal:
    return Decimal(value or "0").quantize(MONEY, rounding=ROUND_HALF_UP)


def _require_admin(db: Session, admin_user_id: int) -> User:
    user = db.get(User, admin_user_id)
    if not user or user.role not in SALES_ADMIN_ROLES:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")
    return user


def _date_bounds(start_date: date | None, end_date: date | None) -> tuple[datetime | None, datetime | None]:
    if start_date and end_date and end_date < start_date:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="End date cannot be earlier than start date.",
        )

    start_dt = (
        datetime.combine(start_date, time.min, tzinfo=timezone.utc)
        if start_date
        else None
    )
    end_dt = (
        datetime.combine(end_date + timedelta(days=1), time.min, tzinfo=timezone.utc)
        if end_date
        else None
    )
    return start_dt, end_dt


def _orders_in_range(
    db: Session,
    start_date: date | None,
    end_date: date | None,
) -> list[Order]:
    start_dt, end_dt = _date_bounds(start_date, end_date)
    statement = (
        select(Order)
        .options(selectinload(Order.items))
        .order_by(Order.created_at.desc(), Order.order_id.desc())
    )

    if start_dt:
        statement = statement.where(Order.created_at >= start_dt)
    if end_dt:
        statement = statement.where(Order.created_at < end_dt)

    return list(db.scalars(statement).all())


@router.get("/products", response_model=list[ProductRead])
def list_products_for_pricing(
    admin_user_id: int = Query(ge=1),
    include_inactive: bool = Query(default=True),
    db: Session = Depends(get_db),
) -> list[ProductRead]:
    _require_admin(db, admin_user_id)
    statement = select(Product).order_by(Product.product_id)
    if not include_inactive:
        statement = statement.where(Product.is_active == True)
    products = db.scalars(statement).all()
    return [ProductRead.model_validate(product) for product in products]


@router.patch("/products/{product_id}/price", response_model=ProductRead)
def update_product_price(
    product_id: int,
    payload: ProductPriceUpdate,
    admin_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> ProductRead:
    _require_admin(db, admin_user_id)
    product = db.get(Product, product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    product.price = _money(payload.price)
    db.commit()
    db.refresh(product)
    return ProductRead.model_validate(product)


@router.post("/discounts", response_model=DiscountApplyResult)
def apply_discount(
    payload: DiscountApply,
    admin_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> DiscountApplyResult:
    _require_admin(db, admin_user_id)
    product_ids = sorted({product_id for product_id in payload.product_ids if product_id > 0})
    if not product_ids:
        raise HTTPException(
            status_code=status.HTTP_422_UNPROCESSABLE_ENTITY,
            detail="At least one valid product id is required.",
        )

    products = db.scalars(
        select(Product)
        .where(Product.product_id.in_(product_ids))
        .with_for_update()
    ).all()
    if not products:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="No matching products found.")

    wishlist_rows = db.execute(
        select(WishlistItem.product_id, WishlistItem.user_id, User.email)
        .join(User, User.user_id == WishlistItem.user_id)
        .where(WishlistItem.product_id.in_([product.product_id for product in products]))
    ).all()
    wishlist_counts = Counter(row[0] for row in wishlist_rows)
    notified_user_ids = {row[1] for row in wishlist_rows}
    notified_emails = sorted({row[2] for row in wishlist_rows if row[2]})

    multiplier = (Decimal("100") - payload.discount_rate) / Decimal("100")
    discounted_products: list[DiscountedProductRead] = []
    for product in products:
        old_price = _money(product.price)
        new_price = _money(old_price * multiplier)
        product.price = new_price
        discounted_products.append(
            DiscountedProductRead(
                product_id=product.product_id,
                name=product.name,
                old_price=old_price,
                new_price=new_price,
                discount_rate=payload.discount_rate,
                wishlist_users_notified=wishlist_counts[product.product_id],
            )
        )

    db.commit()
    return DiscountApplyResult(
        message="Discount applied to selected products.",
        products=discounted_products,
        notified_users_count=len(notified_user_ids),
        notified_emails=notified_emails,
    )


@router.get("/invoices", response_model=list[OrderRead])
def list_invoices(
    admin_user_id: int = Query(ge=1),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    db: Session = Depends(get_db),
) -> list[OrderRead]:
    _require_admin(db, admin_user_id)
    orders = _orders_in_range(db, start_date, end_date)
    return [OrderRead.model_validate(order) for order in orders]


@router.get("/analytics", response_model=FinancialSummary)
def financial_summary(
    admin_user_id: int = Query(ge=1),
    start_date: date | None = Query(default=None),
    end_date: date | None = Query(default=None),
    cost_rate: Decimal = Query(default=Decimal("0.70"), ge=0, le=1),
    db: Session = Depends(get_db),
) -> FinancialSummary:
    _require_admin(db, admin_user_id)
    orders = _orders_in_range(db, start_date, end_date)

    revenue = Decimal("0.00")
    refunded_loss = Decimal("0.00")
    estimated_cost = Decimal("0.00")
    order_count = 0
    refund_count = 0
    daily: dict[date, dict[str, Decimal | int]] = {}

    for order in orders:
        order_day = order.created_at.date()
        daily.setdefault(
            order_day,
            {
                "revenue": Decimal("0.00"),
                "refunded_loss": Decimal("0.00"),
                "estimated_cost": Decimal("0.00"),
                "order_count": 0,
            },
        )
        status_value = (order.status or "").lower()

        if status_value == "refunded":
            refunded_loss += _money(order.total)
            refund_count += 1
            daily[order_day]["refunded_loss"] = _money(daily[order_day]["refunded_loss"] + _money(order.total))
            continue

        if status_value in {"cancelled", "refund_requested", "refund_rejected"}:
            continue

        order_revenue = _money(order.total)
        order_cost = _money(order.subtotal * cost_rate)
        revenue += order_revenue
        estimated_cost += order_cost
        order_count += 1
        daily[order_day]["revenue"] = _money(daily[order_day]["revenue"] + order_revenue)
        daily[order_day]["estimated_cost"] = _money(daily[order_day]["estimated_cost"] + order_cost)
        daily[order_day]["order_count"] = int(daily[order_day]["order_count"]) + 1

    net_revenue = _money(revenue - refunded_loss)
    estimated_profit = _money(net_revenue - estimated_cost)

    daily_points = [
        DailyFinancialPoint(
            day=day,
            revenue=_money(values["revenue"]),
            refunded_loss=_money(values["refunded_loss"]),
            estimated_profit=_money(values["revenue"] - values["refunded_loss"] - values["estimated_cost"]),
            order_count=int(values["order_count"]),
        )
        for day, values in sorted(daily.items())
    ]

    return FinancialSummary(
        start_date=start_date,
        end_date=end_date,
        revenue=_money(revenue),
        net_revenue=net_revenue,
        refunded_loss=_money(refunded_loss),
        estimated_cost=_money(estimated_cost),
        estimated_profit=estimated_profit,
        order_count=order_count,
        refund_count=refund_count,
        cost_rate=cost_rate,
        daily=daily_points,
    )


@router.get("/refunds", response_model=list[OrderRead])
def list_refund_requests(
    admin_user_id: int = Query(ge=1),
    include_resolved: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[OrderRead]:
    _require_admin(db, admin_user_id)
    statuses = ["refund_requested"]
    if include_resolved:
        statuses.extend(["refunded", "refund_rejected"])

    orders = db.scalars(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.status.in_(statuses))
        .order_by(Order.created_at.desc(), Order.order_id.desc())
    ).all()
    return [OrderRead.model_validate(order) for order in orders]


@router.patch("/refunds/{order_id}/approve", response_model=OrderRead)
def approve_refund(
    order_id: int,
    admin_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> OrderRead:
    _require_admin(db, admin_user_id)
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_id == order_id)
        .with_for_update()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    if order.status != "refund_requested":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order is not waiting for refund approval.")

    for item in order.items:
        if not item.product_id:
            continue
        product = db.scalar(
            select(Product)
            .where(Product.product_id == item.product_id)
            .with_for_update()
        )
        if product:
            product.stock_quantity = (product.stock_quantity or 0) + item.quantity

    order.status = "refunded"
    db.commit()
    return OrderRead.model_validate(order)


@router.patch("/refunds/{order_id}/reject", response_model=OrderRead)
def reject_refund(
    order_id: int,
    admin_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> OrderRead:
    _require_admin(db, admin_user_id)
    order = db.scalar(
        select(Order)
        .options(selectinload(Order.items))
        .where(Order.order_id == order_id)
        .with_for_update()
    )
    if not order:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Order not found.")
    if order.status != "refund_requested":
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="Order is not waiting for refund approval.")

    order.status = "refund_rejected"
    db.commit()
    return OrderRead.model_validate(order)
