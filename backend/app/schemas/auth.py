from datetime import datetime

from pydantic import BaseModel, EmailStr, Field


class RegisterRequest(BaseModel):
    email: EmailStr
    username: str = Field(..., min_length=3, max_length=50)
    password: str = Field(..., min_length=6, max_length=100)
    display_name: str | None = Field(None, max_length=100)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str


class UserResponse(BaseModel):
    id: str
    username: str
    display_name: str | None
    avatar_url: str | None
    created_at: datetime
    last_login_at: datetime | None
    is_admin: bool = False


class AuthResponse(BaseModel):
    user: UserResponse
    token: str
