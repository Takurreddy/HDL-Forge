"""Submission use cases."""
from abc import ABC, abstractmethod
from typing import Optional
from uuid import UUID

from app_new.application.dto.submissions import (
    SubmissionCreateDTO,
    SubmissionRunDTO,
    SubmissionSubmitDTO,
    SubmissionResponseDTO,
    SubmissionDTO,
)


class SubmissionUseCases(ABC):
    """Use cases for submission management."""

    @abstractmethod
    async def run_code(self, dto: SubmissionRunDTO, user_id: Optional[UUID] = None) -> SubmissionResponseDTO:
        """Run code against public test cases."""
        ...

    @abstractmethod
    async def submit_code(self, dto: SubmissionSubmitDTO, user_id: Optional[UUID] = None) -> SubmissionResponseDTO:
        """Submit code for final judging (all test cases)."""
        ...

    @abstractmethod
    async def get_submission(self, submission_id: UUID) -> Optional[SubmissionDTO]:
        """Get submission by ID."""
        ...

    @abstractmethod
    async def get_user_submissions(
        self,
        user_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> list[SubmissionDTO]:
        """Get submissions for a user."""
        ...

    @abstractmethod
    async def get_problem_submissions(
        self,
        problem_id: UUID,
        limit: int = 20,
        offset: int = 0,
    ) -> list[SubmissionDTO]:
        """Get submissions for a problem."""
        ...

    @abstractmethod
    async def get_user_best_submission(
        self,
        user_id: UUID,
        problem_id: UUID,
    ) -> Optional[SubmissionDTO]:
        """Get user's best submission for a problem."""
        ...