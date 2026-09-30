"""Problem repository implementation (infrastructure implements domain port)."""
from typing import Optional, List
from uuid import UUID

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy.orm import selectinload

from app_new.domain.repositories.problems.problem_repository import ProblemRepository
from app_new.domain.entities.problems.problem import Problem
from app_new.domain.value_objects.problems import (
    Difficulty,
    ProblemCategory,
    ProblemSlug,
)
from app_new.infrastructure.database.orm.models import ProblemORM
from app_new.infrastructure.database.orm.mappers import ProblemMapper


class SQLAlchemyProblemRepository(ProblemRepository):
    """SQLAlchemy implementation of ProblemRepository."""

    def __init__(self, session: AsyncSession):
        self._session = session

    async def get_by_id(self, problem_id: UUID) -> Optional[Problem]:
        result = await self._session.execute(
            select(ProblemORM)
            .options(selectinload(ProblemORM.test_cases))
            .where(ProblemORM.id == str(problem_id))
        )
        orm = result.scalar_one_or_none()
        return ProblemMapper.to_domain(orm) if orm else None

    async def get_by_slug(self, slug: ProblemSlug) -> Optional[Problem]:
        result = await self._session.execute(
            select(ProblemORM)
            .options(selectinload(ProblemORM.test_cases))
            .where(ProblemORM.slug == slug.value)
        )
        orm = result.scalar_one_or_none()
        return ProblemMapper.to_domain(orm) if orm else None

    async def get_all(
        self,
        difficulty: Optional[Difficulty] = None,
        category: Optional[ProblemCategory] = None,
        published_only: bool = True,
        limit: int = 50,
        offset: int = 0,
    ) -> List[Problem]:
        stmt = (
            select(ProblemORM)
            .options(selectinload(ProblemORM.test_cases))
            .order_by(ProblemORM.created_at.desc())
            .limit(limit)
            .offset(offset)
        )
        if difficulty:
            stmt = stmt.where(ProblemORM.difficulty == difficulty)
        if category:
            stmt = stmt.where(ProblemORM.category == category)
        if published_only:
            stmt = stmt.where(ProblemORM.is_published.is_(True))

        result = await self._session.execute(stmt)
        return [ProblemMapper.to_domain(o) for o in result.scalars().all()]

    async def search(self, query: str, limit: int = 20) -> List[Problem]:
        pattern = f"%{query}%"
        stmt = (
            select(ProblemORM)
            .options(selectinload(ProblemORM.test_cases))
            .where(
                (ProblemORM.title.ilike(pattern)) | (ProblemORM.description.ilike(pattern))
            )
            .where(ProblemORM.is_published.is_(True))
            .order_by(ProblemORM.title)
            .limit(limit)
        )
        result = await self._session.execute(stmt)
        return [ProblemMapper.to_domain(o) for o in result.scalars().all()]

    async def add(self, problem: Problem) -> Problem:
        orm = ProblemMapper.to_orm(problem)
        self._session.add(orm)
        await self._session.flush()
        await self._session.refresh(orm, attribute_names=["test_cases"])
        return ProblemMapper.to_domain(orm)

    async def update(self, problem: Problem) -> Problem:
        result = await self._session.execute(
            select(ProblemORM)
            .options(selectinload(ProblemORM.test_cases))
            .where(ProblemORM.id == str(problem.id))
        )
        orm = result.scalar_one_or_none()
        if not orm:
            raise ValueError(f"Problem {problem.id} not found")

        orm.slug = problem.slug.value
        orm.title = problem.title.value
        orm.description = problem.description.value
        orm.difficulty = problem.difficulty
        orm.category = problem.category
        orm.testbench = problem.testbench.value
        orm.time_limit = problem.time_limit
        orm.memory_limit = problem.memory_limit
        orm.points = problem.points
        orm.tags = problem.tags
        orm.is_published = problem.is_published
        orm.updated_at = problem.updated_at

        await self._session.flush()
        return ProblemMapper.to_domain(orm)

    async def delete(self, problem_id: UUID) -> bool:
        result = await self._session.execute(
            select(ProblemORM).where(ProblemORM.id == str(problem_id))
        )
        orm = result.scalar_one_or_none()
        if not orm:
            return False
        await self._session.delete(orm)
        await self._session.flush()
        return True

    async def exists(self, problem_id: UUID) -> bool:
        result = await self._session.execute(
            select(func.count()).select_from(ProblemORM).where(
                ProblemORM.id == str(problem_id)
            )
        )
        return (result.scalar() or 0) > 0

    async def count(
        self,
        difficulty: Optional[Difficulty] = None,
        category: Optional[ProblemCategory] = None,
        published_only: bool = True,
    ) -> int:
        stmt = select(func.count()).select_from(ProblemORM)
        if difficulty:
            stmt = stmt.where(ProblemORM.difficulty == difficulty)
        if category:
            stmt = stmt.where(ProblemORM.category == category)
        if published_only:
            stmt = stmt.where(ProblemORM.is_published.is_(True))
        result = await self._session.execute(stmt)
        return result.scalar() or 0