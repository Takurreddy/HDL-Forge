"""User domain entity."""
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Optional
from uuid import UUID, uuid4

from app_new.domain.value_objects.users import (
    UserId,
    Username,
    DisplayName,
    Email,
    PasswordHash,
    AvatarUrl,
    UserXP,
    UserLevel,
    UserRole,
)
from app_new.shared.kernel.base_entity import BaseEntity


@dataclass
class User(BaseEntity[UUID]):
    """User domain entity."""
    username: Username
    email: Email
    password_hash: PasswordHash
    display_name: DisplayName
    role: UserRole = UserRole.USER
    avatar_url: Optional[AvatarUrl] = None
    xp: UserXP = field(default_factory=lambda: UserXP(0))
    level: UserLevel = field(default_factory=lambda: UserLevel(1))
    solved_count: int = 0
    total_submissions: int = 0
    is_active: bool = True
    last_login_at: Optional[datetime] = None

    @classmethod
    def create(
        cls,
        username: str,
        email: str,
        password_hash: str,
        display_name: str,
        role: UserRole = UserRole.USER,
    ) -> "User":
        """Create a new user."""
        return cls(
            id=uuid4(),
            username=Username(username),
            email=Email(email),
            password_hash=PasswordHash(password_hash),
            display_name=DisplayName(display_name),
            role=role,
        )

    def update_profile(
        self,
        display_name: Optional[str] = None,
        avatar_url: Optional[str] = None,
    ) -> None:
        """Update user profile."""
        if display_name is not None:
            self.display_name = DisplayName(display_name)
        if avatar_url is not None:
            self.avatar_url = AvatarUrl(avatar_url)
        self.update_timestamp()

    def update_password(self, new_password_hash: str) -> None:
        """Update user password."""
        self.password_hash = PasswordHash(new_password_hash)
        self.update_timestamp()

    def add_xp(self, amount: int) -> None:
        """Add XP to user."""
        self.xp = UserXP(self.xp.value + amount)
        self.update_timestamp()

    def increment_solved_count(self) -> None:
        """Increment solved problems count."""
        self.solved_count += 1
        self.update_timestamp()

    def increment_submissions(self) -> None:
        """Increment total submissions count."""
        self.total_submissions += 1
        self.update_timestamp()

    def record_login(self) -> None:
        """Record user login."""
        self.last_login_at = datetime.now(timezone.utc)
        self.update_timestamp()

    def deactivate(self) -> None:
        """Deactivate user account."""
        self.is_active = False
        self.update_timestamp()

    def activate(self) -> None:
        """Activate user account."""
        self.is_active = True
        self.update_timestamp()

    def promote_to_admin(self) -> None:
        """Promote user to admin."""
        self.role = UserRole.ADMIN
        self.update_timestamp()

    def promote_to_moderator(self) -> None:
        """Promote user to moderator."""
        self.role = UserRole.MODERATOR
        self.update_timestamp()