"""User application service - implements user use cases."""
from typing import Optional, List
from uuid import UUID

from app_new.application.use_cases.users.user_use_cases import UserUseCases
from app_new.application.dto.users import UserCreateDTO, UserUpdateDTO, UserDTO, UserLoginDTO, TokenDTO
from app_new.domain.entities.users.user import User
from app_new.domain.value_objects.users import Username, Email, UserRole
from app_new.domain.repositories.users.user_repository import UserRepository
from app_new.application.ports import AuthenticationPort
from app_new.domain.exceptions import EntityNotFoundException, EntityAlreadyExistsException, ValidationException


class UserService(UserUseCases):
    """Application service for user management."""

    def __init__(
        self,
        user_repository: UserRepository,
        auth_port: AuthenticationPort,
    ):
        self._user_repository = user_repository
        self._auth_port = auth_port

    async def register_user(self, dto: UserCreateDTO) -> UserDTO:
        """Register a new user."""
        # Check if username exists
        if await self._user_repository.username_exists(Username(dto.username)):
            raise EntityAlreadyExistsException("User", f"username '{dto.username}'")

        # Check if email exists
        if await self._user_repository.email_exists(Email(dto.email)):
            raise EntityAlreadyExistsException("User", f"email '{dto.email}'")

        # Hash password
        password_hash = await self._auth_port.hash_password(dto.password)

        # Create user
        user = User.create(
            username=dto.username,
            email=dto.email,
            password_hash=password_hash,
            display_name=dto.display_name,
        )

        # Save user
        saved_user = await self._user_repository.add(user)
        return self._to_dto(saved_user)

    async def login_user(self, dto: UserLoginDTO) -> TokenDTO:
        """Login user and return tokens."""
        user = await self._user_repository.get_by_email(Email(dto.email))
        if not user:
            raise ValidationException("email", "Invalid email or password")

        # Verify password
        if not await self._auth_port.verify_password(dto.password, user.password_hash.value):
            raise ValidationException("password", "Invalid email or password")

        if not user.is_active:
            raise ValidationException("account", "Account is deactivated")

        # Create tokens
        access_token = await self._auth_port.create_token(user.id)
        refresh_token = await self._auth_port.create_refresh_token(user.id)

        # Record login
        user.record_login()
        await self._user_repository.update(user)

        return TokenDTO(
            access_token=access_token,
            refresh_token=refresh_token,
        )

    async def refresh_token(self, refresh_token: str) -> TokenDTO:
        """Refresh access token."""
        user_id = await self._auth_port.verify_refresh_token(refresh_token)
        if not user_id:
            raise ValidationException("refresh_token", "Invalid or expired refresh token")

        user = await self._user_repository.get_by_id(user_id)
        if not user or not user.is_active:
            raise ValidationException("account", "User not found or deactivated")

        access_token = await self._auth_port.create_token(user_id)
        new_refresh_token = await self._auth_port.create_refresh_token(user_id)

        return TokenDTO(
            access_token=access_token,
            refresh_token=new_refresh_token,
        )

    async def get_user(self, user_id: UUID) -> Optional[UserDTO]:
        """Get user by ID."""
        user = await self._user_repository.get_by_id(user_id)
        if not user:
            return None
        return self._to_dto(user)

    async def get_user_by_username(self, username: str) -> Optional[UserDTO]:
        """Get user by username."""
        user = await self._user_repository.get_by_username(Username(username))
        if not user:
            return None
        return self._to_dto(user)

    async def update_user(self, user_id: UUID, dto: UserUpdateDTO) -> Optional[UserDTO]:
        """Update user profile."""
        user = await self._user_repository.get_by_id(user_id)
        if not user:
            raise EntityNotFoundException("User", user_id)

        if dto.display_name is not None:
            user.update_profile(display_name=dto.display_name)

        if dto.avatar_url is not None:
            user.update_profile(avatar_url=dto.avatar_url)

        if dto.password is not None:
            password_hash = await self._auth_port.hash_password(dto.password)
            user.update_password(password_hash)

        updated_user = await self._user_repository.update(user)
        return self._to_dto(updated_user)

    async def change_password(self, user_id: UUID, current_password: str, new_password: str) -> bool:
        """Change user password."""
        user = await self._user_repository.get_by_id(user_id)
        if not user:
            raise EntityNotFoundException("User", user_id)

        if not await self._auth_port.verify_password(current_password, user.password_hash.value):
            raise ValidationException("current_password", "Current password is incorrect")

        password_hash = await self._auth_port.hash_password(new_password)
        user.update_password(password_hash)
        await self._user_repository.update(user)
        return True

    async def deactivate_user(self, user_id: UUID) -> bool:
        """Deactivate user account."""
        user = await self._user_repository.get_by_id(user_id)
        if not user:
            raise EntityNotFoundException("User", user_id)

        user.deactivate()
        await self._user_repository.update(user)
        return True

    async def list_users(self, limit: int = 50, offset: int = 0) -> List[UserDTO]:
        """List users with pagination."""
        users = await self._user_repository.get_all(limit, offset)
        return [self._to_dto(u) for u in users]

    def _to_dto(self, user: User) -> UserDTO:
        """Convert User entity to DTO."""
        return UserDTO(
            id=user.id,
            username=user.username.value,
            email=user.email.value,
            display_name=user.display_name.value,
            role=user.role,
            avatar_url=user.avatar_url.value if user.avatar_url else None,
            xp=user.xp.value,
            level=user.level.value,
            solved_count=user.solved_count,
            total_submissions=user.total_submissions,
            is_active=user.is_active,
            created_at=user.created_at.isoformat(),
            last_login_at=user.last_login_at.isoformat() if user.last_login_at else None,
        )