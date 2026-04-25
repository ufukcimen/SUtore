import pytest
from pydantic import ValidationError

from app.schemas.auth import PASSWORD_RULES_MESSAGE, UserCreate, UserLogin


def test_signup_rejects_passwords_that_fail_strength_rules() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UserCreate(
            name="Ada Lovelace",
            email="ada@example.com",
            password="alllowercase1!",
        )

    assert PASSWORD_RULES_MESSAGE in str(exc_info.value)


def test_login_rejects_blank_email_and_password_fields() -> None:
    with pytest.raises(ValidationError) as exc_info:
        UserLogin(email="   ", password="   ")

    messages = {error["msg"] for error in exc_info.value.errors()}
    assert "Value error, Email can't be left blank." in messages
    assert "Value error, Password can't be left blank." in messages
