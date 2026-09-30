"""Submission repository implementation."""
from typing import Optional, List
from uuid import UUID
from datetime import datetime

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app_new.domain.repositories.submissions.submission_repository import SubmissionRepository
from app_new.domain.entities.submissions.submission import Submission
from app_new.domain.value_objects.submissions import SubmissionStatus
from app_new.infrastructure.database.orm.models import SubmissionORM
from app_new.infrastructure.database.orm.mappers import SubmissionMapper


class SQLAlchemySubmissionRepository(SubmissionRepository):
    """SQLAlchemy implementation of SubmissionRepository."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, submission_id: UUID) -> Optional[Submission]:
        result = await self._session.execute(
            select(SubmissionORM)
            .options(selectinload(SubmissionORM.test_results))
            .where(SubmissionORM.id == str(submission_id))
        )
        orm = result.scalar_one_or_none()
        return SubmissionMapper.to_domain(orm) if orm else None

    async def get_by_user_and_problem(
        self, user_id: UUID, problem_id: UUID, limit: int = 10
    ) -> List[Submission]:
        stmt = (
            select(SubmissionORM)
            .options(selectinload(SubmissionORM.test_results))
            .where(
                SubmissionORM.user_id == str(user_id),
                SubmissionORM.problem_id == str(problem_id),
            )
            .order_by(SubmissionORM.created_at.desc())
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return [SubmissionMapper.to_domain(o) for o in result.scalars().all()]

    async def get_user_submissions(
        self, user_id: UUID, limit: int = 20, offset: int = 0
    ) -> List[Submission]:
        stmt = (
            select(SubmissionORM)
            .options(selectinload(SubmissionORM.test_results))
            .where(SubmissionORM.user_id == str(user_id))
            .order_by(SubmissionORM.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return [SubmissionMapper.to_domain(o) for o in result.scalars().all()]

    async def get_problem_submissions(
        self, problem_id: UUID, limit: int = 20, offset: int = 0
    ) -> List[Submission]:
        stmt = (
            select(SubmissionORM)
            .options(selectinload(SubmissionORM.test_results))
            .where(SubmissionORM.problem_id == str(problem_id))
            .order_by(SubmissionORM.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        result = await self._session.execute(stmt)
        return [SubmissionMapper.to_domain(o) for o in result.scalars().all()]

    async def get_recent_submissions(
        self, limit: int = 50, since: Optional[datetime] = None
    ) -> List[Submission]:
        stmt = select(SubmissionORM).options(selectinload(SubmissionORM.test_results))
        if since:
            stmt = stmt.where(SubmissionORM.created_at >= since)
        stmt = stmt.order_by(SubmissionORM.created_at.desc()).limit(limit)
        result = await self._session.execute(stmt)
        return [SubmissionMapper.to_domain(o) for o in result.scalars().all()]

    async def get_best_submission(
        self, user_id: UUID, problem_id: UUID
    ) -> Optional[Submission]:
        stmt = (
            select(SubmissionORM)
            .options(selectinload(SubmissionORM.test_results))
            .where(
                SubmissionORM.user_id == str(user_id),
                SubmissionORM.problem_id == str(problem_id),
                SubmissionORM.status == SubmissionStatus.PASSED,
            )
            .order_by(SubmissionORM.score.desc(), SubmissionORM.execution_time.asc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        orm = result.scalar_one_or_none()
        if orm:
            return SubmissionMapper.to_domain(orm)

        # Fall back to best score regardless of status
        stmt = (
            select(SubmissionORM)
            .options(selectinload(SubmissionORM.test_results))
            .where(
                SubmissionORM.user_id == str(user_id),
                SubmissionORM.problem_id == str(problem_id),
            )
            .order_by(SubmissionORM.score.desc())
            .limit(1)
        )
        result = await self._session.execute(stmt)
        orm = result.scalar_one_or_none()
        return SubmissionMapper.to_domain(orm) if orm else None

    async def add(self, submission: Submission) -> Submission:
        orm = SubmissionMapper.to_orm(submission)
        self._session.add(orm)
        await self._session.flush()
        await self._session.refresh(orm, attribute_names=["test_results"])
        return SubmissionMapper.to_domain(orm)

    async def update(self, submission: Submission) -> Submission:
        result = await self._session.execute(
            select(SubmissionORM)
            .options(selectinload(SubmissionORM.test_results))
            .where(SubmissionORM.id == str(submission.id))
        )
        orm = result.scalar_one_or_none()
        if not orm:
            raise ValueError(f"Submission {submission.id} not found")

        orm.status = submission.status
        orm.score = submission.score.value
        orm.tests_passed = submission.tests_passed.value
        orm.tests_total = submission.tests_total.value
        orm.execution_time = submission.execution_time.value
        orm.compilation_message = (
            submission.compilation_message.value if submission.compilation_message else None
        )
        orm.waveform_id = submission.waveform_id
        orm.xp_earned = submission.xp_earned

        await self._session.flush()
        return SubmissionMapper.to_domain(orm)

    async def delete(self, submission_id: UUID) -> bool:
        result = await self._session.execute(
            select(SubmissionORM).where(SubmissionORM.id == str(submission_id))
        )
        orm = result.scalar_one_or_none()
        if not orm:
            return False
        await self._session.delete(orm)
        await self._session.flush()
        return True

    async def exists(self, submission_id: UUID) -> bool:
        result = await self._session.execute(
            select(func.count())
            .select_from(SubmissionORM)
            .where(SubmissionORM.id == str(submission_id))
        )
        return (result.scalar() or 0) > 0

    async def count_user_submissions(self, user_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(SubmissionORM)
            .where(SubmissionORM.user_id == str(user_id))
        )
        return result.scalar() or 0

    async def count_problem_submissions(self, problem_id: UUID) -> int:
        result = await self._session.execute(
            select(func.count())
            .select_from(SubmissionORM)
            .where(SubmissionORM.problem_id == str(problem_id))
        )
        return result.scalar() or 0