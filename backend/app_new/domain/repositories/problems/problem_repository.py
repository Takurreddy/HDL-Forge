"""Problem repository interface."""
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID

from app_new.domain.entities.problems.problem import Problem
from app_new.domain.value_objects.problems import ProblemSlug, Difficulty, ProblemCategory


class ProblemRepository(ABC):
    """Repository interface for Problem entities."""

    @abstractmethod
    async def get_by_id(self, problem_id: UUID) -> Optional[Problem]:
        """Get problem by ID."""
        ...

    @abstractmethod
    async def get_by_slug(self, slug: ProblemSlug) -> Optional[Problem]:
        """Get problem by slug."""
        ...

    @abstractmethod
    async def get_all(
        self,
        difficulty: Optional[Difficulty] = None,
        category: Optional[ProblemCategory] = None,
        published_only: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Problem]:
        """Get all problems with optional filters."""
        ...

    @abstractmethod
    async def search(self, query: str, limit: int = 20) -> List[Problem]:
        """Search problems by title or description."""
        ...

    @abstractmethod
    async def add(self, problem: Problem) -> Problem:
        """Add a new problem."""
        ...

    @abstractmethod
    async def update(self, problem: Problem) -> Problem:
        """Update an existing problem."""
        ...

    @abstractmethod
    async def delete(self, problem_id: UUID) -> bool:
        """Delete a problem."""
        ...

    @abstractmethod
    async def exists(self, problem_id: UUID) -> bool:
        """Check if problem exists."""
        ...

    @abstractmethod
    async def count(
        self,
        difficulty: Optional[Difficulty] = None,
        category: Optional[ProblemCategory] = None,
        published_only: bool = True,
    ) -> int:
        """Count problems with filters."""
        ...