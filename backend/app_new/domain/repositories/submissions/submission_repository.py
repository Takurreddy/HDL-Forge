"""Submission repository interface."""
from abc import ABC, abstractmethod
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from app_new.domain.entities.submissions.submission import Submission
from app_new.domain.value_objects.submissions import SubmissionStatus


class SubmissionRepository(ABC):
    """Repository interface for Submission entities."""

    @abstractmethod
    async def get_by_id(self, submission_id: UUID) -> Optional[Submission]:
        """Get submission by ID."""
        ...

    @abstractmethod
    async def get_by_user_and_problem(
        self,
        user_id: UUID,
        problem_id: UUID,
        limit: int = 10,
    ) -> List[Submission]:
        """Get submissions by user and problem."""
        ...

    @abstractmethod
    async def get_user_submissions(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Submission]:
        """Get all submissions for a user."""
        ...

    @abstractmethod
    async def get_problem_submissions(
        self,
        problem_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> List[Submission]:
        """Get all submissions for a problem."""
        ...

    @abstractmethod
    async def get_recent_submissions(
        self,
        limit: int = 50,
        since: Optional[datetime] = None,
    ) -> List[Submission]:
        """Get recent submissions."""
        ...

    @abstractmethod
    async def get_best_submission(
        self,
        user_id: UUID,
        problem_id: UUID,
    ) -> Optional[Submission]:
        """Get best submission for user and problem."""
        ...

    @abstractmethod
    async def add(self, submission: Submission) -> Submission:
        """Add a new submission."""
        ...

    @abstractmethod
    async def update(self, submission: Submission) -> Submission:
        """Update an existing submission."""
        ...

    @abstractmethod
    async def delete(self, submission_id: UUID) -> bool:
        """Delete a submission."""
        ...

    @abstractmethod
    async def exists(self, submission_id: UUID) -> bool:
        """Check if submission exists."""
        ...

    @abstractmethod
    async def count_user_submissions(self, user_id: UUID) -> int:
        """Count total submissions for a user."""
        ...

    @abstractmethod
    async def count_problem_submissions(self, problem_id: UUID) -> int:
        """Count total submissions for a problem."""
        ...