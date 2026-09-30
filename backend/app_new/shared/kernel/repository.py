"""Repository base interface for data access."""
from abc import ABC, abstractmethod
from typing import Generic, TypeVar, Optional, List
from uuid import UUID

from app_new.shared.kernel.base_entity import BaseEntity

ID = TypeVar("ID", bound=UUID)
T = TypeVar("T", bound=BaseEntity)


class Repository(ABC, Generic[T, ID]):
    """Base repository interface."""

    @abstractmethod
    async def get_by_id(self, id: ID) -> Optional[T]:
        """Get entity by ID."""
        ...

    @abstractmethod
    async def get_all(self) -> List[T]:
        """Get all entities."""
        ...

    @abstractmethod
    async def add(self, entity: T) -> T:
        """Add new entity."""
        ...

    @abstractmethod
    async def update(self, entity: T) -> T:
        """Update existing entity."""
        ...

    @abstractmethod
    async def delete(self, id: ID) -> bool:
        """Delete entity by ID."""
        ...

    @abstractmethod
    async def exists(self, id: ID) -> bool:
        """Check if entity exists."""
        ...