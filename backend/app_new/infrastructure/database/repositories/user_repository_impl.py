"""User repository implementation."""
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app_new.domain.repositories.users.user_repository import UserRepository
from app_new.domain.entities.users.user import User
from app_new.domain.value_objects.users import (
    Username,
    Email,
    UserRole,
)
from app_new.infrastructure.database.orm.models import UserORM
from app_new.infrastructure.database.orm.mappers import UserMapper


class SQLAlchemyUserRepository(UserRepository):
    """SQLAlchemy implementation of UserRepository."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, user_id: UUID) -> Optional[User]:
        result = await self._session.execute(
            select(UserORM).where(UserORM.id == str(user_id))
        )
        orm = result.scalar_one_or_none()
        return UserMapper.to_domain(orm) if orm else None

    async def get_by_username(self, username: Username) -> Optional[User]:
        result = await self._session.execute(
            select(UserORM).where(UserORM.username == username.value)
        )
        orm = result.scalar_one_or_none()
        return UserMapper.to_domain(orm) if orm else None

    async def get_by_email(self, email: Email) -> Optional[User]:
        result = await self._session.execute(
            select(UserORM).where(UserORM.email == email.value)
        )
        orm = result.scalar_one_or_none()
        return UserMapper.to_domain(orm) if orm else None

    async def get_all(self, limit: int = 50, offset: int = 0) -> List[User]:
        result = await self._session.execute(
            select(UserORM).order_by(UserORM.created_at.desc()).limit(limit).offset(offset)
        )
        return [UserMapper.to_domain(o) for o in result.scalars().all()]

    async def get_admins(self) -> List[User]:
        result = await self._session.execute(
            select(UserORM).where(UserORM.role.in_([UserRole.ADMIN, UserRole.MODERATOR]))
        )
        return [UserMapper.to_domain(o) for o in result.scalars().all()]

    async def add(self, user: User) -> User:
        orm = UserMapper.to_orm(user)
        self._session.add(orm)
        await self._session.flush()
        return UserMapper.to_domain(orm)

    async def update(self, user: User) -> User:
        result = await self._session.execute(
            select(UserORM).where(UserORM.id == str(user.id))
        )
        orm = result.scalar_one_or_none()
        if not orm:
            raise ValueError(f"User {user.id} not found")

        orm.username = user.username.value
        orm.email = user.email.value
        orm.password_hash = user.password_hash.value
        orm.display_name = user.display_name.value
        orm.role = user.role
        orm.avatar_url = user.avatar_url.value if user.avatar_url else None
        orm.xp = user.xp.value
        orm.level = user.level.value
        orm.solved_count = user.solved_count
        orm.total_submissions = user.total_submissions
        orm.is_active = user.is_active
        orm.is_admin = user.role == UserRole.ADMIN
        orm.last_login_at = user.last_login_at
        orm.updated_at = user.updated_at

        await self._session.flush()
        return UserMapper.to_domain(orm)

    async def delete(self, user_id: UUID) -> bool:
        result = await self._session.execute(
            select(UserORM).where(UserORM.id == str(user_id))
        )
        orm = result.scalar_one_or_none()
        if not orm:
            return False
        await self._session.delete(orm)
        await self._session.flush()
        return True

    async def exists(self, user_id: UUID) -> bool:
        result = await self._session.execute(
            select(func.count()).select_from(UserORM).where(UserORM.id == str(user_id))
        )
        return (result.scalar() or 0) > 0

    async def username_exists(self, username: Username) -> bool:
        result = await self._session.execute(
            select(func.count()).select_from(UserORM).where(
                UserORM.username == username.value
            )
        )
        return (result.scalar() or 0) > 0

    async def email_exists(self, email: Email) -> bool:
        result = await self._session.execute(
            select(func.count()).select_from(UserORM).where(UserORM.email == email.value)
        )
        return (result.scalar() or 0) > 0