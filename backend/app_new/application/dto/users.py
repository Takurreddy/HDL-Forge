"""Application DTOs for users."""
from dataclasses import dataclass
from typing import Optional
from uuid import UUID

from app_new.domain.value_objects.users import UserRole


@dataclass
class UserCreateDTO:
    """DTO for creating a user."""
    username: str
    email: str
    password: str
    display_name: str


@dataclass
class UserUpdateDTO:
    """DTO for updating a user."""
    display_name: Optional[str] = None
    avatar_url: Optional[str] = None
    password: Optional[str] = None


@dataclass
class UserLoginDTO:
    """DTO for user login."""
    email: str
    password: str


@dataclass
class UserDTO:
    """DTO for user representation."""
    id: UUID
    username: str
    email: str
    display_name: str
    role: UserRole
    avatar_url: Optional[str]
    xp: int
    level: int
    solved_count: int
    total_submissions: int
    is_active: bool
    created_at: str
    last_login_at: Optional[str]


@dataclass
class TokenDTO:
    """DTO for authentication tokens."""
    access_token: str
    refresh_token: str
    token_type: str = "bearer"