from pydantic import BaseModel, ConfigDict, EmailStr, Field


class UserCreate(BaseModel):
    name: str = Field(min_length=1, max_length=100)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    tax_id: str | None = Field(default=None, max_length=50)
    home_address: str | None = None


class UserLogin(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserRead(BaseModel):
    model_config = ConfigDict(from_attributes=True)

    user_id: int
    name: str | None
    email: EmailStr | None
    tax_id: str | None
    home_address: str | None


class AuthResponse(BaseModel):
    message: str
    user: UserRead
