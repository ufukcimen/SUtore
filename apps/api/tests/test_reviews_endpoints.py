from decimal import Decimal

import pytest
from fastapi import HTTPException

from app.api.v1.endpoints.reviews import get_my_review, update_review
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewUpdate


def seed_review_state(db_session) -> tuple[User, User, Product, Review]:
    owner = User(
        user_id=1,
        name="Review Owner",
        email="owner@example.com",
        password_hash="hashed-password",
    )
    other_user = User(
        user_id=2,
        name="Other User",
        email="other@example.com",
        password_hash="hashed-password",
    )
    product = Product(
        product_id=100,
        name="Reviewable GPU",
        model="RTX Review",
        description="GPU for review tests",
        price=Decimal("499.99"),
        stock_quantity=4,
        category="component",
        item_type="gpu",
        is_active=True,
    )
    review = Review(
        review_id=10,
        user_id=owner.user_id,
        product_id=product.product_id,
        rating=4,
        comment=None,
        status="approved",
    )
    db_session.add_all([owner, other_user, product, review])
    db_session.commit()
    return owner, other_user, product, review


def test_get_my_review_returns_the_users_private_review(db_session) -> None:
    owner, _, product, review = seed_review_state(db_session)

    result = get_my_review(
        product_id=product.product_id,
        user_id=owner.user_id,
        db=db_session,
    )

    assert result.review_id == review.review_id
    assert result.user_id == owner.user_id
    assert result.user_name == "Review Owner"


def test_update_review_changes_rating_and_sends_comments_to_moderation(db_session) -> None:
    owner, _, _, review = seed_review_state(db_session)

    result = update_review(
        review.review_id,
        ReviewUpdate(
            user_id=owner.user_id,
            rating=5,
            comment="  Updated written review.  ",
        ),
        db_session,
    )

    assert result.rating == 5
    assert result.comment == "Updated written review."
    assert result.status == "pending"


def test_update_review_without_comment_keeps_rating_public(db_session) -> None:
    owner, _, _, review = seed_review_state(db_session)

    result = update_review(
        review.review_id,
        ReviewUpdate(user_id=owner.user_id, rating=3, comment="   "),
        db_session,
    )

    assert result.rating == 3
    assert result.comment is None
    assert result.status == "approved"


def test_update_review_rejects_non_owner(db_session) -> None:
    _, other_user, _, review = seed_review_state(db_session)

    with pytest.raises(HTTPException) as exc_info:
        update_review(
            review.review_id,
            ReviewUpdate(user_id=other_user.user_id, rating=5, comment=None),
            db_session,
        )

    assert exc_info.value.status_code == 403
    assert exc_info.value.detail == "Access denied."
