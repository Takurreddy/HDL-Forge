"""Base entity class for domain entities."""
from abc import ABC
from dataclasses import dataclass, field
from datetime import datetime, timezone
from typing import Any, Generic, TypeVar
from uuid import UUID, uuid4


ID = TypeVar("ID", bound=UUID)


@dataclass
class BaseEntity(ABC, Generic[ID]):
    """Base class for all domain entities."""
    id: ID = field(default_factory=uuid4)
    created_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))
    updated_at: datetime = field(default_factory=lambda: datetime.now(timezone.utc))

    def __post_init__(self) -> None:
        if isinstance(self.id, str):
            self.id = UUID(self.id)

    def update_timestamp(self) -> None:
        """Update the updated_at timestamp."""
        self.updated_at = datetime.now(timezone.utc)

    def __eq__(self, other: Any) -> bool:
        if not isinstance(other, BaseEntity):
            return False
        return self.id == other.id

    def __hash__(self) -> int:
        return hash(self.id)