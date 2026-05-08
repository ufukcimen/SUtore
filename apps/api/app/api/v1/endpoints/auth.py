import hashlib
import logging
import secrets
from datetime import UTC, datetime, timedelta

from fastapi import APIRouter, BackgroundTasks, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.config import settings
from app.core.security import get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import (
    ActionResponse,
    AuthResponse,
    PasswordResetConfirm,
    PasswordResetRequest,
    UserCreate,
    UserLogin,
    UserRead,
    UserUpdate,
)
from app.services.password_reset import send_password_reset_email

router = APIRouter()
logger = logging.getLogger(__name__)

PASSWORD_RESET_REQUEST_MESSAGE = (
    "If an account exists for that email, we sent a password reset link."
)
PASSWORD_RESET_INVALID_MESSAGE = "Password reset link is invalid or has expired."


def hash_reset_token(token: str) -> str:
    return hashlib.sha256(token.encode("utf-8")).hexdigest()


def token_expires_at() -> datetime:
    return datetime.now(UTC) + timedelta(minutes=settings.password_reset_token_minutes)


def ensure_aware_utc(value: datetime) -> datetime:
    if value.tzinfo is None:
        return value.replace(tzinfo=UTC)
    return value.astimezone(UTC)


def queue_password_reset_email(email: str, token: str) -> None:
    try:
        sent = send_password_reset_email(email, token)
    except Exception:
        logger.exception("Password reset email delivery failed for %s.", email)
        return

    if not sent:
        logger.info(
            "Skipping password reset email for %s because SMTP is not configured.",
            email,
        )


@router.post("/signup", response_model=AuthResponse, status_code=status.HTTP_201_CREATED)
def signup(payload: UserCreate, db: Session = Depends(get_db)) -> AuthResponse:
    existing_user = db.scalar(select(User).where(User.email == payload.email))
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="A user with this email already exists.",
        )

    user = User(
        name=payload.name.strip(),
        email=payload.email,
        tax_id=payload.tax_id,
        home_address=payload.home_address,
        password_hash=get_password_hash(payload.password),
    )
    db.add(user)
    db.commit()
    db.refresh(user)

    return AuthResponse(
        message="User created successfully.",
        user=UserRead.model_validate(user),
    )


@router.post("/login", response_model=AuthResponse)
def login(payload: UserLogin, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if not user or not user.password_hash or not verify_password(payload.password, user.password_hash):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid email or password.",
        )

    return AuthResponse(
        message="Login successful.",
        user=UserRead.model_validate(user),
    )


@router.post("/forgot-password", response_model=ActionResponse)
def request_password_reset(
    payload: PasswordResetRequest,
    background_tasks: BackgroundTasks,
    db: Session = Depends(get_db),
) -> ActionResponse:
    user = db.scalar(select(User).where(User.email == payload.email))
    if user and user.email:
        token = secrets.token_urlsafe(32)
        user.password_reset_token_hash = hash_reset_token(token)
        user.password_reset_expires_at = token_expires_at()
        db.commit()
        background_tasks.add_task(queue_password_reset_email, str(user.email), token)

    return ActionResponse(message=PASSWORD_RESET_REQUEST_MESSAGE)


@router.post("/reset-password", response_model=ActionResponse)
def reset_password(payload: PasswordResetConfirm, db: Session = Depends(get_db)) -> ActionResponse:
    token_hash = hash_reset_token(payload.token)
    user = db.scalar(select(User).where(User.password_reset_token_hash == token_hash))
    if not user or not user.password_reset_expires_at:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=PASSWORD_RESET_INVALID_MESSAGE,
        )

    expires_at = ensure_aware_utc(user.password_reset_expires_at)
    if expires_at <= datetime.now(UTC):
        user.password_reset_token_hash = None
        user.password_reset_expires_at = None
        db.commit()
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=PASSWORD_RESET_INVALID_MESSAGE,
        )

    user.password_hash = get_password_hash(payload.password)
    user.password_reset_token_hash = None
    user.password_reset_expires_at = None
    db.commit()

    return ActionResponse(message="Password updated. You can sign in with your new password.")


@router.patch("/users/{user_id}", response_model=AuthResponse)
def update_user(user_id: int, payload: UserUpdate, db: Session = Depends(get_db)) -> AuthResponse:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    user.name = payload.name.strip()
    db.commit()
    db.refresh(user)

    return AuthResponse(
        message="Account details updated.",
        user=UserRead.model_validate(user),
    )


@router.delete("/users/{user_id}", response_model=ActionResponse)
def delete_user(user_id: int, db: Session = Depends(get_db)) -> ActionResponse:
    user = db.get(User, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found.",
        )

    db.delete(user)
    db.commit()

    return ActionResponse(message="Account deleted.")
