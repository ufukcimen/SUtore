from datetime import UTC, datetime, timedelta

import pytest
from fastapi import BackgroundTasks, HTTPException
from sqlalchemy import select

from app.api.v1.endpoints import auth as auth_endpoints
from app.api.v1.endpoints.auth import delete_user, login, signup, update_user
from app.core.security import verify_password
from app.models.user import User
from app.schemas.auth import PasswordResetConfirm, PasswordResetRequest, UserCreate, UserLogin, UserUpdate


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


def test_password_reset_request_stores_hashed_token_and_reset_updates_password(db_session, monkeypatch) -> None:
    created_user = signup(
        UserCreate(
            name="Reset User",
            email="reset@example.com",
            password="StrongPass1!",
        ),
        db_session,
    ).user
    monkeypatch.setattr(auth_endpoints.secrets, "token_urlsafe", lambda _: "reset-token")
    background_tasks = BackgroundTasks()

    request_response = auth_endpoints.request_password_reset(
        PasswordResetRequest(email="reset@example.com"),
        background_tasks,
        db_session,
    )
    stored_user = db_session.get(User, created_user.user_id)

    assert request_response.message == auth_endpoints.PASSWORD_RESET_REQUEST_MESSAGE
    assert stored_user.password_reset_token_hash == auth_endpoints.hash_reset_token("reset-token")
    assert stored_user.password_reset_token_hash != "reset-token"
    assert stored_user.password_reset_expires_at is not None
    assert len(background_tasks.tasks) == 1

    reset_response = auth_endpoints.reset_password(
        PasswordResetConfirm(token="reset-token", password="NewStrong1!"),
        db_session,
    )
    db_session.refresh(stored_user)

    assert reset_response.message == "Password updated. You can sign in with your new password."
    assert verify_password("NewStrong1!", stored_user.password_hash)
    assert stored_user.password_reset_token_hash is None
    assert stored_user.password_reset_expires_at is None


def test_password_reset_request_does_not_reveal_unknown_email(db_session) -> None:
    background_tasks = BackgroundTasks()

    response = auth_endpoints.request_password_reset(
        PasswordResetRequest(email="missing@example.com"),
        background_tasks,
        db_session,
    )

    assert response.message == auth_endpoints.PASSWORD_RESET_REQUEST_MESSAGE
    assert len(background_tasks.tasks) == 0


def test_reset_password_rejects_expired_token(db_session) -> None:
    created_user = signup(
        UserCreate(
            name="Expired User",
            email="expired@example.com",
            password="StrongPass1!",
        ),
        db_session,
    ).user
    stored_user = db_session.get(User, created_user.user_id)
    stored_user.password_reset_token_hash = auth_endpoints.hash_reset_token("expired-token")
    stored_user.password_reset_expires_at = datetime.now(UTC) - timedelta(minutes=1)
    db_session.commit()

    with pytest.raises(HTTPException) as exc_info:
        auth_endpoints.reset_password(
            PasswordResetConfirm(token="expired-token", password="NewStrong1!"),
            db_session,
        )
    db_session.refresh(stored_user)

    assert exc_info.value.status_code == 400
    assert exc_info.value.detail == auth_endpoints.PASSWORD_RESET_INVALID_MESSAGE
    assert stored_user.password_reset_token_hash is None
    assert stored_user.password_reset_expires_at is None
