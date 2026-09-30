"""User repository interface."""
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

from app_new.domain.entities.users.user import User
from app_new.domain.value_objects.users import Username, Email


class UserRepository(ABC):
    """Repository interface for User entities."""

    @abstractmethod
    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        """Get user by ID."""
        ...

    @abstractmethod
    async def get_by_username(self, username: Username) -> Optional[User]:
        """Get user by username."""
        ...

    @abstractmethod
    async def get_by_email(self, email: Email) -> Optional[User]:
        """Get user by email."""
        ...

    @abstractmethod
    async def get_all(self, limit: int = 50, offset: int = 0) -> List[User]:
        """Get all users with pagination."""
        ...

    @abstractmethod
    async def get_admins(self) -> List[User]:
        """Get all admin users."""
        ...

    @abstractmethod
    async def add(self, user: User) -> User:
        """Add a new user."""
        ...

    @abstractmethod
    async def update(self, user: User) -> User:
        """Update an existing user."""
        ...

    @abstractmethod
    async def delete(self, user_id: UUID) -> bool:
        """Delete a user."""
        ...

    @abstractmethod
    async def exists(self, user_id: UUID) -> bool:
        """Check if user exists."""
        ...

    @abstractmethod
    async def username_exists(self, username: Username) -> bool:
        """Check if username exists."""
        ...

    @abstractmethod
    async def email_exists(self, email: Email) -> bool:
        """Check if email exists."""
        ...