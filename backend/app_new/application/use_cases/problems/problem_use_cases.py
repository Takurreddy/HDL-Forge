"""Problem use cases."""
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app_new.application.dto.problems import ProblemCreateDTO, ProblemUpdateDTO, ProblemDTO, ProblemListDTO


class ProblemUseCases(ABC):
    """Use cases for problem management."""

    @abstractmethod
    async def create_problem(self, dto: ProblemCreateDTO, created_by: UUID) -> ProblemDTO:
        """Create a new problem."""
        ...

    @abstractmethod
    async def get_problem(self, problem_id: UUID) -> Optional[ProblemDTO]:
        """Get problem by ID."""
        ...

    @abstractmethod
    async def get_problem_by_slug(self, slug: str) -> Optional[ProblemDTO]:
        """Get problem by slug."""
        ...

    @abstractmethod
    async def list_problems(
        self,
        difficulty: Optional[str] = None,
        category: Optional[str] = None,
        published_only: bool = True,
        page: int = 1,
        page_size: int = 20,
    ) -> ProblemListDTO:
        """List problems with filters."""
        ...

    @abstractmethod
    async def search_problems(self, query: str, limit: int = 20) -> list[ProblemDTO]:
        """Search problems."""
        ...

    @abstractmethod
    async def update_problem(self, problem_id: UUID, dto: ProblemUpdateDTO) -> Optional[ProblemDTO]:
        """Update a problem."""
        ...

    @abstractmethod
    async def delete_problem(self, problem_id: UUID) -> bool:
        """Delete a problem."""
        ...

    @abstractmethod
    async def publish_problem(self, problem_id: UUID) -> Optional[ProblemDTO]:
        """Publish a problem."""
        ...

    @abstractmethod
    async def unpublish_problem(self, problem_id: UUID) -> Optional[ProblemDTO]:
        """Unpublish a problem."""
        ...