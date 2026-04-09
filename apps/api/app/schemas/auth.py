import re
from pydantic import BaseModel, ConfigDict, EmailStr, Field, field_validator

PASSWORD_RULES_MESSAGE = (
    "Password must be at least 8 characters and include uppercase, lowercase, "
    "number, special character, and no spaces."
)

class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    tax_id: str | None = Field(default=None, max_length=50)
    home_address: str | None = None

    @field_validator("password")
    @classmethod
    def validate_password_strength(cls, value: str) -> str:
        if re.search(r"\s", value):
            raise ValueError(PASSWORD_RULES_MESSAGE)
        if not re.search(r"[A-Z]", value):
            raise ValueError(PASSWORD_RULES_MESSAGE)
        if not re.search(r"[a-z]", value):
            raise ValueError(PASSWORD_RULES_MESSAGE)
        if not re.search(r"\d", value):
            raise ValueError(PASSWORD_RULES_MESSAGE)
        if not re.search(r"[^\w\s]", value):
            raise ValueError(PASSWORD_RULES_MESSAGE)
        return value


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)

    @field_validator("email", mode="before")
    @classmethod
    def validate_login_email_not_blank(cls, value: str) -> str:
        if isinstance(value, str) and not value.strip():
            raise ValueError("Email can't be left blank.")
        return value

    @field_validator("password", mode="before")
    @classmethod
    def validate_login_password_not_blank(cls, value: str) -> str:
        if isinstance(value, str) and not value.strip():
            raise ValueError("Password can't be left blank.")
        return value


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)
    user_id: int
    name: str | None
    email: EmailStr | None
    tax_id: str | None
    home_address: str | None


class UserUpdate(BaseModel):
    name: str = Field(min_length=1, max_length=100)


class AuthResponse(BaseModel):
    message: str
    user: UserRead


class ActionResponse(BaseModel):
    message: str
