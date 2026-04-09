from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy import select
from sqlalchemy.orm import Session

from app.core.security import get_password_hash, verify_password
from app.db.session import get_db
from app.models.user import User
from app.schemas.auth import ActionResponse, AuthResponse, UserCreate, UserLogin, UserRead, UserUpdate

router = APIRouter()


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
