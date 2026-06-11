from fastapi import APIRouter, Depends, HTTPException, Query, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.db.session import get_db
from app.models.notification import Notification
from app.models.user import User
from app.schemas.notification import NotificationRead

router = APIRouter()


def _require_user(db: Session, user_id: int) -> User:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found.")
    return user


@router.get("", response_model=list[NotificationRead])
def list_notifications(
    user_id: int = Query(ge=1),
    unread_only: bool = Query(default=False),
    db: Session = Depends(get_db),
) -> list[NotificationRead]:
    _require_user(db, user_id)
    statement = (
        select(Notification)
        .where(Notification.user_id == user_id)
        .order_by(Notification.created_at.desc(), Notification.notification_id.desc())
    )
    if unread_only:
        statement = statement.where(Notification.is_read == False)

    notifications = db.scalars(statement).all()
    return [NotificationRead.model_validate(entry) for entry in notifications]


@router.patch("/read-all", response_model=list[NotificationRead])
def mark_all_notifications_read(
    user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> list[NotificationRead]:
    _require_user(db, user_id)
    notifications = db.scalars(
        select(Notification)
        .where(Notification.user_id == user_id, Notification.is_read == False)
        .order_by(Notification.created_at.desc(), Notification.notification_id.desc())
    ).all()
    for notification in notifications:
        notification.is_read = True

    db.commit()
    return [NotificationRead.model_validate(notification) for notification in notifications]


@router.patch("/{notification_id}/read", response_model=NotificationRead)
def mark_notification_read(
    notification_id: int,
    user_id: int = Query(ge=1),
    db: Session = Depends(get_db),
) -> NotificationRead:
    _require_user(db, user_id)
    notification = db.get(Notification, notification_id)
    if not notification or notification.user_id != user_id:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Notification not found.")

    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return NotificationRead.model_validate(notification)
