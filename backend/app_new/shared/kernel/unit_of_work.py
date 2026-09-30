"""Unit of Work pattern for transaction management."""
from abc import ABC, abstractmethod
from typing import AsyncGenerator
from contextlib import asynccontextmanager


class UnitOfWork(ABC):
    """Base Unit of Work interface for managing transactions."""

    @abstractmethod
    async def commit(self) -> None:
        """Commit the current transaction."""
        ...

    @abstractmethod
    async def rollback(self) -> None:
        """Rollback the current transaction."""
        ...

    @abstractmethod
    @asynccontextmanager
    async def transaction(self) -> AsyncGenerator[None, None]:
        """Context manager for transaction handling."""
        ...

    @abstractmethod
    async def close(self) -> None:
        """Close the unit of work."""
        ...