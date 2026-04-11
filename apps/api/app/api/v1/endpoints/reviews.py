from datetime import datetime, timezone

from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import func, select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.product import Product
from app.models.review import Review
from app.models.user import User
from app.schemas.review import ReviewCreate, ReviewRead, ReviewStatusUpdate, ReviewSummary

router = APIRouter()


def _enrich_review(review: Review, db: Session) -> ReviewRead:
    """Build a ReviewRead with the reviewer's display name attached."""
    entry = ReviewRead.model_validate(review)
    user = db.get(User, review.user_id)
    entry.user_name = user.name if user else None
    return entry


# ── Public: approved reviews for a product ──────────────────────────

@router.get("/product/{product_id}", response_model=list[ReviewRead])
def list_approved_reviews(
    product_id: int,
    db: Session = Depends(get_db),
) -> list[ReviewRead]:
    reviews = db.scalars(
        select(Review)
        .where(Review.product_id == product_id, Review.status == "approved")
        .order_by(Review.created_at.desc())
    ).all()

    return [_enrich_review(r, db) for r in reviews]


@router.get("/product/{product_id}/summary", response_model=ReviewSummary)
def review_summary(
    product_id: int,
    db: Session = Depends(get_db),
) -> ReviewSummary:
    row = db.execute(
        select(
            func.avg(Review.rating).label("avg"),
            func.count(Review.review_id).label("cnt"),
        ).where(Review.product_id == product_id, Review.status == "approved")
    ).one()

    avg_val = float(row.avg) if row.avg is not None else None
    return ReviewSummary(
        average_rating=round(avg_val, 1) if avg_val is not None else None,
        review_count=row.cnt,
    )


# ── Authenticated: submit a review ──────────────────────────────────

@router.post("", response_model=ReviewRead, status_code=status.HTTP_201_CREATED)
def submit_review(
    payload: ReviewCreate,
    db: Session = Depends(get_db),
) -> ReviewRead:
    user = db.get(User, payload.user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")

    product = db.get(Product, payload.product_id)
    if not product:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Product not found.")

    existing = db.scalars(
        select(Review).where(
            Review.user_id == payload.user_id,
            Review.product_id == payload.product_id,
        )
    ).first()

    if existing:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You have already submitted a review for this product.",
        )

    review = Review(
        user_id=payload.user_id,
        product_id=payload.product_id,
        rating=payload.rating,
        comment=payload.comment,
    )
    db.add(review)
    db.commit()
    db.refresh(review)

    return _enrich_review(review, db)


# ── Product manager moderation ──────────────────────────────────────

@router.get("/pending", response_model=list[ReviewRead])
def list_pending_reviews(
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> list[ReviewRead]:
    manager = db.get(User, manager_user_id)
    if not manager or manager.role != "product_manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    reviews = db.scalars(
        select(Review)
        .where(Review.status == "pending")
        .order_by(Review.created_at.asc())
    ).all()

    return [_enrich_review(r, db) for r in reviews]


@router.patch("/{review_id}/status", response_model=ReviewRead)
def update_review_status(
    review_id: int,
    payload: ReviewStatusUpdate,
    manager_user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> ReviewRead:
    manager = db.get(User, manager_user_id)
    if not manager or manager.role != "product_manager":
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Access denied.")

    review = db.get(Review, review_id)
    if not review:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Review not found.")

    review.status = payload.status
    review.updated_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(review)

    return _enrich_review(review, db)
