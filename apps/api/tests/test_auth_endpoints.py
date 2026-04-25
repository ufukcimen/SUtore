import pytest
from fastapi import HTTPException
from sqlalchemy import select

from app.api.v1.endpoints.auth import delete_user, login, signup, update_user
from app.core.security import verify_password
from app.models.user import User
from app.schemas.auth import UserCreate, UserLogin, UserUpdate


def test_signup_trims_name_and_hashes_the_password(db_session) -> None:
    response = signup(
            UserCreate(
                name="  Ada Lovelace  ",
                email="ada@example.com",
                password="StrongPass1!",
            ),
            db_session,
        )

    stored_user = db_session.scalar(select(User).where(User.email == "ada@example.com"))

    assert response.message == "User created successfully."
    assert response.user.name == "Ada Lovelace"
    assert stored_user is not None
    assert stored_user.password_hash != "StrongPass1!"
    assert verify_password("StrongPass1!", stored_user.password_hash)


def test_login_rejects_an_invalid_password(db_session) -> None:
    signup(
        UserCreate(
            name="Grace Hopper",
            email="grace@example.com",
            password="StrongPass1!",
        ),
        db_session,
    )

    with pytest.raises(HTTPException) as exc_info:
        login(
            UserLogin(email="grace@example.com", password="WrongPass1!"),
            db_session,
        )

    assert exc_info.value.status_code == 401
    assert exc_info.value.detail == "Invalid email or password."


def test_signup_rejects_duplicate_email_addresses(db_session) -> None:
    payload = UserCreate(
        name="First User",
        email="duplicate@example.com",
        password="StrongPass1!",
    )
    signup(payload, db_session)

    with pytest.raises(HTTPException) as exc_info:
        signup(
            UserCreate(
                name="Second User",
                email="duplicate@example.com",
                password="StrongPass1!",
            ),
            db_session,
        )

    assert exc_info.value.status_code == 409
    assert exc_info.value.detail == "A user with this email already exists."


def test_update_and_delete_account_changes_persist(db_session) -> None:
    created_user = signup(
        UserCreate(
            name="Original Name",
            email="user@example.com",
            password="StrongPass1!",
        ),
        db_session,
    ).user

    update_response = update_user(
        created_user.user_id,
        UserUpdate(name="  Updated Name  "),
        db_session,
    )
    delete_response = delete_user(created_user.user_id, db_session)

    assert update_response.user.name == "Updated Name"
    assert delete_response.message == "Account deleted."
    assert db_session.get(User, created_user.user_id) is None
