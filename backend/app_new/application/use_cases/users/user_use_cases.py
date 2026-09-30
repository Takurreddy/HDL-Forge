"""User use cases."""
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app_new.application.dto.users import UserCreateDTO, UserUpdateDTO, UserDTO, UserLoginDTO, TokenDTO


class UserUseCases(ABC):
    """Use cases for user management."""

    @abstractmethod
    async def register_user(self, dto: UserCreateDTO) -> UserDTO:
        """Register a new user."""
        ...

    @abstractmethod
    async def login_user(self, dto: UserLoginDTO) -> TokenDTO:
        """Login user and return tokens."""
        ...

    @abstractmethod
    async def refresh_token(self, refresh_token: str) -> TokenDTO:
        """Refresh access token."""
        ...

    @abstractmethod
    async def get_user(self, user_id: UUID) -> Optional[UserDTO]:
        """Get user by ID."""
        ...

    @abstractmethod
    async def get_user_by_username(self, username: str) -> Optional[UserDTO]:
        """Get user by username."""
        ...

    @abstractmethod
    async def update_user(self, user_id: UUID, dto: UserUpdateDTO) -> Optional[UserDTO]:
        """Update user profile."""
        ...

    @abstractmethod
    async def change_password(self, user_id: UUID, current_password: str, new_password: str) -> bool:
        """Change user password."""
        ...

    @abstractmethod
    async def deactivate_user(self, user_id: UUID) -> bool:
        """Deactivate user account."""
        ...

    @abstractmethod
    async def list_users(self, limit: int = 50, offset: int = 0) -> list[UserDTO]:
        """List users with pagination."""
        ...