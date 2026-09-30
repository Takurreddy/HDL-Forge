"""User domain value objects."""
from dataclasses import dataclass
from enum import Enum
from typing import Optional
from uuid import UUID

from app_new.shared.kernel.value_object import ValueObject


class UserRole(str, Enum):
    """User roles."""
    USER = "USER"
    ADMIN = "ADMIN"
    MODERATOR = "MODERATOR"


@dataclass(frozen=True)
class UserId(ValueObject):
    """User ID value object."""
    value: UUID

    def __post_init__(self) -> None:
        if isinstance(self.value, str):
            object.__setattr__(self, "value", UUID(self.value))


@dataclass(frozen=True)
class Username(ValueObject):
    """Username value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Username cannot be empty")
        if len(self.value) < 3:
            raise ValueError("Username must be at least 3 characters")
        if len(self.value) > 50:
            raise ValueError("Username too long")
        if not self.value.replace("_", "").replace("-", "").isalnum():
            raise ValueError("Username can only contain alphanumeric characters, underscores, and hyphens")


@dataclass(frozen=True)
class DisplayName(ValueObject):
    """Display name value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Display name cannot be empty")
        if len(self.value) > 100:
            raise ValueError("Display name too long")


@dataclass(frozen=True)
class Email(ValueObject):
    """Email value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value or not self.value.strip():
            raise ValueError("Email cannot be empty")
        if "@" not in self.value:
            raise ValueError("Invalid email format")
        if len(self.value) > 255:
            raise ValueError("Email too long")


@dataclass(frozen=True)
class PasswordHash(ValueObject):
    """Password hash value object."""
    value: str

    def __post_init__(self) -> None:
        if not self.value:
            raise ValueError("Password hash cannot be empty")


@dataclass(frozen=True)
class AvatarUrl(ValueObject):
    """Avatar URL value object."""
    value: Optional[str]

    def __post_init__(self) -> None:
        if self.value is not None and len(self.value) > 500:
            raise ValueError("Avatar URL too long")


@dataclass(frozen=True)
class UserXP(ValueObject):
    """User XP value object."""
    value: int

    def __post_init__(self) -> None:
        if self.value < 0:
            raise ValueError("XP cannot be negative")


@dataclass(frozen=True)
class UserLevel(ValueObject):
    """User level value object."""
    value: int

    def __post_init__(self) -> None:
        if self.value < 1:
            raise ValueError("Level must be at least 1")